import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/** Tope que se escribe en el usuario cuando todavía no tiene la columna. */
export const DEFAULT_FIRST_TRIPS_DISCOUNT_LIMIT = 3;

/** 15% de los primeros viajes. No se suma a la campaña de fechas. */
export const DEFAULT_FIRST_TRIPS_DISCOUNT_RATE = 0.15;

export function occupiesFirstTripsSlot(
  status: Doc<"services">["status"],
): boolean {
  return status !== "cancelled" && status !== "unattended";
}

async function countOccupiedSlots(
  ctx: QueryCtx | MutationCtx,
  clientId: Id<"users">,
): Promise<number> {
  const services = await ctx.db
    .query("services")
    .withIndex("by_client", (q) => q.eq("clientId", clientId))
    .collect();
  return services.filter((service) => occupiesFirstTripsSlot(service.status))
    .length;
}

export type FirstTripsDiscountState = {
  limit: number;
  used: number;
  /** Porcentaje exclusivo de los primeros viajes. No se suma a una campaña. */
  rate: number;
};

/**
 * Lee el cupo guardado en `users`.
 * Si el usuario es anterior a estas columnas, las rellena una sola vez.
 */
export async function loadFirstTripsDiscountForWrite(
  ctx: MutationCtx,
  clientId: Id<"users">,
): Promise<FirstTripsDiscountState> {
  const user = await ctx.db.get(clientId);
  if (user === null) {
    throw new Error("Cliente no encontrado.");
  }
  const limit = user.firstTripsDiscountLimit ?? DEFAULT_FIRST_TRIPS_DISCOUNT_LIMIT;
  const rate = user.firstTripsDiscountRate ?? DEFAULT_FIRST_TRIPS_DISCOUNT_RATE;
  const used =
    user.firstTripsDiscountUsed ?? (await countOccupiedSlots(ctx, clientId));
  if (
    user.firstTripsDiscountLimit === undefined ||
    user.firstTripsDiscountUsed === undefined ||
    user.firstTripsDiscountRate === undefined
  ) {
    await ctx.db.patch(clientId, {
      firstTripsDiscountLimit: limit,
      firstTripsDiscountUsed: used,
      firstTripsDiscountRate: rate,
    });
  }
  return { limit, used, rate };
}

/** Lectura para vistas. No escribe. Si faltan las columnas, cuenta una vez. */
export async function readFirstTripsDiscount(
  ctx: QueryCtx | MutationCtx,
  clientId: Id<"users">,
): Promise<FirstTripsDiscountState> {
  const user = await ctx.db.get(clientId);
  if (user === null) {
    throw new Error("Cliente no encontrado.");
  }
  const limit = user.firstTripsDiscountLimit ?? DEFAULT_FIRST_TRIPS_DISCOUNT_LIMIT;
  const rate = user.firstTripsDiscountRate ?? DEFAULT_FIRST_TRIPS_DISCOUNT_RATE;
  if (user.firstTripsDiscountUsed !== undefined) {
    return { limit, used: user.firstTripsDiscountUsed, rate };
  }
  return { limit, used: await countOccupiedSlots(ctx, clientId), rate };
}

export function hasFirstTripsDiscountRoom(state: FirstTripsDiscountState): boolean {
  return state.used < state.limit;
}

/** El viaje nuevo ocupa un cupo. Llamar después de insertarlo. */
export async function consumeFirstTripsSlot(
  ctx: MutationCtx,
  clientId: Id<"users">,
  already: FirstTripsDiscountState,
): Promise<void> {
  await ctx.db.patch(clientId, {
    firstTripsDiscountLimit: already.limit,
    firstTripsDiscountUsed: already.used + 1,
  });
}

/**
 * Devuelve el cupo. El servicio ya no debe ocupar slot
 * (cancelado o no atendido) antes de llamar.
 * Si la columna no existía, la deja igual al conteo actual, sin restar dos veces.
 */
export async function releaseFirstTripsSlot(
  ctx: MutationCtx,
  clientId: Id<"users">,
): Promise<void> {
  const user = await ctx.db.get(clientId);
  if (user === null) {
    return;
  }
  const limit = user.firstTripsDiscountLimit ?? DEFAULT_FIRST_TRIPS_DISCOUNT_LIMIT;
  if (user.firstTripsDiscountUsed === undefined) {
    await ctx.db.patch(clientId, {
      firstTripsDiscountLimit: limit,
      firstTripsDiscountUsed: await countOccupiedSlots(ctx, clientId),
    });
    return;
  }
  await ctx.db.patch(clientId, {
    firstTripsDiscountLimit: limit,
    firstTripsDiscountUsed: Math.max(0, user.firstTripsDiscountUsed - 1),
  });
}
