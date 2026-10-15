/** Partículas en apellidos que van en minúscula (excepto al inicio). */
const NAME_PARTICLES = new Set([
  "de",
  "del",
  "la",
  "las",
  "los",
  "y",
  "e",
  "da",
  "di",
  "van",
  "von",
]);

/**
 * Formato estándar Hercom: Title Case por palabra (RENIEC suele devolver MAYÚSCULAS).
 * Misma regla en app chofer, cliente y web admin.
 */
export function normalizePersonNamePart(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (trimmed === "") {
    return "";
  }
  return trimmed
    .toLocaleLowerCase("es-PE")
    .split(" ")
    .map((word, index) => {
      if (word === "") {
        return word;
      }
      if (index > 0 && NAME_PARTICLES.has(word)) {
        return word;
      }
      const first = word.charAt(0).toLocaleUpperCase("es-PE");
      return first + word.slice(1);
    })
    .join(" ");
}

export function formatPeruPersonFullName(parts: {
  firstLastName: string;
  secondLastName: string;
  firstName: string;
}): string {
  return [
    normalizePersonNamePart(parts.firstLastName),
    normalizePersonNamePart(parts.secondLastName),
    normalizePersonNamePart(parts.firstName),
  ]
    .filter((part) => part !== "")
    .join(" ");
}

/** Alias para UI (mismo criterio que al guardar). */
export function formatPersonNameForDisplay(raw: string | undefined | null): string {
  if (raw === undefined || raw === null) {
    return "";
  }
  return normalizePersonNamePart(raw);
}
