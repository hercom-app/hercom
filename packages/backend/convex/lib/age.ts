/** Fecha de nacimiento en formato ISO `YYYY-MM-DD`. */
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIsoDate(value: string): Date | null {
  const match = ISO_DATE.exec(value.trim());
  if (match === null) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function isAtLeast18(isoDate: string, now = new Date()): boolean {
  const birth = parseIsoDate(isoDate);
  if (birth === null) {
    return false;
  }
  const eighteenth = new Date(
    Date.UTC(birth.getUTCFullYear() + 18, birth.getUTCMonth(), birth.getUTCDate()),
  );
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  return today.getTime() >= eighteenth.getTime();
}

export function requireAdultBirthDate(value: string): string {
  const iso = value.trim();
  if (parseIsoDate(iso) === null) {
    throw new Error("Ingresa una fecha de nacimiento válida.");
  }
  if (!isAtLeast18(iso)) {
    throw new Error("Debes ser mayor de 18 años para registrarte como chofer.");
  }
  return iso;
}
