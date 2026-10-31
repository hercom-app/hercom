import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";

/** Retención de rutas archivadas (GeoJSON + fila en BD). */
export const ROUTE_ARCHIVE_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export type RouteTrailPoint = {
  lat: number;
  lng: number;
  t: number;
};

export async function getRecordingArchiveForService(
  ctx: MutationCtx,
  serviceId: Id<"services">,
) {
  return await ctx.db
    .query("serviceRouteArchives")
    .withIndex("by_service", (q) => q.eq("serviceId", serviceId))
    .unique();
}

async function ensureRecordingArchive(
  ctx: MutationCtx,
  serviceId: Id<"services">,
): Promise<Id<"serviceRouteArchives">> {
  const existing = await getRecordingArchiveForService(ctx, serviceId);
  if (existing !== null) {
    return existing._id;
  }
  return await ctx.db.insert("serviceRouteArchives", {
    serviceId,
    status: "recording",
    trail: [],
    createdAt: Date.now(),
  });
}

/**
 * Acumula un punto en el archivo sin tope (el mapa en vivo sigue usando trail recortado).
 */
export async function appendRouteArchivePoint(
  ctx: MutationCtx,
  serviceId: Id<"services">,
  point: RouteTrailPoint,
): Promise<void> {
  const archiveId = await ensureRecordingArchive(ctx, serviceId);
  const archive = await ctx.db.get(archiveId);
  if (archive === null || archive.status === "finalized") {
    return;
  }
  await ctx.db.patch(archiveId, {
    trail: [...archive.trail, point],
  });
}

function mergeTrailPoints(
  primary: RouteTrailPoint[],
  secondary: RouteTrailPoint[],
): RouteTrailPoint[] {
  if (secondary.length === 0) {
    return primary;
  }
  if (primary.length === 0) {
    return secondary;
  }
  const seen = new Set(primary.map((p) => `${p.lat},${p.lng},${p.t}`));
  const merged = [...primary];
  for (const point of secondary) {
    const key = `${point.lat},${point.lng},${point.t}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(point);
    }
  }
  merged.sort((a, b) => a.t - b.t);
  return merged;
}

/**
 * Al terminar el servicio: congela tracking, persiste trail completo y encola GeoJSON.
 */
export async function finalizeServiceRouteArchive(
  ctx: MutationCtx,
  serviceId: Id<"services">,
  finishedAt: number,
): Promise<void> {
  const tracking = await ctx.db
    .query("serviceTracking")
    .withIndex("by_service", (q) => q.eq("serviceId", serviceId))
    .unique();

  let archive = await getRecordingArchiveForService(ctx, serviceId);
  let fullTrail: RouteTrailPoint[] = tracking?.trail ?? [];

  if (archive === null) {
    const archiveId = await ctx.db.insert("serviceRouteArchives", {
      serviceId,
      status: "finalized",
      trail: fullTrail,
      archivedAt: finishedAt,
      expiresAt: finishedAt + ROUTE_ARCHIVE_RETENTION_MS,
      createdAt: finishedAt,
    });
    if (tracking !== null) {
      await ctx.db.patch(tracking._id, {
        trailFrozen: true,
        trail: fullTrail,
      });
    }
    if (fullTrail.length > 0) {
      await ctx.scheduler.runAfter(
        0,
        internal.serviceRouteArchives.uploadGeoJson,
        { archiveId },
      );
    }
    return;
  }

  if (archive.status === "recording") {
    fullTrail = mergeTrailPoints(archive.trail, tracking?.trail ?? []);
    await ctx.db.patch(archive._id, {
      status: "finalized",
      trail: fullTrail,
      archivedAt: finishedAt,
      expiresAt: finishedAt + ROUTE_ARCHIVE_RETENTION_MS,
    });
  } else {
    fullTrail = archive.trail;
  }

  if (tracking !== null) {
    await ctx.db.patch(tracking._id, {
      trailFrozen: true,
      trail: fullTrail,
    });
  }

  if (fullTrail.length > 0 && archive.geoJsonStorageId === undefined) {
    await ctx.scheduler.runAfter(0, internal.serviceRouteArchives.uploadGeoJson, {
      archiveId: archive._id,
    });
  }
}
