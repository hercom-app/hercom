import {
  formatPeruPersonFullName,
  normalizePersonNamePart,
} from "./personName";

export type ReniecDniResult = {
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  fullName: string;
  documentNumber: string;
};

type ReniecDniResponse = {
  first_name: string;
  first_last_name: string;
  second_last_name: string;
  full_name: string;
  document_number: string;
};

/** API caída, sin suscripción o sin credenciales — habilita ingreso manual en app. */
export class ReniecServiceUnavailableError extends Error {
  constructor(
    message = "Servicio de RENIEC no disponible, ingrese sus datos manualmente.",
  ) {
    super(message);
    this.name = "ReniecServiceUnavailableError";
  }
}

function isReniecServiceUnavailableStatus(status: number): boolean {
  return (
    status === 401 ||
    status === 402 ||
    status === 403 ||
    status === 429 ||
    status >= 500
  );
}

function mapReniecResponse(data: ReniecDniResponse): ReniecDniResult {
  const firstName = normalizePersonNamePart(data.first_name ?? "");
  const firstLastName = normalizePersonNamePart(data.first_last_name ?? "");
  const secondLastName = normalizePersonNamePart(data.second_last_name ?? "");
  const fullName =
    normalizePersonNamePart(data.full_name ?? "") ||
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
    documentNumber: data.document_number?.trim() ?? "",
  };
}

export async function fetchReniecDniFromDecolecta(
  dni: string,
): Promise<ReniecDniResult> {
  const apiKey = process.env.DECOLECTA_API_KEY;
  if (apiKey === undefined || apiKey === "") {
    throw new ReniecServiceUnavailableError();
  }

  let response: Response;
  try {
    const url = `https://api.decolecta.com/v1/reniec/dni?numero=${dni}`;
    response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
  } catch {
    throw new ReniecServiceUnavailableError();
  }

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 404) {
      throw new Error("DNI no encontrado en RENIEC.");
    }
    if (isReniecServiceUnavailableStatus(response.status)) {
      throw new ReniecServiceUnavailableError();
    }
    if (
      /subscription|suscripci|credit|payment|unauthorized|forbidden|quota/i.test(
        body,
      )
    ) {
      throw new ReniecServiceUnavailableError();
    }
    throw new Error(`Error RENIEC (${response.status}): ${body}`);
  }

  const data = (await response.json()) as ReniecDniResponse;
  return mapReniecResponse(data);
}
