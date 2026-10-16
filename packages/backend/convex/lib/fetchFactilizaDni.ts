import type { DniLookupResult } from "./dniLookupTypes";
import {
  IdentityServiceUnavailableError,
  isFactilizaQuotaMessage,
  isIdentityServiceUnavailableStatus,
} from "./identityServiceErrors";
import {
  formatPeruPersonFullName,
  normalizePersonNamePart,
} from "./personName";

type FactilizaDniPayload = {
  success?: boolean;
  message?: string;
  data?: {
    numero?: string;
    nombres?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    nombre_completo?: string;
  };
};

function mapFactilizaDni(data: NonNullable<FactilizaDniPayload["data"]>): DniLookupResult {
  const firstName = normalizePersonNamePart(data.nombres ?? "");
  const firstLastName = normalizePersonNamePart(data.apellido_paterno ?? "");
  const secondLastName = normalizePersonNamePart(data.apellido_materno ?? "");
  const fullName =
    normalizePersonNamePart(data.nombre_completo ?? "") ||
    formatPeruPersonFullName({
      firstLastName,
      secondLastName,
      firstName,
    });
  return {
    firstName,
    firstLastName,
    secondLastName,
    fullName,
    documentNumber: (data.numero ?? "").trim(),
  };
}

export async function fetchDniFromFactiliza(dni: string): Promise<DniLookupResult> {
  const apiKey = process.env.FACTILIZA_API_TOKEN;
  if (apiKey === undefined || apiKey === "") {
    throw new IdentityServiceUnavailableError();
  }

  let response: Response;
  try {
    response = await fetch(`https://api.factiliza.com/v1/dni/info/${dni}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
  } catch {
    throw new IdentityServiceUnavailableError();
  }

  const raw = await response.text();
  let payload: FactilizaDniPayload;
  try {
    payload = JSON.parse(raw) as FactilizaDniPayload;
  } catch {
    if (isIdentityServiceUnavailableStatus(response.status)) {
      throw new IdentityServiceUnavailableError();
    }
    throw new Error(`Error Factiliza DNI (${response.status}).`);
  }

  if (!response.ok || payload.success !== true || payload.data === undefined) {
    if (response.status === 404) {
      throw new Error("DNI no encontrado.");
    }
    if (
      response.status === 429 ||
      isFactilizaQuotaMessage(raw) ||
      isFactilizaQuotaMessage(payload.message ?? "")
    ) {
      throw new IdentityServiceUnavailableError(
        "Consultas Factiliza no disponibles. Ingrese sus datos manualmente.",
      );
    }
    if (isIdentityServiceUnavailableStatus(response.status)) {
      throw new IdentityServiceUnavailableError();
    }
    throw new Error(
      payload.message?.trim() !== ""
        ? payload.message!
        : `Error Factiliza DNI (${response.status}).`,
    );
  }

  return mapFactilizaDni(payload.data);
}
