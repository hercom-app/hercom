/** Extrae el mensaje útil de errores Convex (evita wrappers y «Called by client»). */
export function convexErrorMessage(
  error: unknown,
  fallback = "Ocurrió un error. Intenta de nuevo.",
): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : fallback;

  console.error("[hercom]", raw, error);

  const uncaught = raw.match(/Uncaught Error:\s*(.+?)(?:\n|$)/i);
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
      !/^Uncaught Error:/i.test(line) &&
      !line.startsWith("at ") &&
      !line.includes("Request ID:"),
  );

  if (inner !== undefined && inner !== "") {
    return inner.replace(/^Error:\s*/i, "");
  }

  const wrapped = raw.match(
    /Server Error(?: Called by client)?[:\s]+([\s\S]+)$/i,
  );
  if (wrapped?.[1] !== undefined) {
    const fromWrapped = wrapped[1]
      .split("\n")
      .map((line) => line.trim())
      .find(
        (line) =>
          line !== "" &&
          !line.startsWith("Called by client") &&
          !line.startsWith("at "),
      );
    if (fromWrapped !== undefined && fromWrapped !== "") {
      return fromWrapped.replace(/^Uncaught Error:\s*/i, "").replace(/^Error:\s*/i, "");
    }
  }

  if (
    raw.includes("Called by client") ||
    raw.startsWith("[CONVEX") ||
    raw.length > 160
  ) {
    return fallback;
  }

  return raw.trim() !== "" ? raw.trim() : fallback;
}

export function isInsufficientBalanceError(message: string): boolean {
  return /saldo insuficiente/i.test(message);
}
