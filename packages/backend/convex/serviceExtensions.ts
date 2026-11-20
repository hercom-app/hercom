import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { requireDriver, requireUser } from "./lib/auth";
import { getMarketByCountry } from "./lib/markets";
import {
  computeExtensionAmounts,
  computePlatformCommissionForService,
} from "./lib/pricing";
import { resolveCommissionRate } from "./lib/offerLimits";
import {
  MS_PER_SERVICE_HOUR,
  computeServiceEndsAt,
} from "./lib/commissionTiers";
import { getWalletBalance, balanceCoversCommission, insufficientBalanceMessage } from "./driverWallets";
import { createNotification } from "./notifications";

function normalizeMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

const EXTENDABLE_STATUSES = new Set<Doc<"services">["status"]>([
  "in_progress",
  "en_route",
  "arrived_destination",
]);

async function applyAcceptedExtension(
  ctx: MutationCtx,
  service: Doc<"services">,
  extraHours: number,
  clientExtra: number,
  listExtra: number,
) {
  const hourly =
    service.hourlyRateSnapshot ??
    (await getMarketByCountry(ctx, service.origin.countryCode)).hourlyRate;
  const market = await getMarketByCountry(ctx, service.origin.countryCode);
  const currentHours = service.serviceHours ?? market.minServiceHours;
  const nextHours = currentHours + extraHours;
  const commissionRate = await resolveCommissionRate(ctx, service.origin);
  const newOffered = normalizeMoney((service.offeredPrice ?? 0) + listExtra);
  const newTotal = normalizeMoney(service.totalPrice + clientExtra);
  const newCommission = computePlatformCommissionForService(
    newOffered,
    service.discountRate,
    { commissionRate, serviceHours: nextHours, hourlyRate: hourly },
  );

  if (service.driverId !== undefined) {
    const balance = await getWalletBalance(ctx, service.driverId);
    const deltaCommission = normalizeMoney(newCommission - service.driverCommission);
    if (deltaCommission > 0 && !balanceCoversCommission(balance, deltaCommission)) {
      throw new Error(
        insufficientBalanceMessage(balance, deltaCommission, commissionRate),
      );
    }
  }

  const baseEndsAt =
    service.serviceEndsAt ??
    (service.departedWithClientAt !== undefined
      ? computeServiceEndsAt(service.departedWithClientAt, currentHours)
      : Date.now());
  const serviceEndsAt = baseEndsAt + extraHours * MS_PER_SERVICE_HOUR;

  await ctx.db.patch(service._id, {
    offeredPrice: newOffered,
    totalPrice: newTotal,
    driverCommission: newCommission,
    serviceHours: nextHours,
    serviceEndsAt,
    extendedAt: [...(service.extendedAt ?? []), Date.now()],
  });
}

/** Propuesta abierta de extensión para un servicio (cliente o chofer). */
export const getActiveForService = query({
  args: { serviceId: v.id("services") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null) {
      return null;
    }
    const driver =
      service.driverId !== undefined ? await ctx.db.get(service.driverId) : null;
    const allowed =
      service.clientId === user._id ||
      (driver !== null && driver.userId === user._id);
    if (!allowed) {
      return null;
    }
    const rows = await ctx.db
      .query("serviceExtensionRequests")
      .withIndex("by_service", (q) => q.eq("serviceId", service._id))
      .order("desc")
      .collect();
    return (
      rows.find(
        (row) => row.status === "pending_driver" || row.status === "countered",
      ) ?? null
    );
  },
});

export const quoteForClient = query({
  args: {
    serviceId: v.id("services"),
    extraHours: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null || service.clientId !== user._id) {
      return null;
    }
    const hourly =
      service.hourlyRateSnapshot ??
      (await getMarketByCountry(ctx, service.origin.countryCode)).hourlyRate;
    const commissionRate = await resolveCommissionRate(ctx, service.origin);
    const hours = Math.min(12, Math.max(1, Math.round(args.extraHours)));
    const amounts = computeExtensionAmounts(
      hours,
      hourly,
      service.discountRate,
      commissionRate,
    );
    return { extraHours: hours, hourlyRate: hourly, ...amounts };
  },
});

/** Cliente pide extender horas y propone monto. */
export const requestExtension = mutation({
  args: {
    serviceId: v.id("services"),
    extraHours: v.number(),
    clientAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (service === null || service.clientId !== user._id) {
      throw new Error("No autorizado.");
    }
    if (service.driverId === undefined) {
      throw new Error("Este viaje no tiene chofer.");
    }
    if (!EXTENDABLE_STATUSES.has(service.status)) {
      throw new Error("Solo puedes extender un viaje en curso.");
    }
    const extraHours = Math.min(12, Math.max(1, Math.round(args.extraHours)));
    const clientAmount = normalizeMoney(Math.max(args.clientAmount, 0));
    if (clientAmount <= 0) {
      throw new Error("Indica un monto válido para la extensión.");
    }

    const existing = await ctx.db
      .query("serviceExtensionRequests")
      .withIndex("by_service_status", (q) =>
        q.eq("serviceId", service._id).eq("status", "pending_driver"),
      )
      .collect();
    const existingCounter = await ctx.db
      .query("serviceExtensionRequests")
      .withIndex("by_service_status", (q) =>
        q.eq("serviceId", service._id).eq("status", "countered"),
      )
      .collect();
    if (existing.length > 0 || existingCounter.length > 0) {
      throw new Error("Ya hay una propuesta de extensión en curso.");
    }

    const requestId = await ctx.db.insert("serviceExtensionRequests", {
      serviceId: service._id,
      clientId: user._id,
      driverId: service.driverId,
      extraHours,
      clientAmount,
      status: "pending_driver",
      createdAt: Date.now(),
    });

    const driver = await ctx.db.get(service.driverId);
    if (driver !== null) {
      await createNotification(ctx, {
        userId: driver.userId,
        type: "extension_requested",
        title: "Cliente quiere extender",
        message: `+${extraHours} h por S/${clientAmount.toFixed(2)}. Acepta, rechaza o contraoferta.`,
        serviceId: service._id,
      });
    }
    return requestId;
  },
});

/** Chofer acepta, rechaza o contraoferta. */
export const respondAsDriver = mutation({
  args: {
    requestId: v.id("serviceExtensionRequests"),
    action: v.union(v.literal("accept"), v.literal("reject"), v.literal("counter")),
    counterAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { driver } = await requireDriver(ctx);
    const request = await ctx.db.get(args.requestId);
    if (request === null || request.driverId !== driver._id) {
      throw new Error("Solicitud no encontrada.");
    }
    if (request.status !== "pending_driver") {
      throw new Error("Esta solicitud ya fue respondida.");
    }
    const service = await ctx.db.get(request.serviceId);
    if (service === null) {
      throw new Error("Servicio no encontrado.");
    }

    const now = Date.now();
    if (args.action === "reject") {
      await ctx.db.patch(request._id, { status: "rejected", respondedAt: now });
      await createNotification(ctx, {
        userId: service.clientId,
        type: "extension_rejected",
        title: "Extensión rechazada",
        message: "El chofer no aceptó la extensión. Puedes proponer otro monto.",
        serviceId: service._id,
      });
      return request._id;
    }

    if (args.action === "counter") {
      const counterAmount = normalizeMoney(args.counterAmount ?? 0);
      if (counterAmount <= 0) {
        throw new Error("Indica un monto para la contraoferta.");
      }
      await ctx.db.patch(request._id, {
        status: "countered",
        driverAmount: counterAmount,
        respondedAt: now,
      });
      await createNotification(ctx, {
        userId: service.clientId,
        type: "extension_countered",
        title: "Contraoferta del chofer",
        message: `Propone S/${counterAmount.toFixed(2)} por +${request.extraHours} h. Acepta o rechaza.`,
        serviceId: service._id,
      });
      return request._id;
    }

    const hourly =
      service.hourlyRateSnapshot ??
      (await getMarketByCountry(ctx, service.origin.countryCode)).hourlyRate;
    const commissionRate = await resolveCommissionRate(ctx, service.origin);
    const { listExtra } = computeExtensionAmounts(
      request.extraHours,
      hourly,
      service.discountRate,
      commissionRate,
    );
    await applyAcceptedExtension(
      ctx,
      service,
      request.extraHours,
      request.clientAmount,
      listExtra,
    );
    await ctx.db.patch(request._id, { status: "accepted", respondedAt: now });
    await createNotification(ctx, {
      userId: service.clientId,
      type: "extension_accepted",
      title: "Extensión confirmada",
      message: `+${request.extraHours} h por S/${request.clientAmount.toFixed(2)}. Total del servicio actualizado.`,
      serviceId: service._id,
    });
    return request._id;
  },
});

/** Cliente acepta la contraoferta del chofer. */
export const acceptCounterAsClient = mutation({
  args: { requestId: v.id("serviceExtensionRequests") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (request === null || request.clientId !== user._id) {
      throw new Error("Solicitud no encontrada.");
    }
    if (request.status !== "countered" || request.driverAmount === undefined) {
      throw new Error("No hay contraoferta para aceptar.");
    }
    const service = await ctx.db.get(request.serviceId);
    if (service === null) {
      throw new Error("Servicio no encontrado.");
    }
    const hourly =
      service.hourlyRateSnapshot ??
      (await getMarketByCountry(ctx, service.origin.countryCode)).hourlyRate;
    const commissionRate = await resolveCommissionRate(ctx, service.origin);
    const { listExtra } = computeExtensionAmounts(
      request.extraHours,
      hourly,
      service.discountRate,
      commissionRate,
    );
    await applyAcceptedExtension(
      ctx,
      service,
      request.extraHours,
      request.driverAmount,
      listExtra,
    );
    await ctx.db.patch(request._id, {
      status: "accepted",
      respondedAt: Date.now(),
    });
    if (service.driverId !== undefined) {
      const driver = await ctx.db.get(service.driverId);
      if (driver !== null) {
        await createNotification(ctx, {
          userId: driver.userId,
          type: "extension_accepted",
          title: "Cliente aceptó la contraoferta",
          message: `+${request.extraHours} h por S/${request.driverAmount.toFixed(2)}.`,
          serviceId: service._id,
        });
      }
    }
    return request._id;
  },
});

/** Cliente rechaza la contraoferta. */
export const rejectCounterAsClient = mutation({
  args: { requestId: v.id("serviceExtensionRequests") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (request === null || request.clientId !== user._id) {
      throw new Error("Solicitud no encontrada.");
    }
    if (request.status !== "countered") {
      throw new Error("No hay contraoferta abierta.");
    }
    await ctx.db.patch(request._id, {
      status: "rejected",
      respondedAt: Date.now(),
    });
    return request._id;
  },
});