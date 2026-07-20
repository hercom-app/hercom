import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { locationValidator, serviceRequestChannelValidator, serviceStatusValidator, serviceTypeValidator } from "./schema";
import { matchesOriginRegion } from "./lib/regionFilters";
import {
  computeClientAdvance,
  computePlatformCommission,
  HOURLY_SERVICE_RATE_PEN,
  MIN_SERVICE_HOURS,
  MIN_SERVICE_PRICE_PEN,
} from "./lib/constants";
import { applyPromotionToListPrice } from "./lib/promotions";
import {
  computeClientTotalForOffer,
  computePlatformCommissionForService,
} from "./lib/pricing";
import { requireDriver, requireRole, requireUser } from "./lib/auth";
import {
  debitCommissionForService,
  hasSufficientBalance,
} from "./driverWallets";
import { createNotification } from "./notifications";
import { getCurrentStop, getServiceStops } from "./lib/serviceStops";

/**
 * Crea una solicitud de servicio (cliente autenticado).
 * Calcula la comisión del chofer a partir del precio total.
 */
export const createService = mutation({
  args: {
    origin: locationValidator,
    destination: locationValidator,
    extraDestinations: v.optional(v.array(locationValidator)),
    basePrice: v.number(),
    notes: v.optional(v.string()),
    requestChannel: v.optional(serviceRequestChannelValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.basePrice < MIN_SERVICE_PRICE_PEN) {
      throw new Error(
        `La tarifa base mínima es S/${MIN_SERVICE_PRICE_PEN} (S/${HOURLY_SERVICE_RATE_PEN}/hora × ${MIN_SERVICE_HOURS}h mínimas).`,
      );
    }
    const extraDestinations = normalizeExtraDestinations(args.extraDestinations);
    const basePrice = normalizeMoney(args.basePrice);
    const { serviceType, requestChannel } = resolveServiceClassification(
      user.role,
      args.requestChannel,
    );
    const pricing = await buildServicePricingFields(ctx, basePrice, args.origin);

    return await ctx.db.insert("services", {
      clientId: user._id,
      origin: args.origin,
      destination: args.destination,
      ...(extraDestinations !== undefined ? { extraDestinations } : {}),
      ...pricing,
      serviceType,
      requestChannel,
      status: "pending",
      ...(args.notes !== undefined ? { notes: args.notes } : {}),
      requestedAt: Date.now(),
    });
  },
});

/**
 * Admin registra solicitud premium (teléfono o web comercial en nombre del cliente).
 */
export const createPremiumServiceAsAdmin = mutation({
  args: {
    clientId: v.id("users"),
    origin: locationValidator,
    destination: locationValidator,
    extraDestinations: v.optional(v.array(locationValidator)),
    basePrice: v.number(),
    requestChannel: v.union(
      v.literal("phone"),
      v.literal("web_comercial"),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    const client = await ctx.db.get(args.clientId);
    if (client === null) {
      throw new Error("Cliente no encontrado.");
    }
    if (args.basePrice < MIN_SERVICE_PRICE_PEN) {
      throw new Error(
        `La tarifa base mínima es S/${MIN_SERVICE_PRICE_PEN} (S/${HOURLY_SERVICE_RATE_PEN}/hora × ${MIN_SERVICE_HOURS}h mínimas).`,
      );
    }
    const extraDestinations = normalizeExtraDestinations(args.extraDestinations);
    const basePrice = normalizeMoney(args.basePrice);
    const pricing = await buildServicePricingFields(ctx, basePrice, args.origin);

    return await ctx.db.insert("services", {
      clientId: args.clientId,
      origin: args.origin,
      destination: args.destination,
      ...(extraDestinations !== undefined ? { extraDestinations } : {}),
      ...pricing,
      serviceType: "premium",
      requestChannel: args.requestChannel,
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
    const offeredPrice = service.catalogBasePrice ?? service.basePrice;
    const clientTotal = computeClientTotalForOffer(
      offeredPrice,
      service.discountRate,
    );
    const commission = computePlatformCommissionForService(
      offeredPrice,
      service.discountRate,
    );
    const advanceAmount = computeClientAdvance(offeredPrice);
    await ctx.db.patch(service._id, {
      driverId: driver._id,
      offeredPrice,
      totalPrice: clientTotal,
      driverCommission: commission,
      advanceAmount,
      securityCode,
      status: "assigned",
      assignedAt: Date.now(),
    });
    await ctx.db.patch(driver._id, { status: "busy" });
    await createNotification(ctx, {
      userId: driver.userId,
      type: "trip_confirmed_driver",
      title: "Viaje confirmado",
      message: `Se te asignó un viaje. Anticipo a recibir: S/${advanceAmount.toFixed(2)} (25%). Código de inicio: ${securityCode}.`,
      serviceId: service._id,
    });
    await createNotification(ctx, {
      userId: service.clientId,
      type: "trip_confirmed_client",
      title: "Chofer confirmado",
      message: `Tu viaje ya tiene chofer asignado. Entrega S/${advanceAmount.toFixed(2)} de anticipo (25%) antes de que salga. Código de inicio: ${securityCode}.`,
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
    // Incluye solicitudes propias: útil para QA con un solo equipo/cuenta.
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
 * Chofer confirma que el cliente le entregó el anticipo del 25% antes de salir.
 */
export const confirmAdvanceReceived = mutation({
  args: {
    serviceId: v.id("services"),
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
    if (service.status !== "assigned") {
      throw new Error("Solo puedes confirmar anticipo en servicios asignados.");
    }
    if (service.advanceConfirmedAt !== undefined) {
      return service._id;
    }
    if (service.offeredPrice === undefined) {
      throw new Error("Este servicio no tiene tarifa ofertada definida.");
    }

    const advanceAmount =
      service.advanceAmount ?? computeClientAdvance(service.offeredPrice);
    const now = Date.now();
    await ctx.db.patch(service._id, {
      advanceAmount,
      advanceConfirmedAt: now,
    });
    await createNotification(ctx, {
      userId: service.clientId,
      type: "advance_confirmed",
      title: "Anticipo confirmado",
      message: `El chofer confirmó que recibió el anticipo de S/${advanceAmount.toFixed(2)} (25%).`,
      serviceId: service._id,
    });
    return service._id;
  },
});

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
      if (service.advanceConfirmedAt === undefined) {
        const advanceAmount =
          service.advanceAmount ??
          (service.offeredPrice !== undefined
            ? computeClientAdvance(service.offeredPrice)
            : 0);
        throw new Error(
          `Debes confirmar que recibiste el anticipo del 25% (S/${advanceAmount.toFixed(2)}) antes de salir a recoger.`,
        );
      }
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
    const checklist = await ctx.db
      .query("serviceVehicleChecklists")
      .withIndex("by_service", (q) => q.eq("serviceId", service._id))
      .unique();
    if (checklist === null) {
      throw new Error("Debes completar el checklist de recojo antes de iniciar.");
    }
    if (!checklist.hasPropertyCard || !checklist.hasSoat) {
      throw new Error(
        "Checklist incompleto: confirma Tarjeta de Propiedad y SOAT antes de iniciar.",
      );
    }

    await ctx.db.patch(service._id, {
      status: "in_progress",
      departedWithClientAt: Date.now(),
      currentStopIndex: 0,
    });
    return {
      serviceId: service._id,
      navigationTarget: getCurrentStop({
        ...service,
        currentStopIndex: 0,
      }),
    };
  },
});

/**
 * Chofer confirma llegada a la parada actual; avanza a la siguiente o cierra el viaje.
 */
export const arriveAtCurrentStop = mutation({
  args: {
    serviceId: v.id("services"),
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
    if (service.status !== "in_progress" && service.status !== "en_route") {
      throw new Error("El viaje no está en curso.");
    }

    const stops = getServiceStops(service);
    const currentIndex = service.currentStopIndex ?? 0;
    if (currentIndex >= stops.length - 1) {
      await ctx.db.patch(service._id, {
        status: "arrived_destination",
        arrivedDestinationAt: Date.now(),
      });
      return { hasMoreStops: false as const };
    }

    const nextIndex = currentIndex + 1;
    await ctx.db.patch(service._id, { currentStopIndex: nextIndex });
    return {
      hasMoreStops: true as const,
      navigationTarget: stops[nextIndex]!,
      stopNumber: nextIndex + 1,
      totalStops: stops.length,
    };
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
    serviceType: v.optional(serviceTypeValidator),
    requestChannel: v.optional(serviceRequestChannelValidator),
    department: v.optional(v.string()),
    province: v.optional(v.string()),
    district: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    let services = await ctx.db.query("services").order("desc").collect();
    if (args.serviceType !== undefined) {
      if (args.serviceType === "app") {
        services = services.filter(
          (service) => (service.serviceType ?? "app") === "app",
        );
      } else {
        services = services.filter((service) => service.serviceType === "premium");
      }
    }
    if (args.requestChannel !== undefined) {
      services = services.filter(
        (service) => service.requestChannel === args.requestChannel,
      );
    }
    if (args.status !== undefined) {
      const status = args.status;
      services = services.filter((service) => service.status === status);
    }
    if (
      args.department !== undefined ||
      args.province !== undefined ||
      args.district !== undefined
    ) {
      services = services.filter((service) =>
        matchesOriginRegion(service.origin, {
          department: args.department,
          province: args.province,
          district: args.district,
        }),
      );
    }
    return services;
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
  const advanceAmount = service.advanceAmount ?? 0;
  const balanceDue = normalizeMoney(Math.max(service.totalPrice - advanceAmount, 0));
  await ctx.db.insert("payments", {
    serviceId: service._id,
    clientId: service.clientId,
    amount: balanceDue,
    status: "pending",
  });
}

function normalizeMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

type LocationInput = {
  address: string;
  lat: number;
  lng: number;
  department?: string;
  province?: string;
  district?: string;
};

function normalizeExtraDestinations(
  extraDestinations?: LocationInput[],
): LocationInput[] | undefined {
  if (extraDestinations === undefined) {
    return undefined;
  }
  const cleaned = extraDestinations
    .map((stop) => ({ ...stop, address: stop.address.trim() }))
    .filter((stop) => stop.address !== "");
  return cleaned.length > 0 ? cleaned : undefined;
}

function generateSecurityCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

type ServiceClassification = {
  serviceType: "app" | "premium";
  requestChannel: "mobile_app" | "web_comercial" | "phone";
};

function resolveServiceClassification(
  userRole: Doc<"users">["role"],
  requestChannel?: "mobile_app" | "web_comercial" | "phone",
): ServiceClassification {
  if (requestChannel === "phone") {
    if (userRole !== "admin") {
      throw new Error(
        "Solo un administrador puede registrar solicitudes premium por teléfono.",
      );
    }
    return { serviceType: "premium", requestChannel: "phone" };
  }
  if (requestChannel === "web_comercial") {
    return { serviceType: "premium", requestChannel: "web_comercial" };
  }
  return { serviceType: "app", requestChannel: "mobile_app" };
}

async function buildServicePricingFields(
  ctx: MutationCtx,
  listBasePrice: number,
  origin: {
    department?: string;
    province?: string;
    district?: string;
  },
) {
  const catalogBasePrice = normalizeMoney(
    Math.max(listBasePrice, MIN_SERVICE_PRICE_PEN),
  );
  const applied = await applyPromotionToListPrice(ctx, catalogBasePrice, {
    department: origin.department ?? "",
    province: origin.province,
    district: origin.district,
  });

  if (applied === null) {
    return {
      catalogBasePrice,
      basePrice: catalogBasePrice,
      totalPrice: catalogBasePrice,
      driverCommission: computePlatformCommission(catalogBasePrice),
    };
  }

  return {
    promotionId: applied.promotionId,
    promotionName: applied.promotionName,
    catalogBasePrice: applied.catalogBasePrice,
    basePrice: applied.basePrice,
    discountRate: applied.discountRate,
    totalPrice: applied.basePrice,
    driverCommission: applied.driverCommissionEstimate,
  };
}

