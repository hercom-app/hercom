import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireDriver, requireFullAdmin } from "./lib/auth";

/**
 * Liquida (paga) el payout pendiente acumulado de un chofer (panel admin).
 * Cierra el payout actual marcándolo como pagado y registrando el periodo.
 */
export const markPaid = mutation({
  args: {
    payoutId: v.id("payouts"),
  },
  handler: async (ctx, args) => {
    await requireFullAdmin(ctx);
    const payout = await ctx.db.get(args.payoutId);
    if (payout === null) {
      throw new Error("Payout no encontrado.");
    }
    if (payout.status === "paid") {
      return payout._id;
    }
    await ctx.db.patch(payout._id, {
      status: "paid",
      paidAmount: payout.accumulatedAmount,
      paidAt: Date.now(),
      periodEnd: Date.now(),
    });
    return payout._id;
  },
});

/**
 * Lista los payouts de un chofer (panel admin).
 */
export const listByDriver = query({
  args: {
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    await requireFullAdmin(ctx);
    return await ctx.db
      .query("payouts")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .order("desc")
      .collect();
  },
});

/**
 * Lista todos los payouts pendientes (panel admin).
 */
export const listPending = query({
  args: {},
  handler: async (ctx) => {
    await requireFullAdmin(ctx);
    return await ctx.db
      .query("payouts")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();
  },
});

/**
 * Payouts del chofer autenticado (resumen de comisiones en la app móvil).
 */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const { driver } = await requireDriver(ctx);
    return await ctx.db
      .query("payouts")
      .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
      .order("desc")
      .collect();
  },
});
