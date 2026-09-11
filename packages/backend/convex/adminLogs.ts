import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAccessContext } from "./lib/adminAccess";
import { getCurrentUser, requireStaff } from "./lib/auth";

function clip(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}…`;
}

/**
 * Persiste un error de app o panel. Se llama desde el cliente después de un
 * fallo: si se logueara en la misma mutation que falló, Convex revierte el write.
 * La consola del servidor (Convex Dashboard → Logs) siempre lo imprime.
 */
export const record = mutation({
  args: {
    action: v.string(),
    message: v.string(),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const action = clip(args.action.trim(), 120);
    const message = clip(args.message.trim(), 500);
    const detail =
      args.detail === undefined ? undefined : clip(args.detail, 4000);

    console.error(`[appLog] ${action}: ${message}`, detail ?? "");

    if (user === null) {
      return null;
    }

    return await ctx.db.insert("adminLogs", {
      actorId: user._id,
      action,
      level: "error",
      message,
      ...(detail !== undefined ? { detail } : {}),
      createdAt: Date.now(),
    });
  },
});

export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireStaff(ctx);
    const access = await getAccessContext(ctx, user);
    const limit = Math.min(Math.max(args.limit ?? 20, 1), 100);
    const rows = await ctx.db
      .query("adminLogs")
      .withIndex("by_createdAt")
      .order("desc")
      .take(access.isFullAdmin ? limit : 300);
    if (access.isFullAdmin) {
      return rows;
    }
    return rows.filter((row) => row.actorId === user._id).slice(0, limit);
  },
});
