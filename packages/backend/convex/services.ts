import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { locationValidator, serviceStatusValidator } from "./schema";
import { computeDriverCommission } from "./lib/constants";
import { requireDriver, requireRole, requireUser } from "./lib/auth";

/**
 * Crea una solicitud de servicio (cliente autenticado).
 * Calcula la comisión del chofer a partir del precio total.
 */
export const createService = mutation({
  args: {
    origin: locationValidator,
    destination: locationValidator,
    totalPrice: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.totalPrice <= 0) {
      throw new Error("El precio total debe ser mayor que 0.");
    }

    return await ctx.db.insert("services", {
      clientId: user._id,
      origin: args.origin,
      destination: args.destination,
      totalPrice: args.totalPrice,
      driverCommission: computeDriverCommission(args.totalPrice),
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

    await ctx.db.patch(service._id, {
      driverId: driver._id,
      status: "assigned",
      assignedAt: Date.now(),
    });
    await ctx.db.patch(driver._id, { status: "busy" });

    return service._id;
  },
});

/**
 * Transiciones de estado permitidas por parte del chofer.
 */
const DRIVER_TRANSITIONS: Record<Doc<"services">["status"], Doc<"services">["status"][]> = {
  pending: [],
  assigned: ["en_route", "cancelled"],
  en_route: ["finished", "cancelled"],
  finished: [],
  cancelled: [],
};

/**
 * Actualiza el estado de un servicio (chofer asignado).
 * Al finalizar: libera al chofer, suma viaje, genera el pago pendiente del
 * cliente y acumula la comisión en el payout del chofer.
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

    if (args.status === "en_route") {
      await ctx.db.patch(service._id, { status: "en_route" });
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
    await ctx.db.patch(service._id, {
      status: "finished",
      finishedAt: Date.now(),
    });
    await ctx.db.patch(driver._id, {
      status: "available",
      totalTrips: driver.totalTrips + 1,
    });

    await createPaymentForService(ctx, service);
    await accrueCommission(ctx, driver._id, service.driverCommission);

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

/**
 * Acumula la comisión en el payout pendiente del chofer (lo crea si no existe).
 */
async function accrueCommission(
  ctx: MutationCtx,
  driverId: Id<"drivers">,
  commission: number,
): Promise<void> {
  const payout = await ctx.db
    .query("payouts")
    .withIndex("by_driver_status", (q) =>
      q.eq("driverId", driverId).eq("status", "pending"),
    )
    .unique();

  if (payout === null) {
    await ctx.db.insert("payouts", {
      driverId,
      accumulatedAmount: commission,
      paidAmount: 0,
      status: "pending",
      periodStart: Date.now(),
    });
    return;
  }

  await ctx.db.patch(payout._id, {
    accumulatedAmount: payout.accumulatedAmount + commission,
  });
}
