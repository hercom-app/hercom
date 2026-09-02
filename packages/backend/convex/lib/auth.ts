import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { getAccessContext, isStaffRole } from "./adminAccess";

/**
 * Devuelve el usuario autenticado o `null` si no hay sesión.
 */
export async function getCurrentUser(ctx: QueryCtx): Promise<Doc<"users"> | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
}

/**
 * Exige una sesión válida. Lanza si no hay usuario autenticado.
 */
export async function requireUser(ctx: QueryCtx): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (user === null) {
    throw new Error("No autenticado: se requiere iniciar sesión.");
  }
  return user;
}

/**
 * Exige que el usuario autenticado tenga un rol concreto.
 */
export async function requireRole(
  ctx: QueryCtx,
  role: Doc<"users">["role"],
): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.role !== role) {
    throw new Error(`No autorizado: se requiere rol "${role}".`);
  }
  return user;
}

/**
 * Superadmin o admin operativo (con o sin distritos).
 */
export async function requireStaff(ctx: QueryCtx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (!isStaffRole(user.role)) {
    throw new Error("No autorizado: se requiere acceso al panel interno.");
  }
  return user;
}

/**
 * Dueño de la empresa (superadmin, o admin legado sin distritos).
 */
export async function requireFullAdmin(ctx: QueryCtx): Promise<Doc<"users">> {
  const user = await requireStaff(ctx);
  const access = await getAccessContext(ctx, user);
  if (!access.isFullAdmin) {
    throw new Error("No autorizado: se requiere superadmin.");
  }
  return user;
}

/**
 * Exige que el usuario autenticado tenga un perfil de chofer y lo devuelve
 * junto con el usuario.
 */
export async function requireDriver(
  ctx: QueryCtx,
): Promise<{ user: Doc<"users">; driver: Doc<"drivers"> }> {
  const user = await requireUser(ctx);
  const driver = await ctx.db
    .query("drivers")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .unique();
  if (driver === null) {
    throw new Error("No autorizado: el usuario no tiene perfil de chofer.");
  }
  return { user, driver };
}
