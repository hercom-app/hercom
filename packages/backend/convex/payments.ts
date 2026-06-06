import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paymentStatusValidator } from "./schema";
import { requireRole, requireUser } from "./lib/auth";

/**
 * Marca un pago como pagado (panel admin).
 */
export const markPaid = mutation({
  args: {
    paymentId: v.id("payments"),
    method: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    const payment = await ctx.db.get(args.paymentId);
    if (payment === null) {
      throw new Error("Pago no encontrado.");
    }
    if (payment.status === "paid") {
      return payment._id;
    }
    await ctx.db.patch(payment._id, {
      status: "paid",
      paidAt: Date.now(),
      ...(args.method !== undefined ? { method: args.method } : {}),
    });
    return payment._id;
  },
});

/**
 * Lista pagos pendientes (panel admin).
 */
export const listPending = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    return await ctx.db
      .query("payments")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();
  },
});

/**
 * Lista todos los pagos con filtro opcional por estado (panel admin).
 */
export const listAll = query({
  args: {
    status: v.optional(paymentStatusValidator),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    if (args.status !== undefined) {
      const status = args.status;
      return await ctx.db
        .query("payments")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("payments").order("desc").collect();
  },
});

/**
 * Pagos del cliente autenticado.
 */
export const listForClient = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("payments")
      .withIndex("by_client", (q) => q.eq("clientId", user._id))
      .order("desc")
      .collect();
  },
});
