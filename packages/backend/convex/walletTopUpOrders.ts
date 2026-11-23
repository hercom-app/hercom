import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { ensureWallet } from "./driverWallets";

function normalizePen(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export const getOrderForCheckout = internalQuery({
  args: { lyraOrderId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("walletTopUpOrders")
      .withIndex("by_lyra_order", (q) => q.eq("lyraOrderId", args.lyraOrderId))
      .unique();
  },
});

export const insertPendingOrder = internalMutation({
  args: {
    driverId: v.id("drivers"),
    userId: v.id("users"),
    amountPen: v.number(),
    lyraOrderId: v.string(),
    formToken: v.string(),
    customerEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("walletTopUpOrders", {
      driverId: args.driverId,
      userId: args.userId,
      amountPen: args.amountPen,
      lyraOrderId: args.lyraOrderId,
      formToken: args.formToken,
      status: "pending",
      ...(args.customerEmail !== undefined ? { customerEmail: args.customerEmail } : {}),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getDriverByUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (user === null || user.role !== "driver") {
      return null;
    }
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    return driver === null ? null : { user, driver };
  },
});

export const getOrderForDriver = internalQuery({
  args: {
    orderDocId: v.id("walletTopUpOrders"),
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderDocId);
    if (order === null || order.driverId !== args.driverId) {
      return null;
    }
    return order;
  },
});

export const applyPaidOrder = internalMutation({
  args: { orderDocId: v.id("walletTopUpOrders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderDocId);
    if (order === null) {
      return { credited: false, reason: "not_found" as const };
    }
    if (order.status === "paid") {
      const wallet = await ensureWallet(ctx, order.driverId);
      return {
        credited: true,
        alreadyPaid: true,
        balance: normalizePen(wallet.balance ?? 0),
      };
    }
    if (order.status !== "pending") {
      return { credited: false, reason: "not_pending" as const };
    }

    const wallet = await ensureWallet(ctx, order.driverId);
    const nextBalance = normalizePen((wallet.balance ?? 0) + order.amountPen);
    await ctx.db.patch(wallet._id, { balance: nextBalance, updatedAt: Date.now() });
    await ctx.db.insert("walletTransactions", {
      driverId: order.driverId,
      type: "top_up",
      amount: order.amountPen,
      pricePenPaid: order.amountPen,
      balanceAfter: nextBalance,
      createdByUserId: order.userId,
      note: `Recarga Izipay (test) S/${order.amountPen.toFixed(2)} · ${order.lyraOrderId}`,
      createdAt: Date.now(),
    });
    await ctx.db.patch(order._id, {
      status: "paid",
      paidAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { credited: true, alreadyPaid: false, balance: nextBalance };
  },
});