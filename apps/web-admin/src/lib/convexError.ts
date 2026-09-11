/**
 * Convex envuelve el error del servidor. Extrae el mensaje útil
 * y lo manda a la consola del navegador.
 */
export function formatConvexError(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : String(error);
  console.error("[hercom-admin]", raw, error);

  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  const inner = lines.find(
    (line) =>
      !line.startsWith("[CONVEX") &&
      line !== "Server Error" &&
      !line.startsWith("Called by client") &&
      !/^Uncaught Error:/i.test(line),
  );

  if (inner !== undefined && inner !== "") {
    return inner.replace(/^Error:\s*/i, "");
  }

  const wrapped = raw.match(/Server Error(?: Called by client)?[:\s]+([\s\S]+)$/i);
  if (wrapped?.[1] !== undefined && wrapped[1].trim() !== "") {
    return wrapped[1].trim();
  }

  return fallback;
}

export function errorDetail(error: unknown): string {
  if (error instanceof Error) {
    return [error.message, error.stack].filter(Boolean).join("\n");
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
