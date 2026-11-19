import { query } from "./_generated/server";
import { requireDriver } from "./lib/auth";
import { normalizeMoney } from "./lib/money";
import { driverFacingTripMoney } from "./lib/driverFare";
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
 * Pestaña Ingresos del chofer.
 * El neto es lo que le queda: lo que el cliente le pagó menos la comisión real.
 * En primeros viajes el cliente paga menos y la comisión también es menor.
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
        const facing = driverFacingTripMoney(service);
        const stops = getServiceStops(service);
        return {
          serviceId: service._id,
          finishedAt,
          dayKey: limaDateKey(finishedAt),
          origin: service.origin.address,
          destination: (stops[stops.length - 1] ?? service.destination).address,
          gross: facing.clientPays,
          offer: facing.offer,
          clientPays: facing.clientPays,
          commission: facing.commission,
          fullCommission: facing.fullCommission,
          net: facing.net,
          discounted: facing.discounted,
          discountLabel:
            service.discountKind === "campaign"
              ? (service.promotionName ?? "Campaña")
              : facing.discounted
                ? "Primeros viajes"
                : "",
        };
      })
      .sort((a, b) => b.finishedAt - a.finishedAt);

    const topUps = transactions
      .filter((tx) => tx.type === "top_up" && tx.createdAt >= historyStart)
      .map((tx) => ({
        id: tx._id,
        createdAt: tx.createdAt,
        dayKey: limaDateKey(tx.createdAt),
        pricePen: normalizeMoney(tx.pricePenPaid ?? tx.amount),
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
        amount: trip.net,
        offer: trip.discounted ? trip.offer : undefined,
        commission: trip.discounted ? trip.commission : undefined,
        clientPays: trip.discounted ? trip.clientPays : undefined,
      })),
      ...topUps.map((topUp) => ({
        id: topUp.id as string,
        kind: "top_up" as const,
        at: topUp.createdAt,
        dayKey: topUp.dayKey,
        title: "Recarga",
        subtitle: "Recarga de saldo",
        amount: topUp.pricePen,
        offer: undefined,
        commission: undefined,
        clientPays: undefined,
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
      balance: normalizeMoney(wallet?.balance ?? 0),
    };
  },
});
