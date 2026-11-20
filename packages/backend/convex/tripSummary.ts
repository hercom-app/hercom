import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireUser } from "./lib/auth";
import { driverFacingTripMoney } from "./lib/driverFare";
import { driverPhotoUrl } from "./lib/driverPublicPhoto";
import { estimateRoadLeg, haversineDistanceKm } from "./lib/geoDistance";
import { getServiceStops } from "./lib/serviceStops";

const TRIP_PAYMENT_METHODS = ["cash", "yape", "plin", "card"] as const;
type TripPaymentMethod = (typeof TRIP_PAYMENT_METHODS)[number];

/** Saltos de GPS mayores a esto entre dos puntos seguidos se descartan. */
const MAX_GPS_JUMP_KM = 2;

function money(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function trailKm(
  trail: { lat: number; lng: number; t: number }[],
  from: number,
  to: number,
): number | null {
  const points = trail.filter((point) => point.t >= from && point.t <= to);
  if (points.length < 2) {
    return null;
  }
  let km = 0;
  for (let index = 1; index < points.length; index += 1) {
    const step = haversineDistanceKm(points[index - 1]!, points[index]!);
    if (step <= MAX_GPS_JUMP_KM) {
      km += step;
    }
  }
  return km > 0.05 ? Math.round(km * 10) / 10 : null;
}

function firstName(user: Doc<"users"> | null): string {
  const raw = user?.firstName?.trim() || user?.name?.trim() || "";
  const first = raw.split(/\s+/)[0] ?? "";
  if (first === "") {
    return "Cliente";
  }
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function discountLabel(service: Doc<"services">): string {
  if (service.discountKind === "campaign") {
    return service.promotionName ?? "Campaña";
  }
  return "Primeros viajes";
}

function asPaymentMethod(method: string | undefined): TripPaymentMethod | null {
  return TRIP_PAYMENT_METHODS.find((item) => item === method) ?? null;
}

/**
 * Resumen de un viaje finalizado. Cada lado ve solo la valoración que él dio
 * y solo sus montos: el cliente lo que pagó, el chofer su ingreso y la comisión.
 */
export const getForService = query({
  args: { serviceId: v.id("services") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null || service.status !== "finished" || service.driverId === undefined) {
      return null;
    }
    const driver = await ctx.db.get(service.driverId);
    if (driver === null) {
      return null;
    }
    const role =
      driver.userId === user._id
        ? ("driver" as const)
        : service.clientId === user._id
          ? ("client" as const)
          : null;
    if (role === null) {
      return null;
    }

    const rating = await ctx.db
      .query("serviceRatings")
      .withIndex("by_service", (q) => q.eq("serviceId", service._id))
      .unique();
    const archive = await ctx.db
      .query("serviceRouteArchives")
      .withIndex("by_service", (q) => q.eq("serviceId", service._id))
      .unique();

    const startedAt =
      service.departedWithClientAt ??
      service.arrivedPickupAt ??
      service.headingToPickupAt ??
      service.assignedAt ??
      service.requestedAt;
    const finishedAt = service.finishedAt ?? startedAt;
    const stops = getServiceStops(service);
    const measuredKm =
      archive !== null ? trailKm(archive.trail, startedAt, finishedAt) : null;
    const distanceKm =
      measuredKm ?? estimateRoadLeg([service.origin, ...stops]).km;

    const common = {
      serviceId: service._id,
      serviceNumber: service._id.slice(-6).toUpperCase(),
      startedAt,
      finishedAt,
      durationMinutes: Math.max(1, Math.round((finishedAt - startedAt) / 60000)),
      distanceKm,
      distanceEstimated: measuredKm === null,
      origin: service.origin.address,
      stops: stops.map((stop) => stop.address),
    };

    const fare = driverFacingTripMoney(service);
    const discount = fare.discounted ? money(fare.offer - fare.clientPays) : 0;

    if (role === "client") {
      const driverUser = await ctx.db.get(driver.userId);
      return {
        ...common,
        role,
        counterpartName:
          driver.fullName?.trim().split(/\s+/)[0] || driverUser?.name?.trim() || "Chofer",
        counterpartPhotoUrl: await driverPhotoUrl(ctx, driver, driverUser),
        myScore: rating?.score ?? null,
        initialCost: fare.offer,
        discount,
        discountLabel: discount > 0 ? discountLabel(service) : null,
        discountRate: fare.discountRate,
        totalPaid: fare.clientPays,
      };
    }

    const client = await ctx.db.get(service.clientId);
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_service", (q) => q.eq("serviceId", service._id))
      .unique();
    const commissionPromo = money(Math.max(fare.fullCommission - fare.commission, 0));
    return {
      ...common,
      role,
      counterpartName: firstName(client),
      counterpartPhotoUrl:
        client?.image ??
        (client?.selfieStorageId !== undefined
          ? await ctx.storage.getUrl(client.selfieStorageId)
          : null),
      myScore: rating?.driverScore ?? null,
      offer: fare.offer,
      received: fare.clientPays,
      clientDiscountRate: fare.discountRate,
      paymentMethod: asPaymentMethod(payment?.method),
      commissionRate: fare.offer > 0 ? fare.fullCommission / fare.offer : 0,
      fullCommission: fare.fullCommission,
      commissionPromo,
      commissionPromoLabel: commissionPromo > 0 ? discountLabel(service) : null,
      commission: fare.commission,
      net: fare.net,
    };
  },
});
