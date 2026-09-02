import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type DbCtx = QueryCtx | MutationCtx;

const DNI_TAKEN_MESSAGE = "Este DNI ya está registrado.";

export function normalizeDni(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 8);
}

export function isValidDni(dni: string): boolean {
  return /^\d{8}$/.test(dni);
}

export function isClientIdentityComplete(
  user: Pick<
    Doc<"users">,
    "dni" | "firstName" | "firstLastName" | "secondLastName" | "selfieStorageId"
  >,
): boolean {
  const dni = user.dni?.trim() ?? "";
  return (
    isValidDni(dni) &&
    (user.firstName?.trim() ?? "") !== "" &&
    (user.firstLastName?.trim() ?? "") !== "" &&
    (user.secondLastName?.trim() ?? "") !== "" &&
    user.selfieStorageId !== undefined
  );
}

/**
 * Dueño del DNI si ya existe en users o en una solicitud de chofer activa.
 */
export async function findDniOwnerUserId(
  ctx: DbCtx,
  dni: string,
): Promise<Id<"users"> | null> {
  const userRow = await ctx.db
    .query("users")
    .withIndex("by_dni", (q) => q.eq("dni", dni))
    .first();
  if (userRow !== null) {
    return userRow._id;
  }

  const application = await ctx.db
    .query("driverApplications")
    .withIndex("by_dni", (q) => q.eq("dni", dni))
    .filter((q) =>
      q.or(
        q.eq(q.field("status"), "pending"),
        q.eq(q.field("status"), "approved"),
      ),
    )
    .first();
  if (application !== null) {
    return application.userId;
  }

  return null;
}

export async function assertDniAvailable(
  ctx: DbCtx,
  dni: string,
  currentUserId: Id<"users">,
): Promise<void> {
  const ownerId = await findDniOwnerUserId(ctx, dni);
  if (ownerId !== null && ownerId !== currentUserId) {
    throw new Error(DNI_TAKEN_MESSAGE);
  }
}

export function requireClientIdentity(user: Doc<"users">): void {
  if (!isClientIdentityComplete(user)) {
    throw new Error(
      "Valida tu DNI y toma una selfie antes de pedir un servicio.",
    );
  }
}
