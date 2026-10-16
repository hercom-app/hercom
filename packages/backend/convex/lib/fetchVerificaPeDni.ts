import type { DniLookupResult } from "./dniLookupTypes";
import { parsePeruBirthDateToIso } from "./parsePeruBirthDate";
import { pickApiString } from "./pickApiString";
import {
  formatPeruPersonFullName,
  normalizePersonNamePart,
} from "./personName";

type VerificaPeDniPayload = {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
};

function mapVerificaPeDni(
  dni: string,
  data: Record<string, unknown>,
): DniLookupResult {
  const firstName = normalizePersonNamePart(
    pickApiString(data, ["nombres", "names", "given_names", "givenNames"]),
  );
  const firstLastName = normalizePersonNamePart(
    pickApiString(data, [
      "apellido_paterno",
      "paternalSurname",
      "paternal_surname",
    ]),
  );
  const secondLastName = normalizePersonNamePart(
    pickApiString(data, [
      "apellido_materno",
      "maternalSurname",
      "maternal_surname",
    ]),
  );
  const fullName =
    normalizePersonNamePart(
      pickApiString(data, ["nombre_completo", "fullName", "full_name"]),
    ) ||
    formatPeruPersonFullName({
      firstLastName,
      secondLastName,
      firstName,
    });
  const birthDate = parsePeruBirthDateToIso(
    pickApiString(data, [
      "fecha_nacimiento",
      "fechaNacimiento",
      "birthDate",
      "birth_date",
    ]) || undefined,
  );
  const sexRaw = pickApiString(data, [
    "sexo",
    "genero",
    "gender",
    "sex",
  ]);
  const address = pickApiString(data, [
    "direccion",
    "direccion_completa",
    "address",
    "direccionCompleta",
  ]);
  const department = pickApiString(data, ["departamento", "department"]);
  const province = pickApiString(data, ["provincia", "province"]);
  const district = pickApiString(data, ["distrito", "district"]);
  const ubigeo = pickApiString(data, [
    "ubigeo",
    "ubigeo_reniec",
    "ubigeoReniec",
  ]);
  const civilStatus = pickApiString(data, [
    "estado_civil",
    "estadoCivil",
    "civilStatus",
  ]);
  const verificationDigit = pickApiString(data, [
    "codigo_verificacion",
    "caracter_verificacion",
    "verification_digit",
    "verificationDigit",
  ]);
  const dataSource = pickApiString(data, ["source", "fuente", "dataSource"]);
  const documentNumber =
    pickApiString(data, ["numero_documento", "dni", "numero", "documentNumber"]) ||
    dni;

  return {
    firstName,
    firstLastName,
    secondLastName,
    fullName,
    documentNumber,
    ...(birthDate !== undefined ? { birthDate } : {}),
    ...(sexRaw !== "" ? { sex: sexRaw } : {}),
    ...(address !== "" ? { address } : {}),
    ...(department !== "" ? { department } : {}),
    ...(province !== "" ? { province } : {}),
    ...(district !== "" ? { district } : {}),
    ...(ubigeo !== "" ? { ubigeo } : {}),
    ...(civilStatus !== "" ? { civilStatus } : {}),
    ...(verificationDigit !== "" ? { verificationDigit } : {}),
    ...(dataSource !== "" ? { dataSource } : {}),
  };
}

/** Consulta DNI completa (VerificaPE v2 — camelCase y snake_case). */
export async function fetchDniFromVerificaPe(dni: string): Promise<DniLookupResult> {
  const apiKey = process.env.VERIFICAPE_API_KEY;
  if (apiKey === undefined || apiKey === "") {
    throw new Error(
      "VERIFICAPE_API_KEY no configurada en Convex. Ver docs/registro-chofer.md",
    );
  }

  const response = await fetch(`https://api.verificape.com/v2/dni/${dni}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  const raw = await response.text();
  let payload: VerificaPeDniPayload;
  try {
    payload = JSON.parse(raw) as VerificaPeDniPayload;
  } catch {
    throw new Error(
      response.ok
        ? "Respuesta inválida de VerificaPE."
        : `Error VerificaPE DNI (${response.status}): ${raw}`,
    );
  }

  if (!response.ok || payload.success !== true || payload.data === undefined) {
    throw new Error(
      payload.message !== undefined && payload.message.trim() !== ""
        ? payload.message
        : response.status === 404
          ? "DNI no encontrado."
          : `Error VerificaPE DNI (${response.status}).`,
    );
  }

  return mapVerificaPeDni(dni, payload.data);
}
