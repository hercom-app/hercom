import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { fetchReniecDniFromDecolecta } from "./lib/fetchReniecDni";
import {
  RENIEC_DRIVER_MAX_LOOKUPS,
  assertReniecDriverLookupAllowed,
  normalizeReniecDriverQuota,
} from "./lib/reniecDriverQuota";

/**
 * Consulta RENIEC vía Decolecta. Solo staff del panel interno.
 * La API key vive en Convex (`DECOLECTA_API_KEY`), nunca en el cliente.
 */
export const lookupDni = action({
  args: {
    dni: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("No autenticado: se requiere iniciar sesión.");
    }
    await ctx.runQuery(internal.users.assertStaffCaller, {});

    const dni = args.dni.trim();
    if (!/^\d{8}$/.test(dni)) {
      throw new Error("El DNI debe tener exactamente 8 dígitos.");
    }

    return await fetchReniecDniFromDecolecta(dni);
  },
});

/** Estado de cuota RENIEC para inscripción chofer (app móvil). */
export const getDriverLookupQuota = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (user === null) {
      return null;
    }
    const { count, blockedUntil } = normalizeReniecDriverQuota(user);
    const now = Date.now();
    const blocked =
      blockedUntil !== undefined && now < blockedUntil ? blockedUntil : null;
    return {
      lookupsUsed: count,
      lookupsRemaining: Math.max(0, RENIEC_DRIVER_MAX_LOOKUPS - count),
      blockedUntil: blocked,
      canLookup: blocked === null && count < RENIEC_DRIVER_MAX_LOOKUPS,
    };
  },
});

/**
 * RENIEC para chofer en app móvil. Máx. 2 consultas; luego bloqueo 8 h.
 */
export const lookupDniForDriverApp = action({
  args: {
    dni: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("No autenticado: se requiere iniciar sesión.");
    }

    const dni = args.dni.trim();
    if (!/^\d{8}$/.test(dni)) {
      throw new Error("El DNI debe tener exactamente 8 dígitos.");
    }

    const quotaBefore = await ctx.runQuery(
      internal.users.getReniecDriverQuotaForUser,
      { userId },
    );
    assertReniecDriverLookupAllowed(
      quotaBefore.count,
      quotaBefore.blockedUntil,
    );

    const result = await fetchReniecDniFromDecolecta(dni);

    const quotaAfter: {
      lookupsUsed: number;
      lookupsRemaining: number;
      blockedUntil: number | null;
    } = await ctx.runMutation(internal.users.recordReniecDriverLookup, {
      userId,
    });

    const securityNotice =
      quotaAfter.lookupsRemaining === 0
        ? "Has usado tus 2 consultas RENIEC. No podrás validar otro DNI por 8 horas."
        : `Consulta RENIEC registrada. Te queda ${quotaAfter.lookupsRemaining} consulta antes del bloqueo de 8 horas.`;

    return {
      ...result,
      lookupsUsed: quotaAfter.lookupsUsed,
      lookupsRemaining: quotaAfter.lookupsRemaining,
      blockedUntil: quotaAfter.blockedUntil,
      securityNotice,
    };
  },
});
