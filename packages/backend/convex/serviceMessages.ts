import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { createNotification } from "./notifications";

async function assertTripParticipant(
  ctx: QueryCtx | MutationCtx,
  serviceId: Id<"services">,
) {
  const user = await requireUser(ctx);
  const service = await ctx.db.get(serviceId);
  if (service === null) {
    throw new Error("Servicio no encontrado.");
  }
  const driver =
    service.driverId !== undefined ? await ctx.db.get(service.driverId) : null;
  const isClient = service.clientId === user._id;
  const isDriver = driver !== null && driver.userId === user._id;
  if (!isClient && !isDriver) {
    throw new Error("No autorizado para este chat.");
  }
  return { user, service, isClient, driver };
}

/** Mensajes del viaje entre cliente y chofer. */
export const listForService = query({
  args: {
    serviceId: v.id("services"),
  },
  handler: async (ctx, args) => {
    await assertTripParticipant(ctx, args.serviceId);
    return await ctx.db
      .query("serviceMessages")
      .withIndex("by_service", (q) => q.eq("serviceId", args.serviceId))
      .order("asc")
      .take(200);
  },
});

export const send = mutation({
  args: {
    serviceId: v.id("services"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const body = args.body.trim();
    if (body.length < 1 || body.length > 1000) {
      throw new Error("Escribe un mensaje de hasta 1000 caracteres.");
    }
    const { user, service, isClient, driver } = await assertTripParticipant(
      ctx,
      args.serviceId,
    );
    if (service.status === "pending" || service.driverId === undefined) {
      throw new Error("El chat se habilita cuando el viaje tiene chofer.");
    }
    if (
      service.status === "finished" ||
      service.status === "cancelled" ||
      service.status === "unattended"
    ) {
      throw new Error("El chat de este viaje ya no está activo.");
    }

    await ctx.db.insert("serviceMessages", {
      serviceId: service._id,
      authorId: user._id,
      authorRole: isClient ? "client" : "driver",
      body,
      createdAt: Date.now(),
    });

    const recipientId = isClient ? driver?.userId : service.clientId;
    if (recipientId !== undefined) {
      await createNotification(ctx, {
        userId: recipientId,
        type: "service_message",
        title: isClient ? "Mensaje del cliente" : "Mensaje del chofer",
        message: body.slice(0, 140),
        serviceId: service._id,
      });
    }

    return service._id;
  },
});
