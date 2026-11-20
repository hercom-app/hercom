import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paymentStatusValidator, tripPaymentMethodValidator } from "./schema";
import { computeClientAdvance } from "./lib/constants";
import { requireFullAdmin, requireUser } from "./lib/auth";

function normalizeMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Marca un pago como pagado (panel admin).
 */
export const markPaid = mutation({
  args: {
    paymentId: v.id("payments"),
    method: v.optional(tripPaymentMethodValidator),
  },
  handler: async (ctx, args) => {
    await requireFullAdmin(ctx);
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
    await requireFullAdmin(ctx);
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
    await requireFullAdmin(ctx);
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
 * Pago del saldo de un servicio del cliente autenticado.
 */
export const getForMyService = query({
  args: { serviceId: v.id("services") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null || service.clientId !== user._id) {
      return null;
    }
    return await ctx.db
      .query("payments")
      .withIndex("by_service", (q) => q.eq("serviceId", service._id))
      .unique();
  },
});

/** Saldo pendiente de registrar por el cliente tras finalizar. */
export const balanceContextForMyService = query({
  args: { serviceId: v.id("services") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null || service.clientId !== user._id) {
      return null;
    }
    const advanceAmount =
      service.advanceAmount ??
      (service.offeredPrice !== undefined ? computeClientAdvance(service.offeredPrice) : 0);
    const balanceDue = normalizeMoney(Math.max(service.totalPrice - advanceAmount, 0));
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_service", (q) => q.eq("serviceId", service._id))
      .unique();
    return {
      balanceDue,
      advancePaymentMethod: service.advancePaymentMethod ?? null,
      clientPaidAt: payment?.clientPaidAt ?? null,
      driverReceivedAt: payment?.driverReceivedAt ?? null,
      method: payment?.method ?? null,
      sameMethodAsAdvance: payment?.sameMethodAsAdvance ?? null,
    };
  },
});

/**
 * Cliente confirma el pago del saldo restante al chofer.
 */
export const confirmBalancePaid = mutation({
  args: {
    serviceId: v.id("services"),
    method: tripPaymentMethodValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null) {
      throw new Error("Servicio no encontrado.");
    }
    if (service.clientId !== user._id) {
      throw new Error("No autorizado para este servicio.");
    }
    if (service.status !== "finished") {
      throw new Error("Solo puedes registrar el saldo cuando el viaje ya finalizó.");
    }
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_service", (q) => q.eq("serviceId", service._id))
      .unique();
    if (payment === null) {
      throw new Error("Aún no hay registro de saldo para este viaje.");
    }
    if (payment.clientPaidAt !== undefined) {
      return payment._id;
    }
    const now = Date.now();
    const sameMethodAsAdvance =
      service.advancePaymentMethod !== undefined
        ? service.advancePaymentMethod === args.method
        : undefined;
    await ctx.db.patch(payment._id, {
      method: args.method,
      clientPaidAt: now,
      ...(sameMethodAsAdvance !== undefined ? { sameMethodAsAdvance } : {}),
    });
    return payment._id;
  },
});

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
