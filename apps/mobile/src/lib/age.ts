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

export function toIsoDate(year: number, month: number, day: number): string | null {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return parseIsoDate(iso) === null ? null : iso;
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

export function composeBirthDate(
  dayText: string,
  monthText: string,
  yearText: string,
): string | null {
  if (dayText.trim() === "" || monthText.trim() === "" || yearText.trim() === "") {
    return null;
  }
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  return toIsoDate(year, month, day);
}
