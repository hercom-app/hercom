import type { LicenseLookupResult } from "./licenseLookupTypes";
import { normalizePersonNamePart } from "./personName";

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

export async function fetchLicenseFromVerificaPe(
  dni: string,
): Promise<LicenseLookupResult> {
  const apiKey = process.env.VERIFICAPE_API_KEY;
  if (apiKey === undefined || apiKey === "") {
    throw new Error(
      "VERIFICAPE_API_KEY no configurada en Convex. Ver docs/registro-chofer.md",
    );
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
    fullName: normalizePersonNamePart(payload.data.nombre_completo ?? ""),
    licenseNumber: license?.numero ?? "",
    category: license?.categoria ?? "",
    issuedAt: license?.fecha_expedicion ?? "",
    expiresAt: license?.fecha_vencimiento ?? "",
    status: license?.estado ?? "",
    restrictions: license?.restricciones ?? "",
  };
}
