import type { LicenseLookupResult } from "./licenseLookupTypes";
import { pickApiString } from "./pickApiString";
import { normalizePersonNamePart } from "./personName";

type VerificaPeLicensePayload = {
  success?: boolean;
  message?: string;
  code?: string;
  data?: Record<string, unknown>;
};

function mapLicenseRow(
  row: Record<string, unknown>,
): Omit<LicenseLookupResult, "documentNumber" | "fullName"> {
  return {
    licenseNumber: pickApiString(row, ["numero", "number", "licenseNumber"]),
    category: pickApiString(row, ["categoria", "category", "class"]),
    issuedAt: pickApiString(row, [
      "fecha_expedicion",
      "fechaExpedicion",
      "issuedAt",
      "issueDate",
    ]),
    expiresAt: pickApiString(row, [
      "fecha_vencimiento",
      "fechaVencimiento",
      "expiresAt",
      "expirationDate",
    ]),
    status: pickApiString(row, ["estado", "status", "state"]),
    restrictions: pickApiString(row, [
      "restricciones",
      "restrictions",
      "restriction",
    ]),
  };
}

function extractLicenseBlock(
  data: Record<string, unknown>,
): Record<string, unknown> | null {
  const licencia = data.licencia ?? data.license ?? data.licenses;
  if (licencia === null || licencia === undefined) {
    return null;
  }
  if (Array.isArray(licencia)) {
    const first = licencia[0];
    return first !== undefined && typeof first === "object" && first !== null
      ? (first as Record<string, unknown>)
      : null;
  }
  if (typeof licencia === "object") {
    return licencia as Record<string, unknown>;
  }
  return null;
}

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

  const license = extractLicenseBlock(payload.data);
  if (license === null) {
    throw new Error("Licencia no encontrada en la respuesta de VerificaPE.");
  }

  const fullName =
    normalizePersonNamePart(
      pickApiString(payload.data, ["nombre_completo", "fullName", "full_name"]),
    ) ||
    [
      pickApiString(payload.data, ["nombres", "names"]),
      pickApiString(payload.data, ["apellido_paterno", "paternalSurname"]),
      pickApiString(payload.data, ["apellido_materno", "maternalSurname"]),
    ]
      .filter((part) => part !== "")
      .map((part) => normalizePersonNamePart(part))
      .join(" ");

  return {
    documentNumber:
      pickApiString(payload.data, ["numero_documento", "dni", "numero"]) ||
      dni,
    fullName,
    ...mapLicenseRow(license),
  };
}
