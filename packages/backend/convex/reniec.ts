import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { fetchDniFromFactiliza } from "./lib/fetchFactilizaDni";
import { IdentityServiceUnavailableError } from "./lib/identityServiceErrors";
import {
  RENIEC_DRIVER_MAX_LOOKUPS,
  assertReniecDriverLookupAllowed,
  normalizeReniecDriverQuota,
} from "./lib/reniecDriverQuota";

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
 * Validación DNI chofer (app móvil) vía Factiliza.
 * Máx. 2 consultas; luego bloqueo 8 h.
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

    try {
      const result = await fetchDniFromFactiliza(dni);

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
        outcome: "success" as const,
        ...result,
        lookupsUsed: quotaAfter.lookupsUsed,
        lookupsRemaining: quotaAfter.lookupsRemaining,
        blockedUntil: quotaAfter.blockedUntil,
        securityNotice,
      };
    } catch (error) {
      if (error instanceof IdentityServiceUnavailableError) {
        return {
          outcome: "service_unavailable" as const,
          message: error.message,
        };
      }
      throw error;
    }
  },
});
