import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation } from "./_generated/server";
import { createAccount, modifyAccountCredentials } from "@convex-dev/auth/server";

const HERCOM_STAFF_EMAILS = new Set([
  "ricardos@hercom.com",
  "lima@hercom.com",
  "rrhh@hercom.com",
]);

const HR_ADMIN_EMAIL = "rrhh@hercom.com";
const HR_ADMIN_PASSWORD = "RrhhHercom2026";
const HR_ADMIN_NAME = "Recursos Humanos";

async function deleteStorageIfPresent(
  ctx: MutationCtx,
  storageId: Id<"_storage"> | undefined,
): Promise<void> {
  if (storageId === undefined) {
    return;
  }
  await ctx.storage.delete(storageId);
}

async function deleteAuthForUser(
  ctx: MutationCtx,
  userId: Doc<"users">["_id"],
  email: string | undefined,
  phone: string | undefined,
): Promise<void> {
  const sessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .collect();
  const sessionIds = new Set(sessions.map((session) => session._id));
  const verifiers = await ctx.db.query("authVerifiers").collect();
  for (const verifier of verifiers) {
    if (verifier.sessionId !== undefined && sessionIds.has(verifier.sessionId)) {
      await ctx.db.delete(verifier._id);
    }
  }
  for (const session of sessions) {
    const refreshTokens = await ctx.db
      .query("authRefreshTokens")
      .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
      .collect();
    for (const token of refreshTokens) {
      await ctx.db.delete(token._id);
    }
    await ctx.db.delete(session._id);
  }

  const accounts = await ctx.db.query("authAccounts").collect();
  for (const account of accounts) {
    if (account.userId !== userId) {
      continue;
    }
    const codes = await ctx.db
      .query("authVerificationCodes")
      .withIndex("accountId", (q) => q.eq("accountId", account._id))
      .collect();
    for (const code of codes) {
      await ctx.db.delete(code._id);
    }
    await ctx.db.delete(account._id);
  }

  const identifiers = [email, phone].filter(
    (value): value is string => value !== undefined && value !== "",
  );
  for (const identifier of identifiers) {
    const rateLimit = await ctx.db
      .query("authRateLimits")
      .withIndex("identifier", (q) => q.eq("identifier", identifier))
      .unique();
    if (rateLimit !== null) {
      await ctx.db.delete(rateLimit._id);
    }
  }
}

async function ensureUserWithPassword(
  ctx: MutationCtx,
  email: string,
  name: string,
  role: Doc<"users">["role"],
  password: string,
): Promise<Doc<"users">> {
  const existing = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .unique();
  if (existing !== null) {
    if (existing.role !== role || existing.name !== name) {
      await ctx.db.patch(existing._id, { role, name });
    }
    const existingAccount = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", email),
      )
      .unique();
    if (existingAccount === null) {
      await createAccount(ctx as never, {
        provider: "password",
        account: { id: email, secret: password },
        profile: { email, name, role },
      });
    } else {
      await modifyAccountCredentials(ctx as never, {
        provider: "password",
        account: { id: email, secret: password },
      });
    }
    return (await ctx.db.get(existing._id)) as Doc<"users">;
  }

  await createAccount(ctx as never, {
    provider: "password",
    account: { id: email, secret: password },
    profile: { email, name, role },
  });
  const created = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .unique();
  if (created === null) {
    throw new Error(`No se pudo crear la cuenta para ${email}.`);
  }
  return created;
}

/** npx convex run seedHrCleanup:ensureHrUser --prod */
export const ensureHrUser = internalMutation({
  args: {},
  handler: async (ctx) => {
    const user = await ensureUserWithPassword(
      ctx,
      HR_ADMIN_EMAIL,
      HR_ADMIN_NAME,
      "hr",
      HR_ADMIN_PASSWORD,
    );
    return {
      email: HR_ADMIN_EMAIL,
      password: HR_ADMIN_PASSWORD,
      name: HR_ADMIN_NAME,
      userId: user._id,
    };
  },
});

/** npx convex run seedHrCleanup:deleteUserByEmail --prod '{"email":"..."}' */
export const deleteUserByEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.email.trim().toLowerCase();
    if (HERCOM_STAFF_EMAILS.has(normalized)) {
      throw new Error("No se puede eliminar una cuenta de staff protegida.");
    }
    const users = await ctx.db.query("users").collect();
    const user =
      users.find(
        (row) => (row.email ?? "").trim().toLowerCase() === normalized,
      ) ?? null;
    if (user === null) {
      return { deleted: false as const, message: "Usuario no encontrado." };
    }

    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (driver !== null) {
      const wallet = await ctx.db
        .query("driverWallets")
        .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
        .unique();
      if (wallet !== null) {
        const txs = await ctx.db
          .query("walletTransactions")
          .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
          .collect();
        for (const tx of txs) {
          await ctx.db.delete(tx._id);
        }
        await ctx.db.delete(wallet._id);
      }
      await ctx.db.delete(driver._id);
    }

    const apps = await ctx.db
      .query("driverApplications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const application of apps) {
      for (const photoId of application.licensePhotoIds) {
        await deleteStorageIfPresent(ctx, photoId);
      }
      await deleteStorageIfPresent(ctx, application.licensePdfId);
      await deleteStorageIfPresent(ctx, application.culPdfId);
      await deleteStorageIfPresent(ctx, application.conductorRecordPdfId);
      await ctx.db.delete(application._id);
    }

    await deleteStorageIfPresent(ctx, user.selfieStorageId);
    await deleteAuthForUser(ctx, user._id, user.email, user.phone);
    await ctx.db.delete(user._id);
    return {
      deleted: true as const,
      email: normalized,
      role: user.role,
    };
  },
});
