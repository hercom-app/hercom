import { v } from "convex/values";
import {
  internalAction,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
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

export const getExpoPushToken = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.expoPushToken ?? null;
  },
});

/**
 * Envía push al dispositivo vía Expo Push API.
 */
export const dispatchPush = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const token = await ctx.runQuery(internal.notifications.getExpoPushToken, {
      userId: args.userId,
    });
    if (token === null || token.trim() === "") {
      return;
    }
    try {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: token,
          sound: "default",
          title: args.title,
          body: args.message,
          channelId: "default",
        }),
      });
    } catch (error) {
      console.warn(
        "No se pudo enviar push Expo:",
        error instanceof Error ? error.message : error,
      );
    }
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
      | "driver_arrived_pickup"
      | "advance_confirmed"
      | "trip_route_updated";
    title: string;
    message: string;
    serviceId?: Id<"services">;
  },
): Promise<Id<"notifications">> {
  const notificationId = await ctx.db.insert("notifications", {
    userId: args.userId,
    type: args.type,
    title: args.title,
    message: args.message,
    ...(args.serviceId !== undefined ? { serviceId: args.serviceId } : {}),
    createdAt: Date.now(),
  });
  await ctx.scheduler.runAfter(0, internal.notifications.dispatchPush, {
    userId: args.userId,
    title: args.title,
    message: args.message,
  });
  return notificationId;
}
