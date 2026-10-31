import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireDriver, requireStaff } from "./lib/auth";
import { getAccessContext, originMatchesDistrictScopes } from "./lib/adminAccess";
import { vehicleChecklistPhotoValidator } from "./schema";
import {
  assertRequiredVehiclePhotos,
  hasRequiredVehiclePhotos,
  replaceVehicleChecklistPhotos,
} from "./lib/vehicleChecklistPhotos";

const damageMarkValidator = v.object({
  view: v.union(
    v.literal("front"),
    v.literal("rear"),
    v.literal("side"),
    v.literal("diagram"),
  ),
  x: v.number(),
  y: v.number(),
});

async function withPhotoUrls(
  ctx: QueryCtx,
  photos: Doc<"serviceVehicleChecklists">["vehiclePhotos"],
) {
  if (photos === undefined) {
    return [];
  }
  return await Promise.all(
    photos.map(async (photo) => ({
      slot: photo.slot,
      storageId: photo.storageId,
      url: await ctx.storage.getUrl(photo.storageId),
    })),
  );
}

function toChecklistResponse(checklist: Doc<"serviceVehicleChecklists">) {
  return {
    photosComplete: hasRequiredVehiclePhotos(checklist.vehiclePhotos),
  };
}

/**
 * URL temporal para subir las 6 fotos del vehículo.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireDriver(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Devuelve checklist del servicio para chofer asignado.
 */
export const getForMyService = query({
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
      throw new Error("No autorizado.");
    }
    const checklist = await ctx.db
      .query("serviceVehicleChecklists")
      .withIndex("by_service", (q) => q.eq("serviceId", service._id))
      .unique();
    if (checklist === null) {
      return null;
    }
    return {
      ...checklist,
      vehiclePhotos: await withPhotoUrls(ctx, checklist.vehiclePhotos),
      ...toChecklistResponse(checklist),
    };
  },
});

/**
 * Checklist con URLs de fotos para el panel interno (reclamos).
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
    const checklist = await ctx.db
      .query("serviceVehicleChecklists")
      .withIndex("by_service", (q) => q.eq("serviceId", service._id))
      .unique();
    if (checklist === null) {
      return null;
    }
    return {
      ...checklist,
      vehiclePhotos: await withPhotoUrls(ctx, checklist.vehiclePhotos),
      ...toChecklistResponse(checklist),
    };
  },
});

/**
 * Crea/actualiza checklist de recojo antes de iniciar viaje.
 */
export const upsertPickupChecklist = mutation({
  args: {
    serviceId: v.id("services"),
    hasVehicleDamage: v.boolean(),
    damageNotes: v.optional(v.string()),
    damageMarks: v.optional(v.array(damageMarkValidator)),
    hasPropertyCard: v.boolean(),
    hasSoat: v.boolean(),
    hasTechnicalInspection: v.boolean(),
    vehicleMake: v.optional(v.string()),
    vehicleModel: v.optional(v.string()),
    vehicleYear: v.optional(v.number()),
    hasInsurance: v.optional(v.boolean()),
    insuranceNotes: v.optional(v.string()),
    vehiclePhotos: v.array(vehicleChecklistPhotoValidator),
  },
  handler: async (ctx, args) => {
    const { driver } = await requireDriver(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null) {
      throw new Error("Servicio no encontrado.");
    }
    if (service.driverId !== driver._id) {
      throw new Error("No autorizado.");
    }
    if (service.status !== "arrived_pickup") {
      throw new Error("El checklist solo se registra en estado arrived_pickup.");
    }

    assertRequiredVehiclePhotos(args.vehiclePhotos);

    const marks = args.damageMarks ?? [];
    const hasMarks = marks.length > 0;
    const hasDamage = args.hasVehicleDamage || hasMarks;
    if (hasDamage && (args.damageNotes ?? "").trim() === "") {
      throw new Error(
        "Si hay abolladuras marcadas, escribe observaciones del vehículo.",
      );
    }

    const existing = await ctx.db
      .query("serviceVehicleChecklists")
      .withIndex("by_service", (q) => q.eq("serviceId", service._id))
      .unique();

    const now = Date.now();
    const damageNotes = (args.damageNotes ?? "").trim();
    const vehicleMake = args.vehicleMake?.trim();
    const vehicleModel = args.vehicleModel?.trim();
    const insuranceNotes = (args.insuranceNotes ?? "").trim();
    const payload = {
      hasVehicleDamage: hasDamage,
      ...(damageNotes ? { damageNotes } : {}),
      ...(marks.length > 0 ? { damageMarks: marks } : {}),
      hasPropertyCard: args.hasPropertyCard,
      hasSoat: args.hasSoat,
      hasTechnicalInspection: args.hasTechnicalInspection,
      ...(vehicleMake ? { vehicleMake } : {}),
      ...(vehicleModel ? { vehicleModel } : {}),
      ...(args.vehicleYear !== undefined
        ? { vehicleYear: args.vehicleYear }
        : {}),
      hasInsurance: args.hasInsurance ?? false,
      ...(insuranceNotes ? { insuranceNotes } : {}),
      vehiclePhotos: args.vehiclePhotos,
      updatedAt: now,
    };

    if (existing !== null) {
      await replaceVehicleChecklistPhotos(
        ctx,
        existing.vehiclePhotos,
        args.vehiclePhotos,
      );
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("serviceVehicleChecklists", {
      serviceId: service._id,
      driverId: driver._id,
      phase: "pickup",
      ...payload,
      checkedAt: now,
    });
  },
});

/**
 * Marca la primera vez que el chofer abre el checklist de recojo.
 * No se vuelve a escribir si ya hay marca.
 */
export const markChecklistStarted = mutation({
  args: {
    serviceId: v.id("services"),
  },
  handler: async (ctx, args) => {
    const { driver } = await requireDriver(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null || service.driverId !== driver._id) {
      throw new Error("No autorizado.");
    }
    if (service.checklistStartedAt !== undefined) {
      return service.checklistStartedAt;
    }
    if (service.status !== "arrived_pickup") {
      return null;
    }
    const now = Date.now();
    await ctx.db.patch(service._id, { checklistStartedAt: now });
    return now;
  },
});
