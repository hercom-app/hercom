const KNOWN_SERVER_MESSAGES = [
  "Este DNI ya está registrado",
  "Indica tus años de experiencia manejando",
  "DNI inválido",
  "Sube las 3 fotos del brevete físico",
  "Sube el brevete digital",
  "Sube la selfie sosteniendo el brevete",
  "Debes firmar digitalmente la autorización",
  "Selecciona tu departamento",
  "Debes ser mayor de 18 años",
] as const;

/** Extrae el mensaje útil de errores Convex (evita wrappers y «Called by client»). */
export function convexErrorMessage(
  error: unknown,
  fallback = "Ocurrió un error. Intenta de nuevo.",
): string {
  const raw = errorToRawString(error);
  console.error("[hercom] error completo:", raw, error);

  const fromStructured = readStructuredConvexError(error);
  if (fromStructured !== null && fromStructured.trim() !== "") {
    return sanitizeUserMessage(fromStructured);
  }

  const argLine = raw.match(/ArgumentValidationError[^\n]*/i)?.[0];
  if (argLine !== undefined) {
    const missing = argLine.match(
      /missing (?:the )?required field [`'"]([^`'"]+)[`'"]/i,
    );
    if (missing?.[1] !== undefined) {
      return fieldValidationMessage(missing[1]);
    }
    const extra = argLine.match(/unexpected field [`'"]([^`'"]+)[`'"]/i);
    if (extra?.[1] !== undefined) {
      return fieldValidationMessage(extra[1]);
    }
    return sanitizeUserMessage(argLine.replace(/^ArgumentValidationError:\s*/i, ""));
  }

  for (const known of KNOWN_SERVER_MESSAGES) {
    if (raw.includes(known)) {
      return known.endsWith(".") ? known : `${known}.`;
    }
  }

  const uncaught = raw.match(/Uncaught Error:\s*(.+?)(?:\n|$)/i);
  if (uncaught?.[1] !== undefined && uncaught[1].trim() !== "") {
    return sanitizeUserMessage(uncaught[1].trim());
  }

  const convexMutation = raw.match(
    /\[CONVEX M\([^)]+\)\][^\n]*\n?\s*Uncaught Error:\s*(.+?)(?:\n|$)/i,
  );
  if (convexMutation?.[1] !== undefined) {
    return sanitizeUserMessage(convexMutation[1].trim());
  }

  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  const inner = lines.find(
    (line) =>
      !line.startsWith("[CONVEX") &&
      line !== "Server Error" &&
      !line.startsWith("Called by client") &&
      !/^Uncaught Error:/i.test(line) &&
      !line.startsWith("at ") &&
      !line.includes("Request ID:") &&
      !line.startsWith("ConvexError:"),
  );

  if (inner !== undefined && inner !== "") {
    return sanitizeUserMessage(inner.replace(/^Error:\s*/i, ""));
  }

  const serverTail = raw.match(/Server Error[\s\S]*$/i)?.[0];
  if (serverTail !== undefined) {
    const tailLine = serverTail
      .split("\n")
      .map((l) => l.trim())
      .find(
        (line) =>
          line !== "" &&
          !line.startsWith("Server Error") &&
          !line.startsWith("Called by client") &&
          !line.startsWith("at ") &&
          !line.includes("Request ID:"),
      );
    if (tailLine !== undefined) {
      return sanitizeUserMessage(tailLine);
    }
  }

  const trimmed = raw.trim();
  if (
    trimmed !== "" &&
    !trimmed.startsWith("[CONVEX") &&
    trimmed.length <= 400
  ) {
    return sanitizeUserMessage(trimmed);
  }

  if (trimmed.includes("drivingExperienceYears")) {
    return fieldValidationMessage("drivingExperienceYears");
  }

  if (/driverApplications:submit/i.test(trimmed) && /Server Error/i.test(trimmed)) {
    return "El servidor rechazó la solicitud. Si el DNI ya lo usaste en otra cuenta, usa otro DNI o contacta a soporte.";
  }

  return fallback;
}

function errorToRawString(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function readStructuredConvexError(error: unknown): string | null {
  if (error === null || typeof error !== "object") {
    return null;
  }
  const record = error as Record<string, unknown>;
  if (typeof record.message === "string" && record.message.trim() !== "") {
    return record.message;
  }
  const data = record.data;
  if (typeof data === "string" && data.trim() !== "") {
    return data;
  }
  if (data !== null && typeof data === "object") {
    const dataRecord = data as Record<string, unknown>;
    if (typeof dataRecord.message === "string") {
      return dataRecord.message;
    }
  }
  return null;
}

function fieldValidationMessage(field: string): string {
  if (field === "drivingExperienceYears") {
    return "Falta «años de experiencia manejando». Actualiza la app (EAS Update) e ingresa un número de 0 a 60.";
  }
  return `Revisa el campo «${field}» e intenta de nuevo.`;
}

function sanitizeUserMessage(message: string): string {
  return message
    .replace(/^Uncaught Error:\s*/i, "")
    .replace(/^Error:\s*/i, "")
    .replace(/\s*Called by client\.?\s*$/i, "")
    .trim();
}

export function isInsufficientBalanceError(message: string): boolean {
  return /saldo insuficiente/i.test(message);
}
