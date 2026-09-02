import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { requireStaff, requireUser, getCurrentUser } from "./lib/auth";
import { isStaffRole } from "./lib/adminAccess";
import { createNotification } from "./notifications";

const MAX_BODY_LENGTH = 1500;
const PREVIEW_LENGTH = 80;

function previewOf(body: string): string {
  const compact = body.replace(/\s+/g, " ").trim();
  if (compact.length <= PREVIEW_LENGTH) {
    return compact;
  }
  return `${compact.slice(0, PREVIEW_LENGTH - 1)}…`;
}

function normalizeBody(raw: string): string {
  const body = raw.trim();
  if (body === "") {
    throw new Error("Escribe un mensaje.");
  }
  if (body.length > MAX_BODY_LENGTH) {
    throw new Error(`El mensaje no puede superar ${MAX_BODY_LENGTH} caracteres.`);
  }
  return body;
}

async function getThreadForUser(
  ctx: MutationCtx,
  userId: Id<"users">,
) {
  return await ctx.db
    .query("supportThreads")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}

async function getOrCreateThread(
  ctx: MutationCtx,
  userId: Id<"users">,
  now: number,
) {
  const existing = await getThreadForUser(ctx, userId);
  if (existing !== null) {
    return existing;
  }
  const threadId = await ctx.db.insert("supportThreads", {
    userId,
    lastMessageAt: now,
    lastMessagePreview: "",
    unreadForAdmin: 0,
    unreadForUser: 0,
    status: "open",
    createdAt: now,
  });
  const created = await ctx.db.get(threadId);
  if (created === null) {
    throw new Error("No se pudo abrir el hilo de ayuda.");
  }
  return created;
}

/**
 * Hilo del usuario autenticado, o null si aún no escribió.
 */
export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("supportThreads")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});

/**
 * Mensajes no leídos de operaciones para el badge de Ayuda.
 */
export const getMyUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return 0;
    }
    const thread = await ctx.db
      .query("supportThreads")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    return thread?.unreadForUser ?? 0;
  },
});

/**
 * Historial del hilo propio, más antiguo primero.
 */
export const listMyMessages = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const thread = await ctx.db
      .query("supportThreads")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (thread === null) {
      return [];
    }
    const messages = await ctx.db
      .query("supportMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", thread._id))
      .order("asc")
      .collect();
    return messages.map((message) => ({
      _id: message._id,
      body: message.body,
      createdAt: message.createdAt,
      authorRole: message.authorRole,
      isMine: message.authorId === user._id,
    }));
  },
});

/**
 * Envía un mensaje desde la app. Crea el hilo si no existe.
 */
export const sendMine = mutation({
  args: {
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const body = normalizeBody(args.body);
    const now = Date.now();
    const thread = await getOrCreateThread(ctx, user._id, now);
    await ctx.db.insert("supportMessages", {
      threadId: thread._id,
      authorId: user._id,
      authorRole: "user",
      body,
      createdAt: now,
    });
    await ctx.db.patch(thread._id, {
      lastMessageAt: now,
      lastMessagePreview: previewOf(body),
      unreadForAdmin: thread.unreadForAdmin + 1,
      unreadForUser: 0,
      status: "open",
    });
    return thread._id;
  },
});

/**
 * Marca como leídas las respuestas de operaciones.
 */
export const markMineRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const thread = await getThreadForUser(ctx, user._id);
    if (thread === null || thread.unreadForUser === 0) {
      return false;
    }
    await ctx.db.patch(thread._id, { unreadForUser: 0 });
    return true;
  },
});

/**
 * Bandeja de hilos para el panel interno.
 */
export const listThreadsForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    const threads = await ctx.db
      .query("supportThreads")
      .withIndex("by_last_message")
      .order("desc")
      .take(80);
    return await Promise.all(
      threads.map(async (thread) => {
        const user = await ctx.db.get(thread.userId);
        return {
          _id: thread._id,
          userId: thread.userId,
          userName: user?.name?.trim() || user?.email || "Usuario",
          userEmail: user?.email ?? "",
          userRole: user?.role ?? "client",
          lastMessageAt: thread.lastMessageAt,
          lastMessagePreview: thread.lastMessagePreview,
          unreadForAdmin: thread.unreadForAdmin,
          status: thread.status,
        };
      }),
    );
  },
});

export const getAdminUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null || !isStaffRole(user.role)) {
      return 0;
    }
    const threads = await ctx.db.query("supportThreads").collect();
    return threads.reduce((sum, thread) => sum + thread.unreadForAdmin, 0);
  },
});

export const listMessagesForAdmin = query({
  args: {
    threadId: v.id("supportThreads"),
  },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);
    const thread = await ctx.db.get(args.threadId);
    if (thread === null) {
      throw new Error("Hilo no encontrado.");
    }
    const user = await ctx.db.get(thread.userId);
    const messages = await ctx.db
      .query("supportMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .collect();
    return {
      thread: {
        _id: thread._id,
        userName: user?.name?.trim() || user?.email || "Usuario",
        userEmail: user?.email ?? "",
        userRole: user?.role ?? "client",
        unreadForAdmin: thread.unreadForAdmin,
        status: thread.status,
      },
      messages: messages.map((message) => ({
        _id: message._id,
        body: message.body,
        createdAt: message.createdAt,
        authorRole: message.authorRole,
        isMine: message.authorId === staff._id,
      })),
    };
  },
});

export const sendFromAdmin = mutation({
  args: {
    threadId: v.id("supportThreads"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);
    const body = normalizeBody(args.body);
    const thread = await ctx.db.get(args.threadId);
    if (thread === null) {
      throw new Error("Hilo no encontrado.");
    }
    const now = Date.now();
    await ctx.db.insert("supportMessages", {
      threadId: thread._id,
      authorId: staff._id,
      authorRole: "staff",
      body,
      createdAt: now,
    });
    await ctx.db.patch(thread._id, {
      lastMessageAt: now,
      lastMessagePreview: previewOf(body),
      unreadForAdmin: 0,
      unreadForUser: thread.unreadForUser + 1,
      status: "open",
    });
    await createNotification(ctx, {
      userId: thread.userId,
      type: "support_reply",
      title: "Respuesta de Hercom",
      message: previewOf(body),
    });
    return thread._id;
  },
});

export const markAdminRead = mutation({
  args: {
    threadId: v.id("supportThreads"),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const thread = await ctx.db.get(args.threadId);
    if (thread === null) {
      throw new Error("Hilo no encontrado.");
    }
    if (thread.unreadForAdmin === 0) {
      return false;
    }
    await ctx.db.patch(thread._id, { unreadForAdmin: 0 });
    return true;
  },
});
