import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireDriver } from "./lib/auth";

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
    return await ctx.db
      .query("serviceVehicleChecklists")
      .withIndex("by_service", (q) => q.eq("serviceId", service._id))
      .unique();
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
    const payload = {
      hasVehicleDamage: hasDamage,
      damageNotes: (args.damageNotes ?? "").trim() || undefined,
      damageMarks: marks,
      hasPropertyCard: args.hasPropertyCard,
      hasSoat: args.hasSoat,
      hasTechnicalInspection: args.hasTechnicalInspection,
      vehicleMake: args.vehicleMake?.trim() || undefined,
      vehicleModel: args.vehicleModel?.trim() || undefined,
      vehicleYear: args.vehicleYear,
      hasInsurance: args.hasInsurance ?? false,
      insuranceNotes: (args.insuranceNotes ?? "").trim() || undefined,
      updatedAt: now,
    };

    if (existing !== null) {
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
