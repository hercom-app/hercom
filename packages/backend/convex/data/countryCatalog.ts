/**
 * Catálogo de países soportados y etiquetas de su división política.
 * Perú: nivel 1 = departamento, 2 = provincia, 3 = distrito.
 */
export type CountryGeoDefinition = {
  code: string;
  name: string;
  level1Label: string;
  level2Label: string;
  level3Label: string;
  timezone: string;
  defaultCurrencyCode: string;
  defaultCurrencySymbol: string;
};

export const SUPPORTED_COUNTRIES: CountryGeoDefinition[] = [
  {
    code: "PE",
    name: "Perú",
    level1Label: "Departamento",
    level2Label: "Provincia",
    level3Label: "Distrito",
    timezone: "America/Lima",
    defaultCurrencyCode: "PEN",
    defaultCurrencySymbol: "S/",
  },
];

const BY_CODE = new Map(
  SUPPORTED_COUNTRIES.map((country) => [country.code, country]),
);

export function getCountryDefinition(
  countryCode: string,
): CountryGeoDefinition | null {
  return BY_CODE.get(countryCode.toUpperCase()) ?? null;
}

export function normalizeCountryCode(countryCode?: string): string {
  const value = (countryCode ?? "PE").trim().toUpperCase();
  if (value === "") {
    return "PE";
  }
  return value;
}
