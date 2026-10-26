import { query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireDriver } from "./lib/auth";
import { normalizeMoney } from "./lib/money";
import { getServiceStops } from "./lib/serviceStops";

const BAR_DAYS = 7;
const HISTORY_DAYS = 30;
const MAX_MOVEMENTS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

function limaDateKey(timestamp: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
}

function sumMoney(amounts: number[]): number {
  return normalizeMoney(amounts.reduce((sum, amount) => sum + amount, 0));
}

/**
 * Costo en soles de cada viaje prepagado consumido, por servicio.
 * Las recargas se consumen en orden de compra: 2 viajes por S/50 = S/25 cada uno.
 */
function tripCreditCostByService(
  transactions: Doc<"walletTransactions">[],
): Map<string, number> {
  const lots: { unitPen: number; remaining: number }[] = [];
  const costByService = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type === "top_up") {
      const trips = tx.tripsPurchased ?? tx.amount;
      if (trips > 0) {
        lots.push({ unitPen: (tx.pricePenPaid ?? 0) / trips, remaining: trips });
      }
      continue;
    }
    let pending = tx.amount;
    let cost = 0;
    while (pending > 0 && lots.length > 0) {
      const lot = lots[0]!;
      const take = Math.min(lot.remaining, pending);
      cost += take * lot.unitPen;
      lot.remaining -= take;
      pending -= take;
      if (lot.remaining <= 0) {
        lots.shift();
      }
    }
    if (tx.serviceId !== undefined) {
      costByService.set(tx.serviceId, normalizeMoney(cost));
    }
  }
  return costByService;
}

/**
 * Pestaña Dinero del chofer: neto por día (bruto − comisión Hercom),
 * barras de la semana y movimientos (viajes en bruto y recargas).
 */
export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const { driver } = await requireDriver(ctx);
    const now = Date.now();

    const transactions = await ctx.db
      .query("walletTransactions")
      .withIndex("by_driver_created", (q) => q.eq("driverId", driver._id))
      .order("asc")
      .collect();
    const costByService = tripCreditCostByService(transactions);

    const historyStart = now - HISTORY_DAYS * DAY_MS;
    const services = await ctx.db
      .query("services")
      .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
      .collect();
    const trips = services
      .filter(
        (service) =>
          service.status === "finished" &&
          service.finishedAt !== undefined &&
          service.finishedAt >= historyStart,
      )
      .map((service) => {
        const finishedAt = service.finishedAt as number;
        const gross = normalizeMoney(service.offeredPrice ?? service.totalPrice);
        const commission = costByService.get(service._id) ?? 0;
        const stops = getServiceStops(service);
        return {
          serviceId: service._id,
          finishedAt,
          dayKey: limaDateKey(finishedAt),
          origin: service.origin.address,
          destination: (stops[stops.length - 1] ?? service.destination).address,
          gross,
          commission,
          net: normalizeMoney(gross - commission),
        };
      })
      .sort((a, b) => b.finishedAt - a.finishedAt);

    const topUps = transactions
      .filter((tx) => tx.type === "top_up" && tx.createdAt >= historyStart)
      .map((tx) => ({
        id: tx._id,
        createdAt: tx.createdAt,
        dayKey: limaDateKey(tx.createdAt),
        trips: tx.tripsPurchased ?? tx.amount,
        pricePen: normalizeMoney(tx.pricePenPaid ?? 0),
      }))
      .sort((a, b) => b.createdAt - a.createdAt);

    const days = [];
    for (let offset = BAR_DAYS - 1; offset >= 0; offset -= 1) {
      const at = now - offset * DAY_MS;
      const dayKey = limaDateKey(at);
      const dayTrips = trips.filter((trip) => trip.dayKey === dayKey);
      days.push({
        dayKey,
        at,
        trips: dayTrips.length,
        gross: sumMoney(dayTrips.map((trip) => trip.gross)),
        commission: sumMoney(dayTrips.map((trip) => trip.commission)),
        net: sumMoney(dayTrips.map((trip) => trip.net)),
      });
    }

    const movements = [
      ...trips.map((trip) => ({
        id: trip.serviceId as string,
        kind: "trip" as const,
        at: trip.finishedAt,
        dayKey: trip.dayKey,
        title: "Viaje",
        subtitle: `Desde ${trip.origin}`,
        amount: trip.gross,
      })),
      ...topUps.map((topUp) => ({
        id: topUp.id as string,
        kind: "top_up" as const,
        at: topUp.createdAt,
        dayKey: topUp.dayKey,
        title: "Recarga",
        subtitle: `${topUp.trips} ${topUp.trips === 1 ? "viaje prepagado" : "viajes prepagados"}`,
        amount: topUp.pricePen,
      })),
    ]
      .sort((a, b) => b.at - a.at)
      .slice(0, MAX_MOVEMENTS);

    const wallet = await ctx.db
      .query("driverWallets")
      .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
      .unique();

    return {
      todayKey: limaDateKey(now),
      days,
      trips,
      topUps,
      movements,
      tripCredits: wallet?.tripCredits ?? 0,
    };
  },
});
