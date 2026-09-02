import { internalMutation } from "./_generated/server";

const OWNER_EMAIL = "ricardos@hercom.com";
const OWNER_NAME = "Ricardo Bejarano";

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
