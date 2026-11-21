/** Extrae el mensaje útil del error que devuelve Convex en acciones. */
export function formatConvexError(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : String(error);

  const uncaught = raw.match(/Uncaught Error:\s*([^\n]+)/i);
  if (uncaught?.[1] !== undefined && uncaught[1].trim() !== "") {
    return uncaught[1].trim();
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
      !line.startsWith("ArgumentValidationError"),
  );

  if (inner !== undefined && inner !== "") {
    return inner.replace(/^Error:\s*/i, "");
  }

  if (raw.includes("Server Error") && !raw.includes("Called by client")) {
    return fallback;
  }

  return raw !== "" ? raw : fallback;
}