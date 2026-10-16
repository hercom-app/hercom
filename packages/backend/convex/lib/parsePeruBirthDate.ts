/** Normaliza fechas comunes de APIs peruanas a ISO YYYY-MM-DD. */
export function parsePeruBirthDateToIso(raw: string | undefined): string | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const trimmed = raw.trim();
  if (trimmed === "") {
    return undefined;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (slash !== null) {
    const [, dd, mm, yyyy] = slash;
    return `${yyyy}-${mm!.padStart(2, "0")}-${dd!.padStart(2, "0")}`;
  }
  const dash = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(trimmed);
  if (dash !== null) {
    const [, dd, mm, yyyy] = dash;
    return `${yyyy}-${mm!.padStart(2, "0")}-${dd!.padStart(2, "0")}`;
  }
  const parsed = new Date(`${trimmed}T12:00:00`);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return undefined;
}
