import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { requireDriver, requireUser } from "./lib/auth";

const MAX_TRAIL_POINTS = 400;
const MIN_UPDATE_INTERVAL_MS = 3000;
const MIN_TRAIL_DISTANCE_M = 25;
const MIN_TRAIL_INTERVAL_MS = 12000;

const LIVE_STATUSES = new Set([
  "heading_to_pickup",
  "arrived_pickup",
  "in_progress",
  "en_route",
  "arrived_destination",
]);

function makeShareToken(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 12; i += 1) {
    token += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return token;
}

function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Crea (o reutiliza) el tracking de un servicio. Idempotente.
 */
export async function ensureServiceTracking(
  ctx: MutationCtx,
  serviceId: Id<"services">,
): Promise<Id<"serviceTracking">> {
  const existing = await ctx.db
    .query("serviceTracking")
    .withIndex("by_service", (q) => q.eq("serviceId", serviceId))
    .unique();
  if (existing !== null) {
    return existing._id;
  }
  return await ctx.db.insert("serviceTracking", {
    serviceId,
    shareToken: makeShareToken(),
    trail: [],
    createdAt: Date.now(),
  });
}

/**
 * Asegura tracking (chofer del servicio).
 */
export const ensureForMyService = mutation({
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
    const trackingId = await ensureServiceTracking(ctx, args.serviceId);
    const tracking = await ctx.db.get(trackingId);
    return {
      trackingId,
      shareToken: tracking!.shareToken,
    };
  },
});

/**
 * Publica GPS del chofer (llamado cada ~5 s desde la app).
 */
export const updateMyLiveLocation = mutation({
  args: {
    serviceId: v.id("services"),
    lat: v.number(),
    lng: v.number(),
    heading: v.optional(v.number()),
    speed: v.optional(v.number()),
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
    if (!LIVE_STATUSES.has(service.status)) {
      return { ok: false as const, reason: "not_live" };
    }
    if (
      !Number.isFinite(args.lat) ||
      !Number.isFinite(args.lng) ||
      Math.abs(args.lat) > 90 ||
      Math.abs(args.lng) > 180
    ) {
      throw new Error("Coordenadas inválidas.");
    }

    const trackingId = await ensureServiceTracking(ctx, args.serviceId);
    const tracking = await ctx.db.get(trackingId);
    if (tracking === null) {
      throw new Error("Tracking no encontrado.");
    }

    const now = Date.now();
    if (
      tracking.updatedAt !== undefined &&
      now - tracking.updatedAt < MIN_UPDATE_INTERVAL_MS
    ) {
      return { ok: true as const, throttled: true };
    }

    const point = { lat: args.lat, lng: args.lng, t: now };
    let trail = tracking.trail;
    const last = trail[trail.length - 1];
    const shouldAppend =
      last === undefined ||
      now - last.t >= MIN_TRAIL_INTERVAL_MS ||
      haversineMeters(last, point) >= MIN_TRAIL_DISTANCE_M;
    if (shouldAppend) {
      trail = [...trail, point];
      if (trail.length > MAX_TRAIL_POINTS) {
        trail = trail.slice(trail.length - MAX_TRAIL_POINTS);
      }
    }

    await ctx.db.patch(trackingId, {
      lat: args.lat,
      lng: args.lng,
      ...(args.heading !== undefined ? { heading: args.heading } : {}),
      ...(args.speed !== undefined ? { speed: args.speed } : {}),
      updatedAt: now,
      trail,
    });

    return { ok: true as const, throttled: false };
  },
});

/**
 * Vista en vivo para el cliente (o chofer) autenticado del servicio.
 */
export const getForService = query({
  args: {
    serviceId: v.id("services"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null) {
      return null;
    }

    const driver =
      service.driverId !== undefined
        ? await ctx.db.get(service.driverId)
        : null;
    const isClient = service.clientId === user._id;
    const isDriver = driver !== null && driver.userId === user._id;
    if (!isClient && !isDriver) {
      throw new Error("No autorizado.");
    }

    const tracking = await ctx.db
      .query("serviceTracking")
      .withIndex("by_service", (q) => q.eq("serviceId", args.serviceId))
      .unique();

    return {
      serviceId: service._id,
      status: service.status,
      isLive: LIVE_STATUSES.has(service.status),
      origin: service.origin,
      destination: service.destination,
      extraDestinations: service.extraDestinations ?? [],
      shareToken: tracking?.shareToken ?? null,
      lat: tracking?.lat ?? null,
      lng: tracking?.lng ?? null,
      heading: tracking?.heading ?? null,
      speed: tracking?.speed ?? null,
      updatedAt: tracking?.updatedAt ?? null,
      trail: tracking?.trail ?? [],
    };
  },
});

/**
 * Vista pública por token (compartir viaje con familiares).
 */
export const getByShareToken = query({
  args: {
    shareToken: v.string(),
  },
  handler: async (ctx, args) => {
    const token = args.shareToken.trim().toLowerCase();
    if (token.length < 8) {
      return null;
    }
    const tracking = await ctx.db
      .query("serviceTracking")
      .withIndex("by_share_token", (q) => q.eq("shareToken", token))
      .unique();
    if (tracking === null) {
      return null;
    }
    const service = await ctx.db.get(tracking.serviceId);
    if (service === null) {
      return null;
    }
    if (service.status === "cancelled") {
      return {
        serviceId: service._id,
        status: service.status,
        isLive: false,
        origin: service.origin,
        destination: service.destination,
        extraDestinations: service.extraDestinations ?? [],
        shareToken: tracking.shareToken,
        lat: null,
        lng: null,
        heading: null,
        speed: null,
        updatedAt: null,
        trail: [],
        ended: true as const,
      };
    }

    return {
      serviceId: service._id,
      status: service.status,
      isLive: LIVE_STATUSES.has(service.status),
      origin: service.origin,
      destination: service.destination,
      extraDestinations: service.extraDestinations ?? [],
      shareToken: tracking.shareToken,
      lat: tracking.lat ?? null,
      lng: tracking.lng ?? null,
      heading: tracking.heading ?? null,
      speed: tracking.speed ?? null,
      updatedAt: tracking.updatedAt ?? null,
      trail: tracking.trail,
      ended: service.status === "finished",
    };
  },
});
