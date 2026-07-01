import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireDriver } from "./lib/auth";

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
    hasPropertyCard: v.boolean(),
    hasSoat: v.boolean(),
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
    if (args.hasVehicleDamage && (args.damageNotes ?? "").trim() === "") {
      throw new Error("Describe brevemente las abolladuras/observaciones del vehiculo.");
    }

    const existing = await ctx.db
      .query("serviceVehicleChecklists")
      .withIndex("by_service", (q) => q.eq("serviceId", service._id))
      .unique();

    const now = Date.now();
    if (existing !== null) {
      await ctx.db.patch(existing._id, {
        hasVehicleDamage: args.hasVehicleDamage,
        ...(args.damageNotes !== undefined
          ? { damageNotes: args.damageNotes.trim() }
          : {}),
        hasPropertyCard: args.hasPropertyCard,
        hasSoat: args.hasSoat,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("serviceVehicleChecklists", {
      serviceId: service._id,
      driverId: driver._id,
      phase: "pickup",
      hasVehicleDamage: args.hasVehicleDamage,
      ...(args.damageNotes !== undefined
        ? { damageNotes: args.damageNotes.trim() }
        : {}),
      hasPropertyCard: args.hasPropertyCard,
      hasSoat: args.hasSoat,
      checkedAt: now,
      updatedAt: now,
    });
  },
});
