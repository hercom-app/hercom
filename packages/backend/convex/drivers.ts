import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { driverStatusValidator } from "./schema";
import { requireDriver, requireRole, requireUser } from "./lib/auth";
import { ensureWallet } from "./driverWallets";

/**
 * Lista los choferes disponibles. Usado por el panel admin para asignar.
 */
export const listAvailable = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    return await ctx.db
      .query("drivers")
      .withIndex("by_status", (q) => q.eq("status", "available"))
      .collect();
  },
});

/**
 * Lista todos los choferes (panel admin).
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    return await ctx.db.query("drivers").collect();
  },
});

/**
 * Devuelve el perfil de chofer del usuario autenticado (o null).
 */
export const getMyDriverProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});

/**
 * Crea o actualiza el perfil de chofer del usuario autenticado.
 */
export const upsertDriverProfile = mutation({
  args: {
    vehicle: v.object({
      make: v.string(),
      model: v.string(),
      plate: v.string(),
      year: v.number(),
      color: v.optional(v.string()),
    }),
    licenseNumber: v.string(),
    licenseExpiry: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existing !== null) {
      await ctx.db.patch(existing._id, {
        vehicle: args.vehicle,
        licenseNumber: args.licenseNumber,
        licenseExpiry: args.licenseExpiry,
      });
      return existing._id;
    }

    const driverId = await ctx.db.insert("drivers", {
      userId: user._id,
      status: "offline",
      vehicle: args.vehicle,
      licenseNumber: args.licenseNumber,
      licenseExpiry: args.licenseExpiry,
      rating: 5,
      totalTrips: 0,
    });
    await ensureWallet(ctx, driverId);
    return driverId;
  },
});

/**
 * Cambia el estado de disponibilidad del chofer autenticado.
 */
export const setStatus = mutation({
  args: {
    status: driverStatusValidator,
  },
  handler: async (ctx, args) => {
    const { driver } = await requireDriver(ctx);
    await ctx.db.patch(driver._id, { status: args.status });
    return driver._id;
  },
});

/**
 * DEMO / QA: crea perfil de chofer mínimo sin RENIEC ni documentos.
 * TODO: quitar o restringir a admin cuando vuelva la validación formal.
 */
export const ensureDemoDriverProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (existing !== null) {
      return existing._id;
    }

    const driverId = await ctx.db.insert("drivers", {
      userId: user._id,
      status: "offline",
      vehicle: {
        make: "Demo",
        model: "Demo",
        plate: "DEMO",
        year: new Date().getFullYear(),
      },
      licenseNumber: "DEMO",
      licenseExpiry: Date.now() + 365 * 24 * 60 * 60 * 1000,
      rating: 5,
      totalTrips: 0,
    });
    await ensureWallet(ctx, driverId);
    return driverId;
  },
});
