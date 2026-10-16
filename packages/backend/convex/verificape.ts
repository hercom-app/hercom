import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { fetchDniFromVerificaPe } from "./lib/fetchVerificaPeDni";
import { fetchLicenseFromVerificaPe } from "./lib/fetchVerificaPeLicense";

/**
 * Consulta DNI vía VerificaPE (panel interno). Prioriza fecha de nacimiento.
 * La API key vive en Convex (`VERIFICAPE_API_KEY`), nunca en el cliente.
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

    return await fetchDniFromVerificaPe(dni);
  },
});

/**
 * Consulta licencia vía VerificaPE. Respaldo cuando Factiliza agota cupo.
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

    const result = await fetchLicenseFromVerificaPe(dni);
    return { ...result, source: "verificape" as const };
  },
});
