import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { driverStatusValidator } from "./schema";
import { requireDriver, requireFullAdmin, requireUser } from "./lib/auth";
import { ensureWallet } from "./driverWallets";

/**
 * Lista los choferes disponibles. Usado por el panel admin para asignar.
 */
export const listAvailable = query({
  args: {},
  handler: async (ctx) => {
    await requireFullAdmin(ctx);
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
    await requireFullAdmin(ctx);
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
 * Deshabilitado: el perfil de chofer solo se crea al aprobar una solicitud.
 */
export const ensureDemoDriverProfile = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    throw new Error(
      "Debes completar el registro de chofer y esperar la validación de Hercom.",
    );
  },
});

/**
 * Actualiza datos de cobro del chofer (anticipo del cliente).
 */
export const updateMyPayoutProfile = mutation({
  args: {
    fullName: v.string(),
    dni: v.string(),
    yape: v.optional(v.string()),
    plin: v.optional(v.string()),
    bankAccount1: v.optional(v.string()),
    bankAccount2: v.optional(v.string()),
    bankAccount3: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { driver } = await requireDriver(ctx);
    const fullName = args.fullName.trim();
    const dni = args.dni.trim();
    if (fullName.length < 3) {
      throw new Error("Ingresa tus nombres completos.");
    }
    if (!/^\d{8}$/.test(dni)) {
      throw new Error("El DNI debe tener 8 dígitos.");
    }
    const optional = (value: string | undefined) => {
      const trimmed = value?.trim() ?? "";
      return trimmed === "" ? undefined : trimmed;
    };
    await ctx.db.patch(driver._id, {
      fullName,
      dni,
      yape: optional(args.yape),
      plin: optional(args.plin),
      bankAccount1: optional(args.bankAccount1),
      bankAccount2: optional(args.bankAccount2),
      bankAccount3: optional(args.bankAccount3),
    });
    return driver._id;
  },
});

/**
 * Cliente: datos de cobro del chofer asignado a un servicio (para el anticipo).
 */
export const getPayoutForClientService = query({
  args: {
    serviceId: v.id("services"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null || service.clientId !== user._id) {
      return null;
    }
    if (service.driverId === undefined) {
      return null;
    }
    const driver = await ctx.db.get(service.driverId);
    if (driver === null) {
      return null;
    }
    const driverUser = await ctx.db.get(driver.userId);
    return {
      fullName: driver.fullName?.trim() || driverUser?.name?.trim() || "Chofer",
      dni: driver.dni?.trim() || "",
      yape: driver.yape?.trim() || "",
      plin: driver.plin?.trim() || "",
      bankAccount1: driver.bankAccount1?.trim() || "",
      bankAccount2: driver.bankAccount2?.trim() || "",
      bankAccount3: driver.bankAccount3?.trim() || "",
    };
  },
});
