import { v } from "convex/values";
import { query } from "./_generated/server";
import {
  serviceStatusValidator,
  serviceTypeValidator,
} from "./schema";
import { requireStaff } from "./lib/auth";
import { filterServicesByAccess, getAccessContext } from "./lib/adminAccess";
import { matchesOriginRegion } from "./lib/regionFilters";

function normalizeMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function sumMoney(amounts: number[]): number {
  return normalizeMoney(amounts.reduce((sum, amount) => sum + amount, 0));
}

/** Inicio/fin de día en hora de Lima (UTC-5, sin DST). */
function limaRangeMs(fromDate: string, toDate: string): {
  fromMs: number;
  toMs: number;
} {
  return {
    fromMs: new Date(`${fromDate}T00:00:00-05:00`).getTime(),
    toMs: new Date(`${toDate}T23:59:59.999-05:00`).getTime(),
  };
}

function activityAt(service: {
  status: string;
  requestedAt: number;
  assignedAt?: number;
  finishedAt?: number;
  cancelledAt?: number;
}): number {
  if (service.status === "finished" && service.finishedAt !== undefined) {
    return service.finishedAt;
  }
  if (service.status === "cancelled" && service.cancelledAt !== undefined) {
    return service.cancelledAt;
  }
  return service.assignedAt ?? service.requestedAt;
}

/**
 * Ingresos operativos para gerencia: viajes en un rango de fechas,
 * filtrables por estado y tipo (app / premium).
 */
export const listRevenueForAdmin = query({
  args: {
    fromDate: v.string(),
    toDate: v.string(),
    status: v.optional(serviceStatusValidator),
    serviceType: v.optional(serviceTypeValidator),
    countryCode: v.optional(v.string()),
    department: v.optional(v.string()),
    province: v.optional(v.string()),
    district: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireStaff(ctx);
    const access = await getAccessContext(ctx, user);
    const { fromMs, toMs } = limaRangeMs(args.fromDate, args.toDate);
    if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || fromMs > toMs) {
      throw new Error("Rango de fechas inválido.");
    }

    let services = await ctx.db.query("services").order("desc").collect();
    services = filterServicesByAccess(services, access);
    if (
      args.countryCode !== undefined ||
      args.department !== undefined ||
      args.province !== undefined ||
      args.district !== undefined
    ) {
      services = services.filter((service) =>
        matchesOriginRegion(service.origin, {
          countryCode: args.countryCode,
          department: args.department,
          province: args.province,
          district: args.district,
        }),
      );
    }
    if (args.status !== undefined) {
      const status = args.status;
      services = services.filter((service) => service.status === status);
    }
    if (args.serviceType !== undefined) {
      if (args.serviceType === "app") {
        services = services.filter(
          (service) => (service.serviceType ?? "app") === "app",
        );
      } else {
        services = services.filter(
          (service) => service.serviceType === "premium",
        );
      }
    }

    const inRange = services.filter((service) => {
      const at = activityAt(service);
      return at >= fromMs && at <= toMs;
    });

    const rows = await Promise.all(
      inRange.map(async (service) => {
        const payment = await ctx.db
          .query("payments")
          .withIndex("by_service", (q) => q.eq("serviceId", service._id))
          .unique();
        const advanceAmount = service.advanceAmount ?? 0;
        return {
          serviceId: service._id,
          status: service.status,
          serviceType: service.serviceType ?? "app",
          origin: service.origin.address,
          destination: service.destination.address,
          totalPrice: normalizeMoney(service.totalPrice),
          commission: normalizeMoney(service.driverCommission),
          advanceAmount: normalizeMoney(advanceAmount),
          activityAt: activityAt(service),
          paymentStatus: payment?.status ?? null,
          paymentAmount: payment !== null ? normalizeMoney(payment.amount) : 0,
        };
      }),
    );

    const finished = rows.filter((row) => row.status === "finished");
    const closedGross = sumMoney(finished.map((row) => row.totalPrice));
    const closedCommission = sumMoney(finished.map((row) => row.commission));
    const pipelineGross = sumMoney(rows.map((row) => row.totalPrice));
    const pendingPayments = sumMoney(
      rows
        .filter((row) => row.paymentStatus === "pending")
        .map((row) => row.paymentAmount),
    );
    const paidPayments = sumMoney(
      rows
        .filter((row) => row.paymentStatus === "paid")
        .map((row) => row.paymentAmount),
    );

    return {
      fromDate: args.fromDate,
      toDate: args.toDate,
      totals: {
        trips: rows.length,
        finishedTrips: finished.length,
        closedGross,
        closedCommission,
        pipelineGross,
        pendingPayments,
        paidPayments,
      },
      rows,
    };
  },
});
