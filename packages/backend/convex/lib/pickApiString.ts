/** Lee el primer campo string no vacío de un objeto API (snake_case o camelCase). */
export function pickApiString(
  data: Record<string, unknown>,
  keys: string[],
): string {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed !== "") {
        return trimmed;
      }
    }
  }
  return "";
}
