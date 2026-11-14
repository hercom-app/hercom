import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getCurrentUser, requireFullAdmin } from "./lib/auth";
import { formatPeruPersonFullName } from "./lib/personName";

const kindValidator = v.union(
  v.literal("js_error"),
  v.literal("boundary"),
  v.literal("native_suspect"),
);

function clip(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max)}…`;
}

function displayName(user: {
  name?: string;
  firstName?: string;
  firstLastName?: string;
  secondLastName?: string;
  email?: string;
  phone?: string;
}): string {
  if (
    user.firstName !== undefined ||
    user.firstLastName !== undefined ||
    user.secondLastName !== undefined
  ) {
    const formatted = formatPeruPersonFullName({
      firstLastName: user.firstLastName ?? "",
      secondLastName: user.secondLastName ?? "",
      firstName: user.firstName ?? "",
    });
    if (formatted !== "") {
      return formatted;
    }
  }
  const name = user.name?.trim() ?? "";
  if (name !== "") {
    return name;
  }
  return user.email?.trim() || user.phone?.trim() || "Sin nombre";
}

/**
 * Lo llama la app tras un error JS, ErrorBoundary o un cierre inesperado
 * detectado al reabrir. Si no hay sesión, igual se guarda el dispositivo.
 */
export const report = mutation({
  args: {
    deviceId: v.string(),
    kind: kindValidator,
    message: v.string(),
    stack: v.optional(v.string()),
    screen: v.optional(v.string()),
    platform: v.optional(v.string()),
    deviceBrand: v.optional(v.string()),
    deviceModel: v.optional(v.string()),
    osVersion: v.optional(v.string()),
    appVersion: v.optional(v.string()),
    extra: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const deviceId = clip(args.deviceId, 80);
    const message = clip(args.message, 500);
    if (deviceId === "" || message === "") {
      return null;
    }

    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    const recent =
      user !== null
        ? await ctx.db
            .query("appErrorReports")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .order("desc")
            .take(30)
        : await ctx.db
            .query("appErrorReports")
            .withIndex("by_device", (q) => q.eq("deviceId", deviceId))
            .order("desc")
            .take(30);

    const inLastHour = recent.filter((row) => row.createdAt >= hourAgo);
    if (inLastHour.length >= 20) {
      return null;
    }
    const duplicate = recent.find(
      (row) =>
        row.message === message &&
        row.kind === args.kind &&
        now - row.createdAt < 120_000,
    );
    if (duplicate !== undefined) {
      return duplicate._id;
    }

    const stack =
      args.stack === undefined ? undefined : clip(args.stack, 4000);
    const extra =
      args.extra === undefined ? undefined : clip(args.extra, 2000);

    console.error(
      `[appError] ${args.kind} ${user?._id ?? "anon"} ${deviceId}: ${message}`,
    );

    return await ctx.db.insert("appErrorReports", {
      ...(user !== null
        ? {
            userId: user._id,
            userName: displayName(user),
            ...(user.email !== undefined ? { userEmail: user.email } : {}),
            ...(user.phone !== undefined ? { userPhone: user.phone } : {}),
            ...(user.dni !== undefined ? { userDni: user.dni } : {}),
            userRole: user.role,
          }
        : {}),
      deviceId,
      kind: args.kind,
      message,
      ...(stack !== undefined ? { stack } : {}),
      ...(args.screen !== undefined
        ? { screen: clip(args.screen, 80) }
        : {}),
      ...(args.platform !== undefined
        ? { platform: clip(args.platform, 40) }
        : {}),
      ...(args.deviceBrand !== undefined
        ? { deviceBrand: clip(args.deviceBrand, 60) }
        : {}),
      ...(args.deviceModel !== undefined
        ? { deviceModel: clip(args.deviceModel, 80) }
        : {}),
      ...(args.osVersion !== undefined
        ? { osVersion: clip(args.osVersion, 40) }
        : {}),
      ...(args.appVersion !== undefined
        ? { appVersion: clip(args.appVersion, 40) }
        : {}),
      ...(extra !== undefined ? { extra } : {}),
      createdAt: now,
    });
  },
});

export const listForAdmin = query({
  args: {
    limit: v.optional(v.number()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await requireFullAdmin(ctx);
    const limit = Math.min(Math.max(args.limit ?? 80, 1), 200);

    const rows =
      args.userId !== undefined
        ? await ctx.db
            .query("appErrorReports")
            .withIndex("by_user", (q) =>
              q.eq("userId", args.userId as Id<"users">),
            )
            .order("desc")
            .take(limit)
        : await ctx.db
            .query("appErrorReports")
            .withIndex("by_createdAt")
            .order("desc")
            .take(limit);

    return await Promise.all(
      rows.map(async (row) => {
        const live =
          row.userId !== undefined ? await ctx.db.get(row.userId) : null;
        return {
          ...row,
          liveUser:
            live === null
              ? null
              : {
                  _id: live._id,
                  name: displayName(live),
                  email: live.email ?? null,
                  phone: live.phone ?? null,
                  dni: live.dni ?? null,
                  role: live.role,
                },
        };
      }),
    );
  },
});
