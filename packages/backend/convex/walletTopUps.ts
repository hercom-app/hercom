import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  lyraCheckoutMode,
  lyraCreateFormToken,
  lyraCreatePaymentUrl,
  lyraOrderIsPaid,
  lyraPublicKey,
} from "./lib/lyra";

type BeginTopUpResult = {
  orderDocId: Id<"walletTopUpOrders">;
  lyraOrderId: string;
  formToken: string;
  checkoutUrl: string;
  amountPen: number;
  publicKey: string;
};

type FulfillTopUpResult = {
  credited: boolean;
  alreadyPaid?: boolean;
  balance?: number;
  reason?: "not_found" | "not_pending";
};

export const WALLET_TOP_UP_MIN_PEN = 10;
export const WALLET_TOP_UP_MAX_PEN = 500;

function normalizePen(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function assertTopUpAmount(amountPen: number): number {
  const amount = normalizePen(amountPen);
  if (!Number.isFinite(amount) || amount < WALLET_TOP_UP_MIN_PEN) {
    throw new Error(`El monto mínimo de recarga es S/${WALLET_TOP_UP_MIN_PEN}.`);
  }
  if (amount > WALLET_TOP_UP_MAX_PEN) {
    throw new Error(`El monto máximo de recarga es S/${WALLET_TOP_UP_MAX_PEN}.`);
  }
  return amount;
}

function newLyraOrderId(): string {
  return `hercom-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Inicia recarga: crea orden pendiente y formToken Lyra (TEST con claves en Convex).
 */
export const beginTopUp = action({
  args: { amountPen: v.number() },
  handler: async (ctx, args): Promise<BeginTopUpResult> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Inicia sesión como chofer.");
    }
    const ctxDriver = await ctx.runQuery(internal.walletTopUpOrders.getDriverByUser, { userId });
    if (ctxDriver === null) {
      throw new Error("Solo los choferes pueden recargar saldo.");
    }
    const amountPen = assertTopUpAmount(args.amountPen);
    const lyraOrderId = newLyraOrderId();
    const email = ctxDriver.user.email?.trim() ?? "";
    const mode = lyraCheckoutMode();
    let checkoutUrl: string;
    let formToken: string;

    if (mode === "redirect") {
      const payment = await lyraCreatePaymentUrl({
        amountPen,
        orderId: lyraOrderId,
        ...(email !== "" ? { customerEmail: email } : {}),
      });
      checkoutUrl = payment.paymentURL;
      formToken = payment.paymentOrderId;
    } else {
      formToken = await lyraCreateFormToken({
        amountPen,
        orderId: lyraOrderId,
        ...(email !== "" ? { customerEmail: email } : {}),
      });
      const siteUrl =
        process.env.CONVEX_SITE_URL?.replace(/\/$/, "") ??
        process.env.SITE_URL?.replace(/\/$/, "");
      if (siteUrl === undefined || siteUrl === "") {
        throw new Error("Configura CONVEX_SITE_URL o SITE_URL en Convex.");
      }
      checkoutUrl = `${siteUrl}/lyra/checkout?order=${encodeURIComponent(lyraOrderId)}`;
    }

    const orderDocId = await ctx.runMutation(internal.walletTopUpOrders.insertPendingOrder, {
      driverId: ctxDriver.driver._id,
      userId,
      amountPen,
      lyraOrderId,
      formToken,
      ...(email !== "" ? { customerEmail: email } : {}),
    });

    return {
      orderDocId,
      lyraOrderId,
      formToken,
      checkoutUrl,
      amountPen,
      publicKey: lyraPublicKey(),
    };
  },
});

/**
 * Tras pagar en sandbox, consulta Lyra y acredita si el pedido está pagado.
 */
export const fulfillTopUp = action({
  args: { orderDocId: v.id("walletTopUpOrders") },
  handler: async (ctx, args): Promise<FulfillTopUpResult> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Inicia sesión como chofer.");
    }
    const ctxDriver = await ctx.runQuery(internal.walletTopUpOrders.getDriverByUser, { userId });
    if (ctxDriver === null) {
      throw new Error("Solo los choferes pueden recargar saldo.");
    }
    const order = await ctx.runQuery(internal.walletTopUpOrders.getOrderForDriver, {
      orderDocId: args.orderDocId,
      driverId: ctxDriver.driver._id,
    });
    if (order === null) {
      throw new Error("Orden de recarga no encontrada.");
    }
    if (order.status === "paid") {
      return await ctx.runMutation(internal.walletTopUpOrders.applyPaidOrder, {
        orderDocId: args.orderDocId,
      });
    }

    const paid = await lyraOrderIsPaid(order.lyraOrderId);
    if (!paid) {
      throw new Error(
        "Izipay aún no marca el pago como aceptado. Espera unos segundos o revisa el Back Office.",
      );
    }
    return await ctx.runMutation(internal.walletTopUpOrders.applyPaidOrder, {
      orderDocId: args.orderDocId,
    });
  },
});