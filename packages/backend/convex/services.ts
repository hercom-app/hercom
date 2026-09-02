import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { locationValidator, serviceRequestChannelValidator, serviceStatusValidator, serviceTypeValidator } from "./schema";
import { matchesOriginRegion, resolveCountryCode } from "./lib/regionFilters";
import { normalizeCountryCode } from "./data/countryCatalog";
import {
  computeClientAdvance,
  computePlatformCommission,
  PENDING_SERVICE_TTL_MS,
} from "./lib/constants";
import { getMarketByCountry } from "./lib/markets";
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
import { ensureServiceTracking } from "./serviceTracking";

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
    const origin = normalizeServiceLocation(args.origin);
    const destination = normalizeServiceLocation(args.destination);
    const market = await getMarketByCountry(ctx, origin.countryCode);
    if (args.basePrice < market.minServicePrice) {
      throw new Error(
        `La tarifa base mínima es ${market.currencySymbol}${market.minServicePrice} (${market.currencySymbol}${market.hourlyRate}/hora × ${market.minServiceHours}h mínimas).`,
      );
    }
    const extraDestinations = normalizeExtraDestinations(args.extraDestinations);
    const basePrice = normalizeMoney(args.basePrice);
    const { serviceType, requestChannel } = resolveServiceClassification(
      user.role,
      args.requestChannel,
    );
    const pricing = await buildServicePricingFields(ctx, basePrice, origin);

    return await ctx.db.insert("services", {
      clientId: user._id,
      origin,
      destination,
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
    const origin = normalizeServiceLocation(args.origin);
    const destination = normalizeServiceLocation(args.destination);
    const market = await getMarketByCountry(ctx, origin.countryCode);
    if (args.basePrice < market.minServicePrice) {
      throw new Error(
        `La tarifa base mínima es ${market.currencySymbol}${market.minServicePrice} (${market.currencySymbol}${market.hourlyRate}/hora × ${market.minServiceHours}h mínimas).`,
      );
    }
    const extraDestinations = normalizeExtraDestinations(args.extraDestinations);
    const basePrice = normalizeMoney(args.basePrice);
    const pricing = await buildServicePricingFields(ctx, basePrice, origin);

    return await ctx.db.insert("services", {
      clientId: args.clientId,
      origin,
      destination,
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
 * Solo muestra pending dentro del TTL (ver PENDING_SERVICE_TTL_MS).
 */
export const listOpenForOffers = query({
  args: {},
  handler: async (ctx) => {
    await requireDriver(ctx);
    const cutoff = Date.now() - PENDING_SERVICE_TTL_MS;
    // Incluye solicitudes propias: útil para QA con un solo equipo/cuenta.
    const pending = await ctx.db
      .query("services")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();
    return pending.filter((service) => service.requestedAt >= cutoff);
  },
});

/**
 * Cancela solicitudes pending más viejas que el TTL.
 * Invocado por cron cada 15 min.
 */
export const expireStalePending = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - PENDING_SERVICE_TTL_MS;
    const pending = await ctx.db
      .query("services")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    let expired = 0;
    const now = Date.now();
    for (const service of pending) {
      if (service.requestedAt < cutoff) {
        await ctx.db.patch(service._id, {
          status: "cancelled",
          cancelledAt: now,
        });
        expired += 1;
      }
    }
    return { expired };
  },
});

/**
 * DEMO: borra todos los servicios y ofertas, y libera choferes "busy".
 * Uso: `npx convex run services:purgeAllForDemo`
 */
export const purgeAllForDemo = internalMutation({
  args: {},
  handler: async (ctx) => {
    const offers = await ctx.db.query("serviceOffers").collect();
    for (const offer of offers) {
      await ctx.db.delete(offer._id);
    }
    const services = await ctx.db.query("services").collect();
    for (const service of services) {
      await ctx.db.delete(service._id);
    }

    // Al borrar viajes a mano, el chofer puede quedar "busy" sin servicio.
    const drivers = await ctx.db.query("drivers").collect();
    let releasedDrivers = 0;
    for (const driver of drivers) {
      if (driver.status === "busy") {
        await ctx.db.patch(driver._id, { status: "available" });
        releasedDrivers += 1;
      }
    }

    return {
      deletedOffers: offers.length,
      deletedServices: services.length,
      releasedDrivers,
    };
  },
});

/**
 * DEMO: deja solo el servicio más reciente (el que acabas de pedir) y borra el resto.
 * Uso: `npx convex run services:keepLatestForDemo`
 */
export const keepLatestForDemo = internalMutation({
  args: {},
  handler: async (ctx) => {
    const services = await ctx.db.query("services").collect();
    if (services.length === 0) {
      return { kept: null, deletedServices: 0 };
    }
    services.sort((a, b) => b.requestedAt - a.requestedAt);
    const keep = services[0]!;
    const toDelete = services.slice(1);
    const deleteIds = new Set(toDelete.map((service) => service._id));

    const relatedTables = [
      "serviceOffers",
      "serviceTracking",
      "payments",
      "serviceRatings",
      "serviceVehicleChecklists",
    ] as const;
    for (const table of relatedTables) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) {
        if (deleteIds.has(row.serviceId)) {
          await ctx.db.delete(row._id);
        }
      }
    }

    const notifications = await ctx.db.query("notifications").collect();
    for (const notification of notifications) {
      if (
        notification.serviceId !== undefined &&
        deleteIds.has(notification.serviceId)
      ) {
        await ctx.db.delete(notification._id);
      }
    }

    const walletTx = await ctx.db.query("walletTransactions").collect();
    for (const tx of walletTx) {
      if (tx.serviceId !== undefined && deleteIds.has(tx.serviceId)) {
        await ctx.db.delete(tx._id);
      }
    }

    for (const service of toDelete) {
      await ctx.db.delete(service._id);
    }

    const keepDriverId = keep.driverId;
    const drivers = await ctx.db.query("drivers").collect();
    let releasedDrivers = 0;
    for (const driver of drivers) {
      if (driver.status !== "busy") {
        continue;
      }
      if (keepDriverId !== undefined && driver._id === keepDriverId) {
        continue;
      }
      await ctx.db.patch(driver._id, { status: "available" });
      releasedDrivers += 1;
    }

    return {
      kept: {
        serviceId: keep._id,
        status: keep.status,
        origin: keep.origin.address,
        destination: keep.destination.address,
        requestedAt: keep.requestedAt,
      },
      deletedServices: toDelete.length,
      releasedDrivers,
    };
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
      await ensureServiceTracking(ctx, service._id);
      await createNotification(ctx, {
        userId: service.clientId,
        type: "driver_heading_pickup",
        title: "Tu chofer salió a recogerte",
        message: "El chofer va en camino al punto de partida. Puedes ver su ubicación en vivo.",
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
    if (
      !checklist.hasPropertyCard ||
      !checklist.hasSoat ||
      checklist.hasTechnicalInspection !== true
    ) {
      throw new Error(
        "Checklist incompleto: confirma Tarjeta de Propiedad, SOAT y Revisión técnica.",
      );
    }

    await ctx.db.patch(service._id, {
      status: "in_progress",
      departedWithClientAt: Date.now(),
      currentStopIndex: 0,
    });
    await ensureServiceTracking(ctx, service._id);
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
    const services = await ctx.db
      .query("services")
      .withIndex("by_client", (q) => q.eq("clientId", user._id))
      .order("desc")
      .collect();

    return await Promise.all(
      services.map(async (service) => {
        let driverName: string | undefined;
        if (service.driverId !== undefined) {
          const driver = await ctx.db.get(service.driverId);
          if (driver !== null) {
            const driverUser = await ctx.db.get(driver.userId);
            driverName =
              driver.fullName?.trim() ||
              driverUser?.name?.trim() ||
              "Chofer";
          }
        }
        const rating =
          service.status === "finished"
            ? await ctx.db
                .query("serviceRatings")
                .withIndex("by_service", (q) => q.eq("serviceId", service._id))
                .unique()
            : null;

        return {
          ...service,
          driverName,
          clientRating: rating?.score,
        };
      }),
    );
  },
});

/**
 * Cliente edita origen y/o destino solo mientras el viaje está en curso.
 */
export const updateTripLocations = mutation({
  args: {
    serviceId: v.id("services"),
    origin: v.optional(locationValidator),
    destination: v.optional(locationValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null) {
      throw new Error("Servicio no encontrado.");
    }
    if (service.clientId !== user._id) {
      throw new Error("No autorizado para editar este viaje.");
    }
    if (service.status !== "in_progress") {
      throw new Error(
        "Solo puedes editar partida o destino mientras el viaje está en curso.",
      );
    }
    if (args.origin === undefined && args.destination === undefined) {
      throw new Error("Indica el nuevo punto de partida o destino.");
    }

    const origin =
      args.origin !== undefined ? normalizeLocation(args.origin) : undefined;
    const destination =
      args.destination !== undefined
        ? normalizeLocation(args.destination)
        : undefined;

    await ctx.db.patch(service._id, {
      ...(origin !== undefined ? { origin } : {}),
      ...(destination !== undefined ? { destination } : {}),
    });

    if (service.driverId !== undefined) {
      const driver = await ctx.db.get(service.driverId);
      if (driver !== null) {
        const parts: string[] = [];
        if (origin !== undefined) {
          parts.push(`partida: ${origin.address}`);
        }
        if (destination !== undefined) {
          parts.push(`destino: ${destination.address}`);
        }
        await createNotification(ctx, {
          userId: driver.userId,
          type: "trip_route_updated",
          title: "El cliente actualizó la ruta",
          message: `Nueva ruta — ${parts.join(" · ")}.`,
          serviceId: service._id,
        });
      }
    }

    return service._id;
  },
});

/**
 * Ganancias del chofer: viajes finalizados, comisión (descuento) y neto.
 */
export const listEarningsForDriver = query({
  args: {},
  handler: async (ctx) => {
    const { driver } = await requireDriver(ctx);
    const services = await ctx.db
      .query("services")
      .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
      .collect();

    const trips = services
      .filter(
        (service) =>
          service.status === "finished" && service.finishedAt !== undefined,
      )
      .map((service) => {
        const fare = normalizeMoney(service.offeredPrice ?? service.totalPrice);
        const commission = normalizeMoney(service.driverCommission);
        return {
          serviceId: service._id,
          finishedAt: service.finishedAt as number,
          origin: service.origin.address,
          destination: service.destination.address,
          fare,
          commission,
          net: normalizeMoney(fare - commission),
        };
      })
      .sort((a, b) => b.finishedAt - a.finishedAt);

    const todayKey = limaDateKey(Date.now());
    const todayTrips = trips.filter(
      (trip) => limaDateKey(trip.finishedAt) === todayKey,
    );
    const weekKeys = limaWeekKeys(7);
    const weekTrips = trips.filter((trip) =>
      weekKeys.includes(limaDateKey(trip.finishedAt)),
    );
    const byDay = weekKeys.map((dayKey) => {
      const dayTrips = weekTrips.filter(
        (trip) => limaDateKey(trip.finishedAt) === dayKey,
      );
      return {
        dayKey,
        trips: dayTrips.length,
        fare: sumMoney(dayTrips.map((trip) => trip.fare)),
        commission: sumMoney(dayTrips.map((trip) => trip.commission)),
        net: sumMoney(dayTrips.map((trip) => trip.net)),
      };
    });

    return {
      today: {
        dayKey: todayKey,
        trips: todayTrips,
        fare: sumMoney(todayTrips.map((trip) => trip.fare)),
        commission: sumMoney(todayTrips.map((trip) => trip.commission)),
        net: sumMoney(todayTrips.map((trip) => trip.net)),
      },
      week: {
        days: byDay,
        trips: weekTrips.length,
        fare: sumMoney(weekTrips.map((trip) => trip.fare)),
        commission: sumMoney(weekTrips.map((trip) => trip.commission)),
        net: sumMoney(weekTrips.map((trip) => trip.net)),
      },
    };
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
    countryCode: v.optional(v.string()),
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
      args.countryCode !== undefined ||
      args.department !== undefined ||
      args.province !== undefined ||
      args.district !== undefined
    ) {
      services = services.filter((service) =>
        matchesOriginRegion(service.origin, {
          countryCode: args.countryCode,
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

function sumMoney(amounts: number[]): number {
  return normalizeMoney(amounts.reduce((sum, amount) => sum + amount, 0));
}

function limaDateKey(timestamp: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
}

function limaWeekKeys(days: number): string[] {
  const keys: string[] = [];
  const now = Date.now();
  for (let offset = 0; offset < days; offset += 1) {
    keys.push(limaDateKey(now - offset * 24 * 60 * 60 * 1000));
  }
  return keys;
}

function normalizeLocation(location: LocationInput): LocationInput {
  const countryCode = normalizeCountryCode(location.countryCode);
  return {
    address: location.address.trim(),
    lat: location.lat,
    lng: location.lng,
    countryCode,
    ...(location.department !== undefined
      ? { department: location.department }
      : {}),
    ...(location.province !== undefined ? { province: location.province } : {}),
    ...(location.district !== undefined ? { district: location.district } : {}),
  };
}

const normalizeServiceLocation = normalizeLocation;

type LocationInput = {
  address: string;
  lat: number;
  lng: number;
  countryCode?: string;
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
    countryCode?: string;
    department?: string;
    province?: string;
    district?: string;
  },
) {
  const market = await getMarketByCountry(ctx, origin.countryCode);
  const catalogBasePrice = normalizeMoney(
    Math.max(listBasePrice, market.minServicePrice),
  );
  const applied = await applyPromotionToListPrice(ctx, catalogBasePrice, {
    countryCode: resolveCountryCode(origin),
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

