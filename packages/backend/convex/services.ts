import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { locationValidator, serviceStatusValidator } from "./schema";
import { computePlatformCommission, MIN_SERVICE_PRICE_PEN } from "./lib/constants";
import { requireDriver, requireRole, requireUser } from "./lib/auth";
import {
  debitCommissionForService,
  hasSufficientBalance,
} from "./driverWallets";
import { createNotification } from "./notifications";

/**
 * Crea una solicitud de servicio (cliente autenticado).
 * Calcula la comisión del chofer a partir del precio total.
 */
export const createService = mutation({
  args: {
    origin: locationValidator,
    destination: locationValidator,
    basePrice: v.number(),
    tipAmount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.basePrice < MIN_SERVICE_PRICE_PEN) {
      throw new Error(
        `La tarifa base mínima del servicio es S/${MIN_SERVICE_PRICE_PEN}.`,
      );
    }
    const tipAmount = normalizeMoney(args.tipAmount ?? 0);
    if (tipAmount < 0) {
      throw new Error("La propina no puede ser negativa.");
    }
    const basePrice = normalizeMoney(args.basePrice);

    return await ctx.db.insert("services", {
      clientId: user._id,
      origin: args.origin,
      destination: args.destination,
      basePrice,
      tipAmount,
      totalPrice: normalizeMoney(basePrice + tipAmount),
      // Se mantiene el nombre del campo por compatibilidad, pero aquí guardamos
      // la comisión de plataforma que se descontará del saldo del chofer.
      driverCommission: computePlatformCommission(basePrice),
      status: "pending",
      ...(args.notes !== undefined ? { notes: args.notes } : {}),
      requestedAt: Date.now(),
    });
  },
});

/**
 * Asigna un chofer a un servicio pendiente (panel admin).
 * Marca al chofer como ocupado.
 */
export const assignDriver = mutation({
  args: {
    serviceId: v.id("services"),
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");

    const service = await ctx.db.get(args.serviceId);
    if (service === null) {
      throw new Error("Servicio no encontrado.");
    }
    if (service.status !== "pending") {
      throw new Error("Solo se pueden asignar servicios pendientes.");
    }

    const driver = await ctx.db.get(args.driverId);
    if (driver === null) {
      throw new Error("Chofer no encontrado.");
    }
    if (driver.status !== "available") {
      throw new Error("El chofer no está disponible.");
    }
    const enoughBalance = await hasSufficientBalance(
      ctx,
      driver._id,
      service.driverCommission,
    );
    if (!enoughBalance) {
      throw new Error(
        "Saldo insuficiente del chofer para este servicio según regla de límite mínimo S/-10.",
      );
    }

    const securityCode = generateSecurityCode();
    await ctx.db.patch(service._id, {
      driverId: driver._id,
      offeredPrice: service.basePrice,
      totalPrice: normalizeMoney(service.basePrice + service.tipAmount),
      driverCommission: computePlatformCommission(service.basePrice),
      securityCode,
      status: "assigned",
      assignedAt: Date.now(),
    });
    await ctx.db.patch(driver._id, { status: "busy" });
    await createNotification(ctx, {
      userId: driver.userId,
      type: "trip_confirmed_driver",
      title: "Viaje confirmado",
      message: `Se te asignó un viaje. Código de inicio: ${securityCode}.`,
      serviceId: service._id,
    });
    await createNotification(ctx, {
      userId: service.clientId,
      type: "trip_confirmed_client",
      title: "Chofer confirmado",
      message: `Tu viaje ya tiene chofer asignado. Código de inicio: ${securityCode}.`,
      serviceId: service._id,
    });

    return service._id;
  },
});

/**
 * Servicios abiertos para que choferes disponibles puedan ofertar tarifa.
 */
export const listOpenForOffers = query({
  args: {},
  handler: async (ctx) => {
    await requireDriver(ctx);
    return await ctx.db
      .query("services")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();
  },
});

/**
 * Transiciones de estado permitidas por parte del chofer.
 * Nota: `en_route` se conserva por compatibilidad con datos legacy.
 */
const DRIVER_TRANSITIONS: Record<Doc<"services">["status"], Doc<"services">["status"][]> = {
  pending: [],
  assigned: ["heading_to_pickup", "cancelled"],
  heading_to_pickup: ["arrived_pickup", "cancelled"],
  arrived_pickup: ["in_progress", "cancelled"],
  in_progress: ["arrived_destination", "cancelled"],
  arrived_destination: ["finished"],
  en_route: ["arrived_destination", "finished", "cancelled"],
  finished: [],
  cancelled: [],
};

/**
 * Actualiza el estado de un servicio (chofer asignado).
 * Al finalizar: libera al chofer, suma viaje, descuenta comisión de app y
 * genera el pago pendiente del cliente.
 */
export const updateStatus = mutation({
  args: {
    serviceId: v.id("services"),
    status: serviceStatusValidator,
  },
  handler: async (ctx, args) => {
    const { driver } = await requireDriver(ctx);

    const service = await ctx.db.get(args.serviceId);
    if (service === null) {
      throw new Error("Servicio no encontrado.");
    }
    if (service.driverId !== driver._id) {
      throw new Error("Este servicio no está asignado a ti.");
    }

    const allowed = DRIVER_TRANSITIONS[service.status];
    if (!allowed.includes(args.status)) {
      throw new Error(
        `Transición no permitida: ${service.status} -> ${args.status}.`,
      );
    }

    if (args.status === "in_progress") {
      throw new Error(
        "Para iniciar viaje debes validar el código de seguridad (startTripWithCode).",
      );
    }

    if (args.status === "heading_to_pickup") {
      await ctx.db.patch(service._id, {
        status: "heading_to_pickup",
        headingToPickupAt: Date.now(),
      });
      await createNotification(ctx, {
        userId: service.clientId,
        type: "driver_heading_pickup",
        title: "Tu chofer salió a recogerte",
        message: "El chofer va en camino al punto de partida.",
        serviceId: service._id,
      });
      return service._id;
    }

    if (args.status === "arrived_pickup") {
      await ctx.db.patch(service._id, {
        status: "arrived_pickup",
        arrivedPickupAt: Date.now(),
      });
      await createNotification(ctx, {
        userId: service.clientId,
        type: "driver_arrived_pickup",
        title: "Tu chofer ya llegó",
        message: "El chofer llegó al punto de partida. Comparte el código para iniciar.",
        serviceId: service._id,
      });
      return service._id;
    }

    if (args.status === "arrived_destination") {
      await ctx.db.patch(service._id, {
        status: "arrived_destination",
        arrivedDestinationAt: Date.now(),
      });
      return service._id;
    }

    if (args.status === "cancelled") {
      await ctx.db.patch(service._id, {
        status: "cancelled",
        cancelledAt: Date.now(),
      });
      await ctx.db.patch(driver._id, { status: "available" });
      return service._id;
    }

    // args.status === "finished"
    await debitCommissionForService(ctx, {
      driverId: driver._id,
      serviceId: service._id,
      amount: service.driverCommission,
    });
    await ctx.db.patch(service._id, {
      status: "finished",
      finishedAt: Date.now(),
    });
    await ctx.db.patch(driver._id, {
      status: "available",
      totalTrips: driver.totalTrips + 1,
    });

    await createPaymentForService(ctx, service);

    return service._id;
  },
});

/**
 * Inicia el viaje validando el código de seguridad entre cliente y chofer.
 */
export const startTripWithCode = mutation({
  args: {
    serviceId: v.id("services"),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const { driver } = await requireDriver(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null) {
      throw new Error("Servicio no encontrado.");
    }
    if (service.driverId !== driver._id) {
      throw new Error("Este servicio no está asignado a ti.");
    }
    if (service.status !== "arrived_pickup") {
      throw new Error("El servicio aún no está listo para iniciar viaje.");
    }
    if (service.securityCode === undefined) {
      throw new Error("Este servicio no tiene código de seguridad.");
    }
    if (args.code.trim() !== service.securityCode) {
      throw new Error("Código de seguridad incorrecto.");
    }

    await ctx.db.patch(service._id, {
      status: "in_progress",
      departedWithClientAt: Date.now(),
    });
    return service._id;
  },
});

/**
 * Cancela un servicio (cliente dueño o admin). Libera al chofer si lo había.
 */
export const cancelService = mutation({
  args: {
    serviceId: v.id("services"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null) {
      throw new Error("Servicio no encontrado.");
    }

    const isOwner = service.clientId === user._id;
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin) {
      throw new Error("No autorizado para cancelar este servicio.");
    }
    if (service.status === "finished" || service.status === "cancelled") {
      throw new Error("El servicio ya está finalizado o cancelado.");
    }

    await ctx.db.patch(service._id, {
      status: "cancelled",
      cancelledAt: Date.now(),
    });
    if (service.driverId !== undefined) {
      await ctx.db.patch(service.driverId, { status: "available" });
    }
    return service._id;
  },
});

/**
 * Servicios del chofer autenticado (app móvil, reactivo).
 */
export const listForDriver = query({
  args: {
    status: v.optional(serviceStatusValidator),
  },
  handler: async (ctx, args) => {
    const { driver } = await requireDriver(ctx);
    if (args.status !== undefined) {
      const status = args.status;
      return await ctx.db
        .query("services")
        .withIndex("by_driver_status", (q) =>
          q.eq("driverId", driver._id).eq("status", status),
        )
        .order("desc")
        .collect();
    }
    return await ctx.db
      .query("services")
      .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
      .order("desc")
      .collect();
  },
});

/**
 * Servicios del cliente autenticado.
 */
export const listForClient = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("services")
      .withIndex("by_client", (q) => q.eq("clientId", user._id))
      .order("desc")
      .collect();
  },
});

/**
 * Detalle de un servicio (cliente dueño, chofer asignado o admin).
 */
export const getById = query({
  args: { serviceId: v.id("services") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null) {
      return null;
    }
    if (user.role === "admin" || service.clientId === user._id) {
      return service;
    }
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (driver !== null && service.driverId === driver._id) {
      return service;
    }
    throw new Error("No autorizado para ver este servicio.");
  },
});

/**
 * Todos los servicios para el panel admin, con filtro opcional por estado.
 */
export const listAllForAdmin = query({
  args: {
    status: v.optional(serviceStatusValidator),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    if (args.status !== undefined) {
      const status = args.status;
      return await ctx.db
        .query("services")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("services").order("desc").collect();
  },
});

// ---------------------------------------------------------------------------
// Helpers internos (no exportados como funciones de Convex).
// ---------------------------------------------------------------------------

/**
 * Crea el registro de pago pendiente del cliente al finalizar el servicio.
 * Idempotente: no duplica si ya existe un pago para el servicio.
 */
async function createPaymentForService(
  ctx: MutationCtx,
  service: Doc<"services">,
): Promise<void> {
  const existing = await ctx.db
    .query("payments")
    .withIndex("by_service", (q) => q.eq("serviceId", service._id))
    .unique();
  if (existing !== null) {
    return;
  }
  await ctx.db.insert("payments", {
    serviceId: service._id,
    clientId: service.clientId,
    amount: service.totalPrice,
    status: "pending",
  });
}

function normalizeMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function generateSecurityCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

