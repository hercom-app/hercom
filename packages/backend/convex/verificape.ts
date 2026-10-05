import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

type VerificaPeLicensePayload = {
  success?: boolean;
  message?: string;
  data?: {
    numero_documento?: string;
    nombre_completo?: string;
    licencia?: {
      numero?: string;
      categoria?: string;
      fecha_expedicion?: string;
      fecha_vencimiento?: string;
      estado?: string;
      restricciones?: string;
    } | null;
  };
};

/**
 * Consulta licencia de conducir vía VerificaPE. Solo staff del panel interno.
 * La API key vive en Convex (`VERIFICAPE_API_KEY`), nunca en el cliente.
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

    const apiKey = process.env.VERIFICAPE_API_KEY;
    if (apiKey === undefined || apiKey === "") {
      throw new Error(
        "VERIFICAPE_API_KEY no configurada en Convex. Ver docs/registro-chofer.md",
      );
    }

    const dni = args.dni.trim();
    if (!/^\d{8}$/.test(dni)) {
      throw new Error("El DNI debe tener exactamente 8 dígitos.");
    }

    const response = await fetch(
      `https://api.verificape.com/v2/licencia/${dni}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const raw = await response.text();
    let payload: VerificaPeLicensePayload;
    try {
      payload = JSON.parse(raw) as VerificaPeLicensePayload;
    } catch {
      throw new Error(
        response.ok
          ? "Respuesta inválida de VerificaPE."
          : `Error VerificaPE (${response.status}): ${raw}`,
      );
    }

    if (!response.ok || payload.success !== true || payload.data === undefined) {
      throw new Error(
        payload.message !== undefined && payload.message.trim() !== ""
          ? payload.message
          : response.status === 404
            ? "Licencia no encontrada."
            : `Error VerificaPE (${response.status}).`,
      );
    }

    const license = payload.data.licencia;
    return {
      documentNumber: payload.data.numero_documento ?? dni,
      fullName: payload.data.nombre_completo ?? "",
      licenseNumber: license?.numero ?? "",
      category: license?.categoria ?? "",
      issuedAt: license?.fecha_expedicion ?? "",
      expiresAt: license?.fecha_vencimiento ?? "",
      status: license?.estado ?? "",
      restrictions: license?.restricciones ?? "",
    };
  },
});
