import type { LicenseLookupResult } from "./licenseLookupTypes";
import { isFactilizaSuccess } from "./factilizaResponse";
import {
  FactilizaQuotaExceededError,
  isFactilizaQuotaMessage,
  isIdentityServiceUnavailableStatus,
} from "./identityServiceErrors";
import { normalizePersonNamePart } from "./personName";

type FactilizaLicenseRow = {
  numero?: string;
  categoria?: string;
  fecha_expedicion?: string;
  fecha_vencimiento?: string;
  estado?: string;
  restricciones?: string;
};

type FactilizaLicensePayload = {
  status?: number;
  success?: boolean;
  message?: string;
  data?: {
    numero_documento?: string;
    nombre_completo?: string;
    nombres?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    licencia?: FactilizaLicenseRow | FactilizaLicenseRow[] | null;
  };
};

function pickPrimaryLicense(
  licencia: FactilizaLicenseRow | FactilizaLicenseRow[] | null | undefined,
): FactilizaLicenseRow | null {
  if (licencia === null || licencia === undefined) {
    return null;
  }
  if (Array.isArray(licencia)) {
    return licencia[0] ?? null;
  }
  return licencia;
}

function resolveFullName(data: NonNullable<FactilizaLicensePayload["data"]>): string {
  const fromField = normalizePersonNamePart(data.nombre_completo ?? "");
  if (fromField !== "") {
    return fromField;
  }
  const parts = [
    data.nombres,
    data.apellido_paterno,
    data.apellido_materno,
  ]
    .map((part) => normalizePersonNamePart(part ?? ""))
    .filter((part) => part !== "");
  return parts.join(" ");
}

export async function fetchLicenseFromFactiliza(
  dni: string,
): Promise<LicenseLookupResult> {
  const apiKey = process.env.FACTILIZA_API_TOKEN;
  if (apiKey === undefined || apiKey === "") {
    throw new Error(
      "FACTILIZA_API_TOKEN no configurada en Convex. Ver docs/registro-chofer.md",
    );
  }

  const response = await fetch(
    `https://api.factiliza.com/v1/licencia/info/${dni}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  const raw = await response.text();
  let payload: FactilizaLicensePayload;
  try {
    payload = JSON.parse(raw) as FactilizaLicensePayload;
  } catch {
    throw new Error(
      response.ok
        ? "Respuesta inválida de Factiliza."
        : `Error Factiliza licencia (${response.status}): ${raw}`,
    );
  }

  if (
    response.status === 429 ||
    isFactilizaQuotaMessage(raw) ||
    isFactilizaQuotaMessage(payload.message ?? "")
  ) {
    throw new FactilizaQuotaExceededError(payload.message);
  }

  if (!isFactilizaSuccess(response.status, payload)) {
    if (isIdentityServiceUnavailableStatus(response.status)) {
      throw new Error(
        payload.message?.trim() !== ""
          ? payload.message!
          : `Error Factiliza licencia (${response.status}).`,
      );
    }
    throw new Error(
      payload.message?.trim() !== ""
        ? payload.message!
        : response.status === 404 || payload.status === 404
          ? "Licencia no encontrada."
          : `Error Factiliza licencia (${response.status}).`,
    );
  }

  if (payload.data === undefined) {
    throw new Error("Licencia no encontrada.");
  }

  const license = pickPrimaryLicense(payload.data.licencia);
  if (license === null) {
    throw new Error("Licencia no encontrada.");
  }

  return {
    documentNumber: payload.data.numero_documento ?? dni,
    fullName: resolveFullName(payload.data),
    licenseNumber: license.numero ?? "",
    category: license.categoria ?? "",
    issuedAt: license.fecha_expedicion ?? "",
    expiresAt: license.fecha_vencimiento ?? "",
    status: license.estado ?? "",
    restrictions: license.restricciones ?? "",
  };
}
