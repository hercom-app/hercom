import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

type ReniecDniResponse = {
  first_name: string;
  first_last_name: string;
  second_last_name: string;
  full_name: string;
  document_number: string;
};

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

    const apiKey = process.env.DECOLECTA_API_KEY;
    if (apiKey === undefined || apiKey === "") {
      throw new Error(
        "DECOLECTA_API_KEY no configurada en Convex. Ver docs/registro-chofer.md",
      );
    }

    const dni = args.dni.trim();
    if (!/^\d{8}$/.test(dni)) {
      throw new Error("El DNI debe tener exactamente 8 dígitos.");
    }

    const url = `https://api.decolecta.com/v1/reniec/dni?numero=${dni}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        response.status === 404
          ? "DNI no encontrado en RENIEC."
          : `Error RENIEC (${response.status}): ${body}`,
      );
    }

    const data = (await response.json()) as ReniecDniResponse;
    return {
      firstName: data.first_name,
      firstLastName: data.first_last_name,
      secondLastName: data.second_last_name,
      fullName: data.full_name,
      documentNumber: data.document_number,
    };
  },
});
