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

export async function fetchReniecDniFromDecolecta(dni: string): Promise<ReniecDniResult> {
  const apiKey = process.env.DECOLECTA_API_KEY;
  if (apiKey === undefined || apiKey === "") {
    throw new Error(
      "DECOLECTA_API_KEY no configurada en Convex. Ver docs/registro-chofer.md",
    );
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
}
