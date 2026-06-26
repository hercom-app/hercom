import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { requireUser } from "./lib/auth";

/**
 * Lista notificaciones del usuario autenticado.
 */
export const listMine = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = Math.min(Math.max(args.limit ?? 20, 1), 100);
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
  },
});

/**
 * Conteo de notificaciones no leídas.
 */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const all = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return all.filter((notification) => notification.readAt === undefined).length;
  },
});

/**
 * Marca una notificación como leída.
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (notification === null) {
      throw new Error("Notificación no encontrada.");
    }
    if (notification.userId !== user._id) {
      throw new Error("No autorizado.");
    }
    if (notification.readAt !== undefined) {
      return notification._id;
    }
    await ctx.db.patch(notification._id, { readAt: Date.now() });
    return notification._id;
  },
});

/**
 * Marca todas las notificaciones del usuario como leídas.
 */
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    await Promise.all(
      notifications
        .filter((notification) => notification.readAt === undefined)
        .map((notification) =>
          ctx.db.patch(notification._id, {
            readAt: Date.now(),
          }),
        ),
    );
    return true;
  },
});

export async function createNotification(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    type:
      | "offer_received"
      | "trip_confirmed_driver"
      | "trip_confirmed_client"
      | "driver_heading_pickup"
      | "driver_arrived_pickup";
    title: string;
    message: string;
    serviceId?: Id<"services">;
  },
): Promise<Id<"notifications">> {
  return await ctx.db.insert("notifications", {
    userId: args.userId,
    type: args.type,
    title: args.title,
    message: args.message,
    ...(args.serviceId !== undefined ? { serviceId: args.serviceId } : {}),
    createdAt: Date.now(),
  });
}
