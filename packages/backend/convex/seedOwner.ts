import { internalMutation, internalQuery } from "./_generated/server";
import { isFullAdmin, listDistrictScopes } from "./lib/adminAccess";

const OWNER_EMAIL = "ricardos@hercom.com";
const OWNER_NAME = "Ricardo Bejarano";

export const inspectOwner = internalQuery({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", OWNER_EMAIL))
      .unique();
    if (user === null) {
      return { found: false as const, email: OWNER_EMAIL };
    }
    const scopes = await listDistrictScopes(ctx, user._id);
    return {
      found: true as const,
      email: user.email,
      userId: user._id,
      name: user.name ?? null,
      role: user.role,
      isFullAdmin: isFullAdmin(user, scopes),
      scopes: scopes.map((row) => ({
        department: row.department,
        province: row.province,
        district: row.district,
      })),
    };
  },
});

export const setOwnerDisplayName = internalMutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", OWNER_EMAIL))
      .unique();
    if (user === null) {
      throw new Error("No existe el superadmin.");
    }
    await ctx.db.patch(user._id, { name: OWNER_NAME });
    return { email: OWNER_EMAIL, name: OWNER_NAME };
  },
});

/** Dueño del panel: superadmin sin zonas, para ver Errores de app y el resto. */
export const ensureOwnerSuperadmin = internalMutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", OWNER_EMAIL))
      .unique();
    if (user === null) {
      throw new Error("No existe ricardos@hercom.com.");
    }
    const scopes = await listDistrictScopes(ctx, user._id);
    const previous = {
      role: user.role,
      isFullAdmin: isFullAdmin(user, scopes),
      scopeCount: scopes.length,
    };
    if (user.role !== "superadmin" || user.name !== OWNER_NAME) {
      await ctx.db.patch(user._id, {
        role: "superadmin",
        name: OWNER_NAME,
      });
    }
    for (const row of scopes) {
      await ctx.db.delete(row._id);
    }
    return {
      email: OWNER_EMAIL,
      userId: user._id,
      previous,
      now: { role: "superadmin" as const, isFullAdmin: true },
    };
  },
});
