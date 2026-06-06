import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { userRoleValidator } from "./schema";
import { getCurrentUser, requireRole, requireUser } from "./lib/auth";

/**
 * Devuelve el usuario autenticado actual (o null si no hay sesión).
 */
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

/**
 * Actualiza el perfil básico del usuario autenticado.
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ctx.db.patch(user._id, {
      ...(args.name !== undefined ? { name: args.name } : {}),
      ...(args.phone !== undefined ? { phone: args.phone } : {}),
      ...(args.image !== undefined ? { image: args.image } : {}),
    });
    return user._id;
  },
});

/**
 * Asigna un rol a un usuario. Solo administradores.
 */
export const setRole = mutation({
  args: {
    userId: v.id("users"),
    role: userRoleValidator,
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    await ctx.db.patch(args.userId, { role: args.role });
    return args.userId;
  },
});

/**
 * Lista todos los usuarios (panel admin).
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    return await ctx.db.query("users").collect();
  },
});
