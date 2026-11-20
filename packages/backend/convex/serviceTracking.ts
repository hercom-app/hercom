import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { requireDriver, requireStaff, requireUser } from "./lib/auth";
import { filterServicesByAccess, getAccessContext, originMatchesDistrictScopes } from "./lib/adminAccess";
import { ADMIN_LIVE_STATUSES, SHARE_LIVE_STATUSES } from "./lib/liveShare";
import {
  appendRouteArchivePoint,
  appendRouteArchivePoints,
} from "./lib/serviceRouteArchive";

const MAX_TRAIL_POINTS = 400;
const MIN_UPDATE_INTERVAL_MS = 3000;
const MIN_TRAIL_DISTANCE_M = 25;
const MIN_TRAIL_INTERVAL_MS = 12000;

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
    if (!SHARE_LIVE_STATUSES.has(service.status)) {
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
    if (tracking.trailFrozen === true) {
      return { ok: false as const, reason: "trail_frozen" };
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
      await appendRouteArchivePoint(ctx, args.serviceId, point);
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

const MAX_BATCH_POINTS = 500;
const LATE_BATCH_WINDOW_MS = 6 * 60 * 60 * 1000;
const CLOCK_SKEW_MS = 2 * 60 * 1000;

/**
 * Lote de GPS capturado por la tarea en segundo plano (con hora del dispositivo).
 * Acepta lotes tardíos tras finalizar para completar la ruta archivada.
 */
export const appendMyLocationBatch = mutation({
  args: {
    serviceId: v.id("services"),
    points: v.array(
      v.object({
        lat: v.number(),
        lng: v.number(),
        t: v.number(),
        heading: v.optional(v.number()),
        speed: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { driver } = await requireDriver(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null) {
      return { ok: false as const, reason: "not_found", accepted: 0 };
    }
    if (service.driverId !== driver._id) {
      throw new Error("Este servicio no está asignado a ti.");
    }

    const now = Date.now();
    const isLive = SHARE_LIVE_STATUSES.has(service.status);
    const finishedAt = service.finishedAt;
    const acceptsLate =
      service.status === "finished" &&
      finishedAt !== undefined &&
      now - finishedAt <= LATE_BATCH_WINDOW_MS;
    if (!isLive && !acceptsLate) {
      return { ok: false as const, reason: "not_live", accepted: 0 };
    }

    const windowStart = (service.departedWithClientAt ?? service.requestedAt) - CLOCK_SKEW_MS;
    const windowEnd = acceptsLate ? finishedAt! + CLOCK_SKEW_MS : now + CLOCK_SKEW_MS;
    const valid = args.points
      .slice(-MAX_BATCH_POINTS)
      .filter(
        (p) =>
          Number.isFinite(p.lat) &&
          Number.isFinite(p.lng) &&
          Number.isFinite(p.t) &&
          Math.abs(p.lat) <= 90 &&
          Math.abs(p.lng) <= 180 &&
          p.t >= windowStart &&
          p.t <= windowEnd,
      )
      .sort((a, b) => a.t - b.t);
    if (valid.length === 0) {
      return { ok: true as const, accepted: 0 };
    }

    const trackingId = await ensureServiceTracking(ctx, args.serviceId);
    const tracking = await ctx.db.get(trackingId);
    if (tracking === null) {
      throw new Error("Tracking no encontrado.");
    }

    const lastKnown = tracking.trail[tracking.trail.length - 1];
    const sampled: { lat: number; lng: number; t: number }[] = [];
    let prev = lastKnown !== undefined && lastKnown.t <= valid[0]!.t ? lastKnown : undefined;
    for (const p of valid) {
      const point = { lat: p.lat, lng: p.lng, t: p.t };
      if (
        prev === undefined ||
        point.t - prev.t >= MIN_TRAIL_INTERVAL_MS ||
        haversineMeters(prev, point) >= MIN_TRAIL_DISTANCE_M
      ) {
        sampled.push(point);
        prev = point;
      }
    }

    await appendRouteArchivePoints(ctx, args.serviceId, sampled);

    if (isLive && tracking.trailFrozen !== true) {
      let trail = [...tracking.trail, ...sampled].sort((a, b) => a.t - b.t);
      if (trail.length > MAX_TRAIL_POINTS) {
        trail = trail.slice(trail.length - MAX_TRAIL_POINTS);
      }
      const latest = valid[valid.length - 1]!;
      const isNewest = tracking.updatedAt === undefined || latest.t >= tracking.updatedAt - CLOCK_SKEW_MS;
      await ctx.db.patch(trackingId, {
        trail,
        ...(isNewest
          ? {
              lat: latest.lat,
              lng: latest.lng,
              ...(latest.heading !== undefined ? { heading: latest.heading } : {}),
              ...(latest.speed !== undefined ? { speed: latest.speed } : {}),
              updatedAt: Math.min(latest.t, now),
            }
          : {}),
      });
    } else if (sampled.length > 0) {
      const archive = await ctx.db
        .query("serviceRouteArchives")
        .withIndex("by_service", (q) => q.eq("serviceId", args.serviceId))
        .unique();
      if (archive !== null) {
        await ctx.db.patch(trackingId, { trail: archive.trail });
      }
    }

    return { ok: true as const, accepted: sampled.length };
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
      isLive: SHARE_LIVE_STATUSES.has(service.status),
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
    if (service.status === "cancelled" || service.status === "unattended") {
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
      isLive: SHARE_LIVE_STATUSES.has(service.status),
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

/**
 * Vista en vivo para operaciones (web admin).
 */
export const getForAdmin = query({
  args: {
    serviceId: v.id("services"),
  },
  handler: async (ctx, args) => {
    const user = await requireStaff(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null) {
      return null;
    }
    const access = await getAccessContext(ctx, user);
    if (
      !access.isFullAdmin &&
      !originMatchesDistrictScopes(service.origin, access.districtScopes)
    ) {
      throw new Error("No autorizado para ver este servicio.");
    }
    const tracking = await ctx.db
      .query("serviceTracking")
      .withIndex("by_service", (q) => q.eq("serviceId", args.serviceId))
      .unique();
    let driverName: string | undefined;
    if (service.driverId !== undefined) {
      const driver = await ctx.db.get(service.driverId);
      if (driver !== null) {
        const driverUser = await ctx.db.get(driver.userId);
        driverName =
          driver.fullName?.trim() || driverUser?.name?.trim() || "Chofer";
      }
    }
    return {
      serviceId: service._id,
      status: service.status,
      requestedAt: service.requestedAt,
      isLive: SHARE_LIVE_STATUSES.has(service.status),
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
      driverName,
      totalPrice: service.totalPrice,
      securityCode: service.securityCode ?? null,
    };
  },
});

/**
 * Servicios actualmente en ruta, para el tablero operativo.
 */
export const listLiveForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireStaff(ctx);
    const access = await getAccessContext(ctx, user);
    const services = await ctx.db.query("services").order("desc").collect();
    const live = filterServicesByAccess(services, access).filter((service) =>
      ADMIN_LIVE_STATUSES.has(service.status),
    );
    return await Promise.all(
      live.map(async (service) => {
        const tracking = await ctx.db
          .query("serviceTracking")
          .withIndex("by_service", (q) => q.eq("serviceId", service._id))
          .unique();
        return {
          serviceId: service._id,
          status: service.status,
          requestedAt: service.requestedAt,
          originAddress: service.origin.address,
          destinationAddress: service.destination.address,
          totalPrice: service.totalPrice,
          shareToken: tracking?.shareToken ?? null,
          lat: tracking?.lat ?? null,
          lng: tracking?.lng ?? null,
          updatedAt: tracking?.updatedAt ?? null,
          hasGps: tracking?.lat !== undefined && tracking?.lng !== undefined,
        };
      }),
    );
  },
});
