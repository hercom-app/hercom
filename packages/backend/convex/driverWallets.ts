import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { requireDriver, requireFullAdmin } from "./lib/auth";
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

type WalletTxType = Doc<"walletTransactions">["type"];

function normalizeTrips(trips: number): number {
  if (!Number.isFinite(trips)) {
    return 0;
  }
  return Math.max(0, Math.round(trips));
}

function normalizePen(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Viajes disponibles del chofer autenticado (crea cuenta en 0 si no existe).
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
      tripCredits: wallet?.tripCredits ?? 0,
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
 * Vista administrativa de viajes prepagados por chofer.
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
          tripCredits: wallet?.tripCredits ?? 0,
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
 * Recarga de paquete: acredita viajes; Izipay cobra el precio del paquete en la app.
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
    const defaultNote = `Recarga ${pkg.label} (S/${pkg.pricePen}).`;
    const note = customNote !== undefined && customNote !== "" ? customNote : defaultNote;
    return await creditTrips(ctx, {
      driverId: driver._id,
      trips: pkg.trips,
      type: "top_up",
      createdByUserId: user._id,
      packageId: args.packageId,
      pricePenPaid: pkg.pricePen,
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
    tripCredits: 0,
    updatedAt: Date.now(),
  });
  return (await ctx.db.get(walletId)) as Doc<"driverWallets">;
}

export async function getTripCredits(
  ctx: QueryCtx,
  driverId: Id<"drivers">,
): Promise<number> {
  const wallet = await ctx.db
    .query("driverWallets")
    .withIndex("by_driver", (q) => q.eq("driverId", driverId))
    .unique();
  return wallet?.tripCredits ?? 0;
}

/** Al menos 1 viaje prepagado para tomar u ofertar un servicio. */
export async function hasTripCreditForService(
  ctx: QueryCtx,
  driverId: Id<"drivers">,
): Promise<boolean> {
  return (await getTripCredits(ctx, driverId)) >= 1;
}

/**
 * Descuenta 1 viaje al cerrar un servicio (idempotente por serviceId).
 */
export async function debitTripForService(
  ctx: MutationCtx,
  args: {
    driverId: Id<"drivers">;
    serviceId: Id<"services">;
  },
): Promise<Doc<"driverWallets">> {
  const existingDebit = await ctx.db
    .query("walletTransactions")
    .withIndex("by_service", (q) => q.eq("serviceId", args.serviceId))
    .collect();
  if (existingDebit.some((tx) => tx.type === "trip_debit")) {
    const wallet = await ensureWallet(ctx, args.driverId);
    return wallet;
  }

  const wallet = await ensureWallet(ctx, args.driverId);
  if (wallet.tripCredits < 1) {
    throw new Error(
      "El chofer no tiene viajes prepagados suficientes para cerrar este servicio.",
    );
  }
  const nextCredits = normalizeTrips(wallet.tripCredits - 1);
  await ctx.db.patch(wallet._id, { tripCredits: nextCredits, updatedAt: Date.now() });
  await ctx.db.insert("walletTransactions", {
    driverId: args.driverId,
    type: "trip_debit",
    amount: 1,
    tripsAfter: nextCredits,
    serviceId: args.serviceId,
    createdAt: Date.now(),
  });
  return (await ctx.db.get(wallet._id)) as Doc<"driverWallets">;
}

async function creditTrips(
  ctx: MutationCtx,
  args: {
    driverId: Id<"drivers">;
    trips: number;
    type: WalletTxType;
    createdByUserId?: Id<"users">;
    packageId?: DriverTopUpPackageId;
    pricePenPaid?: number;
    note?: string;
  },
): Promise<Doc<"driverWallets">> {
  const driver = await ctx.db.get(args.driverId);
  if (driver === null) {
    throw new Error("Chofer no encontrado.");
  }
  const trips = normalizeTrips(args.trips);
  if (trips <= 0) {
    throw new Error("La recarga debe incluir al menos 1 viaje.");
  }
  const wallet = await ensureWallet(ctx, args.driverId);
  const nextCredits = normalizeTrips(wallet.tripCredits + trips);
  await ctx.db.patch(wallet._id, { tripCredits: nextCredits, updatedAt: Date.now() });
  await ctx.db.insert("walletTransactions", {
    driverId: args.driverId,
    type: args.type,
    amount: trips,
    ...(args.type === "top_up"
      ? {
          tripsPurchased: trips,
          ...(args.packageId !== undefined ? { packageId: args.packageId } : {}),
        }
      : {}),
    tripsAfter: nextCredits,
    ...(args.pricePenPaid !== undefined
      ? { pricePenPaid: normalizePen(args.pricePenPaid) }
      : {}),
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
