/** Extrae el mensaje útil de errores Convex (evita el wrapper `[CONVEX M(...)]`). */
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

  const uncaught = raw.match(/Uncaught Error:\s*(.+?)(?:\n|$)/i);
  if (uncaught?.[1] !== undefined && uncaught[1].trim() !== "") {
    return uncaught[1].trim();
  }

  const server = raw.match(/Server Error\s+(.+)/is);
  if (server?.[1] !== undefined) {
    const line = server[1]
      .replace(/^Uncaught Error:\s*/i, "")
      .split("\n")[0]
      ?.trim();
    if (line !== undefined && line !== "") {
      return line;
    }
  }

  if (raw.startsWith("[CONVEX") && raw.length > 160) {
    return fallback;
  }

  return raw.trim() !== "" ? raw.trim() : fallback;
}

export function isInsufficientBalanceError(message: string): boolean {
  return /saldo insuficiente/i.test(message);
}
