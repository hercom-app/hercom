import type { DniLookupResult } from "./dniLookupTypes";
import { parsePeruBirthDateToIso } from "./parsePeruBirthDate";
import {
  formatPeruPersonFullName,
  normalizePersonNamePart,
} from "./personName";

type VerificaPeDniPayload = {
  success?: boolean;
  message?: string;
  data?: {
    numero_documento?: string;
    dni?: string;
    nombres?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    nombre_completo?: string;
    fecha_nacimiento?: string;
    fechaNacimiento?: string;
    sexo?: string;
    genero?: string;
  };
};

function mapVerificaPeDni(
  dni: string,
  data: NonNullable<VerificaPeDniPayload["data"]>,
): DniLookupResult {
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
  const birthDate = parsePeruBirthDateToIso(
    data.fecha_nacimiento ?? data.fechaNacimiento,
  );
  const sexRaw = (data.sexo ?? data.genero ?? "").trim();
  return {
    firstName,
    firstLastName,
    secondLastName,
    fullName,
    documentNumber: (data.numero_documento ?? data.dni ?? dni).trim(),
    ...(birthDate !== undefined ? { birthDate } : {}),
    ...(sexRaw !== "" ? { sex: sexRaw } : {}),
  };
}

/** Consulta DNI completa (incl. fecha de nacimiento cuando la fuente la expone). */
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
