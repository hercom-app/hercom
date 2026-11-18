import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { requireDriver, requireFullAdmin } from "./lib/auth";
import {
  MIN_DRIVER_WALLET_BALANCE,
  PLATFORM_COMMISSION_RATE,
} from "./lib/constants";
import {
  driverTopUpPackageIdValidator,
  getDriverTopUpPackage,
  type DriverTopUpPackageId,
} from "./lib/driverTopUpPackages";

const topUpPeriodValidator = v.union(
  v.literal("today"),
  v.literal("week"),
  v.literal("month"),
  v.literal("all"),
);

function formatPercent(rate: number): string {
  const percent = rate * 100;
  return Number.isInteger(percent) ? `${percent}` : percent.toFixed(1);
}

export function balanceCoversCommission(balance: number, commission: number): boolean {
  return normalizePen(balance - commission) >= MIN_DRIVER_WALLET_BALANCE;
}

export function insufficientBalanceMessage(
  balance: number,
  commission: number,
  commissionRate: number = PLATFORM_COMMISSION_RATE,
): string {
  const next = normalizePen(balance - commission);
  return `Saldo insuficiente. La comisión de este viaje es S/${commission.toFixed(2)} (${formatPercent(commissionRate)}%) y el saldo quedaría en S/${next.toFixed(2)}. El mínimo permitido es S/${MIN_DRIVER_WALLET_BALANCE}.`;
}

function normalizePen(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Saldo en soles del chofer autenticado (crea la cuenta en 0 si no existe).
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
      balance: normalizePen(wallet?.balance ?? 0),
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
 * Vista administrativa del saldo de comisión por chofer.
 */
export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireFullAdmin(ctx);
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
          balance: normalizePen(wallet?.balance ?? 0),
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
    await requireFullAdmin(ctx);
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
    const totalTrips = items.reduce((sum, item) => sum + item.amount, 0);
    const totalPricePen = normalizePen(
      items.reduce((sum, item) => sum + (item.pricePenPaid ?? 0), 0),
    );
    return {
      period,
      startMs,
      endMs,
      totalTrips,
      totalPricePen,
      count: items.length,
      items,
    };
  },
});

/**
 * Recargas del día para panel admin.
 */
export const listTopUpsTodayForAdmin = query({
  args: {
    timezoneOffsetMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireFullAdmin(ctx);
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
    const totalTrips = items.reduce((sum, item) => sum + item.amount, 0);
    const totalPricePen = normalizePen(
      items.reduce((sum, item) => sum + (item.pricePenPaid ?? 0), 0),
    );
    return {
      startMs,
      endMs,
      totalTrips,
      totalPricePen,
      count: items.length,
      items,
    };
  },
});

/**
 * Limpieza total vía CLI (sin sesión admin). Ej.: npx convex run driverWallets:internalWipeAllDriverWalletData --prod
 */
export const internalWipeAllDriverWalletData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const transactions = await ctx.db.query("walletTransactions").collect();
    for (const tx of transactions) {
      await ctx.db.delete(tx._id);
    }
    const wallets = await ctx.db.query("driverWallets").collect();
    for (const wallet of wallets) {
      await ctx.db.delete(wallet._id);
    }
    return {
      deletedTransactions: transactions.length,
      deletedWallets: wallets.length,
    };
  },
});

/**
 * Borra historial de billetera y pone viajes en 0 (migración al modelo por viajes).
 */
export const resetAllTripAccountsForAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    await requireFullAdmin(ctx);
    const transactions = await ctx.db.query("walletTransactions").collect();
    for (const tx of transactions) {
      await ctx.db.delete(tx._id);
    }
    const wallets = await ctx.db.query("driverWallets").collect();
    for (const wallet of wallets) {
      await ctx.db.delete(wallet._id);
    }
    return {
      deletedTransactions: transactions.length,
      deletedWallets: wallets.length,
    };
  },
});

/**
 * Recarga de saldo: acredita el precio del paquete en soles.
 */
export const topUpMine = mutation({
  args: {
    packageId: driverTopUpPackageIdValidator,
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, driver } = await requireDriver(ctx);
    const pkg = getDriverTopUpPackage(args.packageId);
    const customNote = args.note?.trim();
    const defaultNote = `Recarga de saldo S/${pkg.pricePen}.`;
    const note = customNote !== undefined && customNote !== "" ? customNote : defaultNote;
    return await creditBalance(ctx, {
      driverId: driver._id,
      amount: pkg.pricePen,
      createdByUserId: user._id,
      packageId: args.packageId,
      note,
    });
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

export async function getWalletBalance(
  ctx: QueryCtx | MutationCtx,
  driverId: Id<"drivers">,
): Promise<number> {
  const wallet = await ctx.db
    .query("driverWallets")
    .withIndex("by_driver", (q) => q.eq("driverId", driverId))
    .unique();
  return normalizePen(wallet?.balance ?? 0);
}

/**
 * Descuenta la comisión del viaje al cerrarlo (idempotente por serviceId).
 * No bloquea el cierre si el saldo queda bajo el piso: ese control es al ofertar.
 */
export async function debitCommissionForService(
  ctx: MutationCtx,
  args: {
    driverId: Id<"drivers">;
    serviceId: Id<"services">;
    commission: number;
  },
): Promise<Doc<"driverWallets">> {
  const existing = await ctx.db
    .query("walletTransactions")
    .withIndex("by_service", (q) => q.eq("serviceId", args.serviceId))
    .collect();
  if (existing.some((tx) => tx.type === "commission_debit")) {
    return await ensureWallet(ctx, args.driverId);
  }

  const amount = normalizePen(args.commission);
  const wallet = await ensureWallet(ctx, args.driverId);
  if (amount <= 0) {
    return wallet;
  }
  const nextBalance = normalizePen((wallet.balance ?? 0) - amount);
  await ctx.db.patch(wallet._id, { balance: nextBalance, updatedAt: Date.now() });
  await ctx.db.insert("walletTransactions", {
    driverId: args.driverId,
    type: "commission_debit",
    amount,
    balanceAfter: nextBalance,
    serviceId: args.serviceId,
    note: `Comisión Hercom S/${amount.toFixed(2)}`,
    createdAt: Date.now(),
  });
  return (await ctx.db.get(wallet._id)) as Doc<"driverWallets">;
}

async function creditBalance(
  ctx: MutationCtx,
  args: {
    driverId: Id<"drivers">;
    amount: number;
    createdByUserId?: Id<"users">;
    packageId?: DriverTopUpPackageId;
    note?: string;
  },
): Promise<Doc<"driverWallets">> {
  const driver = await ctx.db.get(args.driverId);
  if (driver === null) {
    throw new Error("Chofer no encontrado.");
  }
  const amount = normalizePen(args.amount);
  if (amount <= 0) {
    throw new Error("La recarga debe ser mayor a 0.");
  }
  const wallet = await ensureWallet(ctx, args.driverId);
  const nextBalance = normalizePen((wallet.balance ?? 0) + amount);
  await ctx.db.patch(wallet._id, { balance: nextBalance, updatedAt: Date.now() });
  await ctx.db.insert("walletTransactions", {
    driverId: args.driverId,
    type: "top_up",
    amount,
    pricePenPaid: amount,
    balanceAfter: nextBalance,
    ...(args.packageId !== undefined ? { packageId: args.packageId } : {}),
    ...(args.createdByUserId !== undefined ? { createdByUserId: args.createdByUserId } : {}),
    ...(args.note !== undefined ? { note: args.note } : {}),
    createdAt: Date.now(),
  });
  return (await ctx.db.get(wallet._id)) as Doc<"driverWallets">;
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
