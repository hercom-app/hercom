import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { fetchLicenseFromFactiliza } from "./lib/fetchFactilizaLicense";
import { fetchLicenseFromVerificaPe } from "./lib/fetchVerificaPeLicense";
import { FactilizaQuotaExceededError } from "./lib/identityServiceErrors";

/**
 * Brevete en panel interno: Factiliza primero; VerificaPE si se agotan consultas.
 */
export const lookupLicense = action({
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

    try {
      const result = await fetchLicenseFromFactiliza(dni);
      return { ...result, source: "factiliza" as const };
    } catch (error) {
      if (error instanceof FactilizaQuotaExceededError) {
        const fallback = await fetchLicenseFromVerificaPe(dni);
        return {
          ...fallback,
          source: "verificape" as const,
          fallbackReason: error.message,
        };
      }
      throw error;
    }
  },
});
