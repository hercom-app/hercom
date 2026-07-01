import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { requireDriver, requireRole } from "./lib/auth";
import { MIN_DRIVER_WALLET_BALANCE } from "./lib/constants";

const topUpPeriodValidator = v.union(
  v.literal("today"),
  v.literal("week"),
  v.literal("month"),
  v.literal("all"),
);

type WalletTxType = Doc<"walletTransactions">["type"];

/**
 * Devuelve el saldo del chofer autenticado (creándolo en 0 si no existe).
 */
export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const { driver } = await requireDriver(ctx);
    const wallet = await ctx.db
      .query("driverWallets")
      .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
      .unique();
    return {
      driverId: driver._id,
      balance: wallet?.balance ?? 0,
      updatedAt: wallet?.updatedAt ?? 0,
    };
  },
});

/**
 * Historial reciente del chofer autenticado.
 */
export const listMyTransactions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { driver } = await requireDriver(ctx);
    const limit = Math.min(Math.max(args.limit ?? 10, 1), 50);
    return await ctx.db
      .query("walletTransactions")
      .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
      .order("desc")
      .take(limit);
  },
});

/**
 * Vista administrativa de saldos por chofer.
 */
export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    const drivers = await ctx.db.query("drivers").order("desc").collect();
    return await Promise.all(
      drivers.map(async (driver) => {
        const user = await ctx.db.get(driver.userId);
        const wallet = await ctx.db
          .query("driverWallets")
          .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
          .unique();
        return {
          driverId: driver._id,
          userId: driver.userId,
          driverStatus: driver.status,
          plate: driver.vehicle.plate,
          userName: user?.name ?? "Sin nombre",
          userEmail: user?.email ?? "Sin correo",
          balance: wallet?.balance ?? 0,
          updatedAt: wallet?.updatedAt ?? 0,
        };
      }),
    );
  },
});

/**
 * Recargas para panel admin (periodo configurable).
 */
export const listTopUpsForAdmin = query({
  args: {
    timezoneOffsetMinutes: v.optional(v.number()),
    period: v.optional(topUpPeriodValidator),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    const period = args.period ?? "today";
    const now = Date.now();
    const offset = args.timezoneOffsetMinutes ?? 0;
    const { startMs, endMs } =
      period === "all"
        ? { startMs: 0, endMs: now + 1 }
        : getPeriodRangeUtc(offset, now, period);

    const topUps = await ctx.db
      .query("walletTransactions")
      .withIndex("by_type_created", (q) =>
        period === "all"
          ? q.eq("type", "top_up")
          : q.eq("type", "top_up").gte("createdAt", startMs).lt("createdAt", endMs),
      )
      .order("desc")
      .collect();

    const items = await Promise.all(
      topUps.map(async (tx) => {
        const driver = await ctx.db.get(tx.driverId);
        const user = driver !== null ? await ctx.db.get(driver.userId) : null;
        return {
          ...tx,
          driverStatus: driver?.status ?? "offline",
          plate: driver?.vehicle.plate ?? "N/A",
          userName: user?.name ?? "Sin nombre",
          userEmail: user?.email ?? "Sin correo",
        };
      }),
    );
    const totalAmount = normalizeAmount(items.reduce((sum, item) => sum + item.amount, 0));
    return {
      period,
      startMs,
      endMs,
      totalAmount,
      count: items.length,
      items,
    };
  },
});

/**
 * Recargas del día para panel admin.
 * Se calcula el día según `timezoneOffsetMinutes` del cliente admin.
 */
export const listTopUpsTodayForAdmin = query({
  args: {
    timezoneOffsetMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    const { startMs, endMs } = getLocalDayRangeUtc(
      args.timezoneOffsetMinutes ?? 0,
      Date.now(),
    );
    const topUps = await ctx.db
      .query("walletTransactions")
      .withIndex("by_type_created", (q) =>
        q.eq("type", "top_up").gte("createdAt", startMs).lt("createdAt", endMs),
      )
      .order("desc")
      .collect();
    const items = await Promise.all(
      topUps.map(async (tx) => {
        const driver = await ctx.db.get(tx.driverId);
        const user = driver !== null ? await ctx.db.get(driver.userId) : null;
        return {
          ...tx,
          driverStatus: driver?.status ?? "offline",
          plate: driver?.vehicle.plate ?? "N/A",
          userName: user?.name ?? "Sin nombre",
          userEmail: user?.email ?? "Sin correo",
        };
      }),
    );
    const totalAmount = normalizeAmount(items.reduce((sum, item) => sum + item.amount, 0));
    return {
      startMs,
      endMs,
      totalAmount,
      count: items.length,
      items,
    };
  },
});

/**
 * Recarga manual de saldo por parte del chofer autenticado (demo).
 * No usa pasarela; es una simulación para pruebas.
 */
export const topUpMine = mutation({
  args: {
    amount: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, driver } = await requireDriver(ctx);
    const amount = normalizeAmount(args.amount);
    if (amount <= 0) {
      throw new Error("El monto de recarga debe ser mayor que 0.");
    }
    const note = args.note?.trim();
    const payload: {
      driverId: Id<"drivers">;
      amount: number;
      type: WalletTxType;
      createdByUserId?: Id<"users">;
      note?: string;
    } = {
      driverId: driver._id,
      amount,
      type: "top_up",
      createdByUserId: user._id,
      ...(note !== undefined && note !== "" ? { note } : {}),
    };
    return await creditWallet(ctx, payload);
  },
});

export async function ensureWallet(
  ctx: MutationCtx,
  driverId: Id<"drivers">,
): Promise<Doc<"driverWallets">> {
  const existing = await ctx.db
    .query("driverWallets")
    .withIndex("by_driver", (q) => q.eq("driverId", driverId))
    .unique();
  if (existing !== null) {
    return existing;
  }
  const walletId = await ctx.db.insert("driverWallets", {
    driverId,
    balance: 0,
    updatedAt: Date.now(),
  });
  return (await ctx.db.get(walletId)) as Doc<"driverWallets">;
}

export async function hasSufficientBalance(
  ctx: QueryCtx,
  driverId: Id<"drivers">,
  requiredAmount: number,
): Promise<boolean> {
  const wallet = await ctx.db
    .query("driverWallets")
    .withIndex("by_driver", (q) => q.eq("driverId", driverId))
    .unique();
  const balance = wallet?.balance ?? 0;
  const projectedBalance = normalizeAmount(balance - normalizeAmount(requiredAmount));
  return projectedBalance >= MIN_DRIVER_WALLET_BALANCE;
}

export async function debitCommissionForService(
  ctx: MutationCtx,
  args: {
    driverId: Id<"drivers">;
    serviceId: Id<"services">;
    amount: number;
  },
): Promise<Doc<"driverWallets">> {
  const wallet = await ensureWallet(ctx, args.driverId);
  const amount = normalizeAmount(args.amount);
  if (amount <= 0) {
    throw new Error("El descuento de comisión debe ser mayor que 0.");
  }
  const projectedBalance = normalizeAmount(wallet.balance - amount);
  if (projectedBalance < MIN_DRIVER_WALLET_BALANCE) {
    throw new Error(
      `Saldo insuficiente del chofer para descontar comisión. Límite mínimo permitido: S/${MIN_DRIVER_WALLET_BALANCE.toFixed(2)}.`,
    );
  }
  const nextBalance = projectedBalance;
  await ctx.db.patch(wallet._id, { balance: nextBalance, updatedAt: Date.now() });
  await ctx.db.insert("walletTransactions", {
    driverId: args.driverId,
    type: "commission_debit",
    amount,
    balanceAfter: nextBalance,
    serviceId: args.serviceId,
    createdAt: Date.now(),
  });
  return (await ctx.db.get(wallet._id)) as Doc<"driverWallets">;
}

async function creditWallet(
  ctx: MutationCtx,
  args: {
    driverId: Id<"drivers">;
    amount: number;
    type: WalletTxType;
    createdByUserId?: Id<"users">;
    note?: string;
  },
): Promise<Doc<"driverWallets">> {
  const driver = await ctx.db.get(args.driverId);
  if (driver === null) {
    throw new Error("Chofer no encontrado.");
  }
  const wallet = await ensureWallet(ctx, args.driverId);
  const nextBalance = normalizeAmount(wallet.balance + args.amount);
  await ctx.db.patch(wallet._id, { balance: nextBalance, updatedAt: Date.now() });
  await ctx.db.insert("walletTransactions", {
    driverId: args.driverId,
    type: args.type,
    amount: args.amount,
    balanceAfter: nextBalance,
    ...(args.createdByUserId !== undefined ? { createdByUserId: args.createdByUserId } : {}),
    ...(args.note !== undefined ? { note: args.note } : {}),
    createdAt: Date.now(),
  });
  return (await ctx.db.get(wallet._id)) as Doc<"driverWallets">;
}

function normalizeAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function getLocalDayRangeUtc(
  timezoneOffsetMinutes: number,
  nowUtcMs: number,
): { startMs: number; endMs: number } {
  const offsetMs = timezoneOffsetMinutes * 60 * 1000;
  const localNow = new Date(nowUtcMs - offsetMs);
  const startLocal = new Date(
    localNow.getFullYear(),
    localNow.getMonth(),
    localNow.getDate(),
    0,
    0,
    0,
    0,
  );
  const endLocal = new Date(
    localNow.getFullYear(),
    localNow.getMonth(),
    localNow.getDate() + 1,
    0,
    0,
    0,
    0,
  );
  return {
    startMs: startLocal.getTime() + offsetMs,
    endMs: endLocal.getTime() + offsetMs,
  };
}

function getPeriodRangeUtc(
  timezoneOffsetMinutes: number,
  nowUtcMs: number,
  period: "today" | "week" | "month",
): { startMs: number; endMs: number } {
  if (period === "today") {
    return getLocalDayRangeUtc(timezoneOffsetMinutes, nowUtcMs);
  }
  const offsetMs = timezoneOffsetMinutes * 60 * 1000;
  const localNow = new Date(nowUtcMs - offsetMs);
  const daysBack = period === "week" ? 7 : 30;
  const startLocal = new Date(
    localNow.getFullYear(),
    localNow.getMonth(),
    localNow.getDate() - daysBack,
    0,
    0,
    0,
    0,
  );
  const { endMs } = getLocalDayRangeUtc(timezoneOffsetMinutes, nowUtcMs);
  return {
    startMs: startLocal.getTime() + offsetMs,
    endMs,
  };
}
