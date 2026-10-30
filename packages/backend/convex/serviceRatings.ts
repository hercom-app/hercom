import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";

function roundRating(average: number): number {
  return Math.round(average * 10) / 10;
}

/**
 * Cliente valora el viaje finalizado. Actualiza el promedio de estrellas del chofer.
 */
export const rateService = mutation({
  args: {
    serviceId: v.id("services"),
    score: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!Number.isInteger(args.score) || args.score < 1 || args.score > 5) {
      throw new Error("La valoración debe ser entre 1 y 5 estrellas.");
    }

    const service = await ctx.db.get(args.serviceId);
    if (service === null) {
      throw new Error("Servicio no encontrado.");
    }
    if (service.clientId !== user._id) {
      throw new Error("No autorizado para valorar este servicio.");
    }
    if (service.status !== "finished") {
      throw new Error("Solo puedes valorar un viaje ya finalizado.");
    }
    if (service.driverId === undefined) {
      throw new Error("Este viaje no tiene chofer asignado.");
    }
    const driverId = service.driverId;

    const existing = await ctx.db
      .query("serviceRatings")
      .withIndex("by_service", (q) => q.eq("serviceId", service._id))
      .unique();
    if (existing !== null && existing.score !== undefined) {
      throw new Error("Ya valoraste este viaje.");
    }

    const comment = args.comment?.trim();
    const now = Date.now();
    if (existing !== null) {
      await ctx.db.patch(existing._id, {
        score: args.score,
        ...(comment !== undefined && comment !== "" ? { comment } : {}),
        clientRatedAt: now,
      });
    } else {
      await ctx.db.insert("serviceRatings", {
        serviceId: service._id,
        clientId: user._id,
        driverId,
        score: args.score,
        ...(comment !== undefined && comment !== "" ? { comment } : {}),
        clientRatedAt: now,
        createdAt: now,
      });
    }

    const ratings = await ctx.db
      .query("serviceRatings")
      .withIndex("by_driver", (q) => q.eq("driverId", driverId))
      .collect();
    const scored = ratings.filter((rating) => rating.score !== undefined);
    const average =
      scored.reduce((sum, rating) => sum + (rating.score as number), 0) /
      scored.length;
    await ctx.db.patch(driverId, {
      rating: roundRating(average),
    });

    return service._id;
  },
});

/**
 * Chofer valora al cliente tras finalizar el viaje.
 */
export const rateClientAsDriver = mutation({
  args: {
    serviceId: v.id("services"),
    score: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!Number.isInteger(args.score) || args.score < 1 || args.score > 5) {
      throw new Error("La valoración debe ser entre 1 y 5 estrellas.");
    }

    const service = await ctx.db.get(args.serviceId);
    if (service === null) {
      throw new Error("Servicio no encontrado.");
    }
    if (service.driverId === undefined) {
      throw new Error("Este viaje no tiene chofer asignado.");
    }
    const driver = await ctx.db.get(service.driverId);
    if (driver === null || driver.userId !== user._id) {
      throw new Error("No autorizado para valorar este viaje.");
    }
    if (service.status !== "finished") {
      throw new Error("Solo puedes valorar un viaje ya finalizado.");
    }

    const existing = await ctx.db
      .query("serviceRatings")
      .withIndex("by_service", (q) => q.eq("serviceId", service._id))
      .unique();
    if (existing !== null && existing.driverScore !== undefined) {
      throw new Error("Ya valoraste a este cliente en este viaje.");
    }

    const comment = args.comment?.trim();
    const now = Date.now();
    if (existing !== null) {
      await ctx.db.patch(existing._id, {
        driverScore: args.score,
        ...(comment !== undefined && comment !== "" ? { driverComment: comment } : {}),
        driverRatedAt: now,
      });
    } else {
      await ctx.db.insert("serviceRatings", {
        serviceId: service._id,
        clientId: service.clientId,
        driverId: service.driverId,
        driverScore: args.score,
        ...(comment !== undefined && comment !== "" ? { driverComment: comment } : {}),
        driverRatedAt: now,
        createdAt: now,
      });
    }

    return service._id;
  },
});

/**
 * Valoración del cliente para un servicio (o null si aún no calificó).
 */
export const getForService = query({
  args: {
    serviceId: v.id("services"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null || service.clientId !== user._id) {
      return null;
    }
    return await ctx.db
      .query("serviceRatings")
      .withIndex("by_service", (q) => q.eq("serviceId", service._id))
      .unique();
  },
});
