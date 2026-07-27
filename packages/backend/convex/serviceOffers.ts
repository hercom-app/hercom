import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { computeClientAdvance } from "./lib/constants";
import {
  computeClientTotalForOffer,
  computePlatformCommissionForService,
  getMinimumOfferPrice,
} from "./lib/pricing";
import { requireDriver, requireUser } from "./lib/auth";
import { hasSufficientBalance } from "./driverWallets";
import { createNotification } from "./notifications";

function normalizeMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function generateSecurityCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * Chofer envía oferta para un servicio pendiente (una sola vez por servicio).
 * Errores de negocio (saldo, disponibilidad, etc.) se devuelven como `{ ok: false }`
 * para mostrar alerta en la app sin aparecer como fallo Convex.
 */
export const submitMyOffer = mutation({
  args: {
    serviceId: v.id("services"),
    offeredPrice: v.number(),
  },
  handler: async (ctx, args) => {
    const { driver } = await requireDriver(ctx);
    if (driver.status !== "available") {
      return {
        ok: false as const,
        message: "Debes estar disponible para ofertar.",
      };
    }

    const service = await ctx.db.get(args.serviceId);
    if (service === null) {
      return { ok: false as const, message: "Servicio no encontrado." };
    }
    // Demo/QA: se permite ofertar en solicitud propia (un solo equipo).
    if (service.status !== "pending") {
      return {
        ok: false as const,
        message: "Solo puedes ofertar servicios pendientes.",
      };
    }
    if (service.driverId !== undefined) {
      return {
        ok: false as const,
        message: "Este servicio ya tiene chofer asignado.",
      };
    }

    const offeredPrice = normalizeMoney(args.offeredPrice);
    const minOffer = getMinimumOfferPrice(service);
    if (offeredPrice < minOffer) {
      return {
        ok: false as const,
        message: `La oferta debe ser mayor o igual a la tarifa de lista S/${minOffer.toFixed(2)}.`,
      };
    }

    const projectedCommission = computePlatformCommissionForService(
      offeredPrice,
      service.discountRate,
    );
    const enoughBalance = await hasSufficientBalance(
      ctx,
      driver._id,
      projectedCommission,
    );
    if (!enoughBalance) {
      return {
        ok: false as const,
        message:
          "Saldo insuficiente para cubrir la comisión de esta oferta. Recarga primero.",
      };
    }

    const existing = await ctx.db
      .query("serviceOffers")
      .withIndex("by_service_driver", (q) =>
        q.eq("serviceId", service._id).eq("driverId", driver._id),
      )
      .unique();

    if (existing !== null) {
      return {
        ok: false as const,
        message: "Ya enviaste una oferta para esta solicitud.",
      };
    }

    const offerId = await ctx.db.insert("serviceOffers", {
      serviceId: service._id,
      driverId: driver._id,
      offeredPrice,
      status: "pending",
      createdAt: Date.now(),
    });
    await createNotification(ctx, {
      userId: service.clientId,
      type: "offer_received",
      title: "Nueva oferta recibida",
      message: `Recibiste una oferta de S/${offeredPrice.toFixed(2)} para tu viaje.`,
      serviceId: service._id,
    });
    return { ok: true as const, offerId };
  },
});

/**
 * Ofertas pending del chofer autenticado (para no re-ofertar y mostrar monto).
 */
export const listMinePending = query({
  args: {},
  handler: async (ctx) => {
    const { driver } = await requireDriver(ctx);
    const offers = await ctx.db
      .query("serviceOffers")
      .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
      .collect();
    return offers
      .filter((offer) => offer.status === "pending")
      .map((offer) => ({
        serviceId: offer.serviceId,
        offeredPrice: offer.offeredPrice,
        createdAt: offer.createdAt,
      }));
  },
});

/**
 * Cliente lista ofertas de su servicio pendiente.
 */
export const listForServiceAsClient = query({
  args: {
    serviceId: v.id("services"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null) {
      throw new Error("Servicio no encontrado.");
    }
    if (service.clientId !== user._id) {
      throw new Error("No autorizado para ver ofertas de este servicio.");
    }
    const offers = await ctx.db
      .query("serviceOffers")
      .withIndex("by_service", (q) => q.eq("serviceId", service._id))
      .order("desc")
      .collect();
    const offersWithDriver = await Promise.all(
      offers.map(async (offer) => {
        const driver = await ctx.db.get(offer.driverId);
        const driverUser =
          driver !== null ? await ctx.db.get(driver.userId) : null;
        const driverName = driverUser?.name?.trim() || "Chofer Hercom";
        return {
          ...offer,
          driverStatus: driver?.status ?? "offline",
          driverName,
          driverRating: driver?.rating ?? 0,
          driverTrips: driver?.totalTrips ?? 0,
        };
      }),
    );
    return offersWithDriver;
  },
});

/**
 * Cliente acepta oferta y se asigna chofer automáticamente.
 */
export const acceptOffer = mutation({
  args: {
    serviceId: v.id("services"),
    offerId: v.id("serviceOffers"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null) {
      throw new Error("Servicio no encontrado.");
    }
    if (service.clientId !== user._id) {
      throw new Error("No autorizado para aceptar ofertas de este servicio.");
    }
    if (service.status !== "pending") {
      throw new Error("El servicio ya no acepta ofertas.");
    }

    const offer = await ctx.db.get(args.offerId);
    if (offer === null || offer.serviceId !== service._id) {
      throw new Error("Oferta no encontrada para este servicio.");
    }
    if (offer.status !== "pending") {
      throw new Error("Esta oferta ya fue respondida.");
    }

    const driver = await ctx.db.get(offer.driverId);
    if (driver === null) {
      throw new Error("Chofer no encontrado.");
    }
    if (driver.status !== "available") {
      throw new Error("El chofer ya no está disponible.");
    }

    const commission = computePlatformCommissionForService(
      offer.offeredPrice,
      service.discountRate,
    );
    const clientTotal = computeClientTotalForOffer(
      offer.offeredPrice,
      service.discountRate,
    );
    const advanceAmount = computeClientAdvance(offer.offeredPrice);
    const enoughBalance = await hasSufficientBalance(ctx, driver._id, commission);
    if (!enoughBalance) {
      throw new Error(
        "El chofer seleccionado ya no tiene saldo suficiente. Elige otra oferta.",
      );
    }

    const securityCode = generateSecurityCode();
    await ctx.db.patch(service._id, {
      driverId: driver._id,
      offeredPrice: offer.offeredPrice,
      totalPrice: clientTotal,
      driverCommission: commission,
      advanceAmount,
      securityCode,
      status: "assigned",
      assignedAt: Date.now(),
    });
    await ctx.db.patch(driver._id, { status: "busy" });
    await ctx.db.patch(offer._id, {
      status: "accepted",
      respondedAt: Date.now(),
    });

    const pendingOffers = await ctx.db
      .query("serviceOffers")
      .withIndex("by_service_status", (q) =>
        q.eq("serviceId", service._id).eq("status", "pending"),
      )
      .collect();
    await Promise.all(
      pendingOffers
        .filter((pending) => pending._id !== offer._id)
        .map((pending) =>
          ctx.db.patch(pending._id, {
            status: "rejected",
            respondedAt: Date.now(),
          }),
        ),
    );

    await createNotification(ctx, {
      userId: driver.userId,
      type: "trip_confirmed_driver",
      title: "Viaje confirmado",
      message: `El cliente aceptó tu oferta. Anticipo a recibir: S/${advanceAmount.toFixed(2)} (25%). Código de inicio: ${securityCode}.`,
      serviceId: service._id,
    });
    await createNotification(ctx, {
      userId: user._id,
      type: "trip_confirmed_client",
      title: "Chofer confirmado",
      message: `Tu viaje fue confirmado. Entrega S/${advanceAmount.toFixed(2)} de anticipo (25%) antes de que salga. Código de inicio: ${securityCode}.`,
      serviceId: service._id,
    });

    return service._id;
  },
});

/**
 * Mis ofertas como chofer.
 */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const { driver } = await requireDriver(ctx);
    return await ctx.db
      .query("serviceOffers")
      .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
      .order("desc")
      .collect();
  },
});
