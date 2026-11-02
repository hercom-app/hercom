import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { requireStaff } from "./lib/auth";
import { getAccessContext, originMatchesDistrictScopes } from "./lib/adminAccess";

export const getInternal = internalQuery({
  args: {
    archiveId: v.id("serviceRouteArchives"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.archiveId);
  },
});

export const patchGeoJsonStorage = internalMutation({
  args: {
    archiveId: v.id("serviceRouteArchives"),
    geoJsonStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const archive = await ctx.db.get(args.archiveId);
    if (archive === null) {
      return;
    }
    await ctx.db.patch(args.archiveId, {
      geoJsonStorageId: args.geoJsonStorageId,
    });
  },
});

/**
 * Sube LineString GeoJSON a Convex File Storage (retención alineada al registro en BD).
 */
export const uploadGeoJson = internalAction({
  args: {
    archiveId: v.id("serviceRouteArchives"),
  },
  handler: async (ctx, args) => {
    const archive = await ctx.runQuery(internal.serviceRouteArchives.getInternal, {
      archiveId: args.archiveId,
    });
    if (archive === null || archive.trail.length === 0) {
      return;
    }
    if (archive.geoJsonStorageId !== undefined) {
      return;
    }
    const geojson = {
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: archive.trail.map((p) => [p.lng, p.lat]),
      },
      properties: {
        serviceId: archive.serviceId,
        archivedAt: archive.archivedAt ?? null,
        pointCount: archive.trail.length,
      },
    };
    const blob = new Blob([JSON.stringify(geojson)], {
      type: "application/geo+json",
    });
    const geoJsonStorageId = await ctx.storage.store(blob);
    await ctx.runMutation(internal.serviceRouteArchives.patchGeoJsonStorage, {
      archiveId: args.archiveId,
      geoJsonStorageId,
    });
  },
});

/**
 * Ruta archivada para un servicio finalizado (panel interno).
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
    const archive = await ctx.db
      .query("serviceRouteArchives")
      .withIndex("by_service", (q) => q.eq("serviceId", args.serviceId))
      .unique();
    if (archive === null) {
      return null;
    }
    const geoJsonUrl =
      archive.geoJsonStorageId !== undefined
        ? await ctx.storage.getUrl(archive.geoJsonStorageId)
        : null;
    return {
      serviceId: args.serviceId,
      trail: archive.trail,
      pointCount: archive.trail.length,
      archivedAt: archive.archivedAt ?? null,
      expiresAt: archive.expiresAt ?? null,
      geoJsonUrl,
    };
  },
});

const PURGE_BATCH_SIZE = 50;

/**
 * Elimina archivos y filas con expiresAt vencido (cron diario).
 */
export const purgeExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const candidates = await ctx.db
      .query("serviceRouteArchives")
      .withIndex("by_expires_at", (q) => q.lt("expiresAt", now))
      .take(PURGE_BATCH_SIZE);

    let deleted = 0;
    for (const archive of candidates) {
      if (archive.expiresAt === undefined || archive.expiresAt >= now) {
        continue;
      }
      if (archive.geoJsonStorageId !== undefined) {
        await ctx.storage.delete(archive.geoJsonStorageId);
      }
      await ctx.db.delete(archive._id);
      deleted += 1;
    }
    return { deleted, scanned: candidates.length };
  },
});
