import {
  listDistrictsForProvince,
  listProvincesForDepartment,
  PERU_DEPARTMENTS,
} from "../data/peruLocations";
import {
  getCountryDefinition,
  normalizeCountryCode,
  SUPPORTED_COUNTRIES,
} from "../data/countryCatalog";

export type GeoRegion = {
  countryCode?: string;
  department?: string;
  province?: string;
  district?: string;
};

export type GeoRegionFilter = {
  countryCode?: string | undefined;
  department?: string | undefined;
  province?: string | undefined;
  district?: string | undefined;
};

export function resolveCountryCode(region: GeoRegion): string {
  return normalizeCountryCode(region.countryCode);
}

export function matchesOriginRegion(
  origin: GeoRegion,
  filter: GeoRegionFilter,
): boolean {
  if (filter.countryCode !== undefined && filter.countryCode !== "") {
    if (resolveCountryCode(origin) !== normalizeCountryCode(filter.countryCode)) {
      return false;
    }
  }
  if (filter.department !== undefined && filter.department !== "") {
    if (origin.department !== filter.department) {
      return false;
    }
  }
  if (filter.province !== undefined && filter.province !== "") {
    if (origin.province !== filter.province) {
      return false;
    }
  }
  if (filter.district !== undefined && filter.district !== "") {
    if (origin.district !== filter.district) {
      return false;
    }
  }
  return true;
}

export function matchesPromotionRegion(
  promotion: GeoRegion & { department: string },
  filter: GeoRegionFilter,
): boolean {
  return matchesOriginRegion(promotion, filter);
}

export function listLevel1ForCountry(countryCode: string): string[] {
  const normalized = normalizeCountryCode(countryCode);
  if (normalized === "PE") {
    return [...PERU_DEPARTMENTS];
  }
  return [];
}

export function listLevel2ForCountry(
  countryCode: string,
  level1: string,
): string[] {
  const normalized = normalizeCountryCode(countryCode);
  if (normalized === "PE") {
    return listProvincesForDepartment(level1);
  }
  return [];
}

export function listLevel3ForCountry(
  countryCode: string,
  level1: string,
  level2: string,
): string[] {
  const normalized = normalizeCountryCode(countryCode);
  if (normalized === "PE") {
    return listDistrictsForProvince(level1, level2);
  }
  return [];
}

export function listSupportedCountries() {
  return SUPPORTED_COUNTRIES.map((country) => ({
    code: country.code,
    name: country.name,
    level1Label: country.level1Label,
    level2Label: country.level2Label,
    level3Label: country.level3Label,
    timezone: country.timezone,
    defaultCurrencyCode: country.defaultCurrencyCode,
    defaultCurrencySymbol: country.defaultCurrencySymbol,
  }));
}

export function getCountryGeoConfig(countryCode: string) {
  const normalized = normalizeCountryCode(countryCode);
  const country = getCountryDefinition(normalized);
  if (country === null) {
    return null;
  }
  return {
    code: country.code,
    name: country.name,
    level1Label: country.level1Label,
    level2Label: country.level2Label,
    level3Label: country.level3Label,
    timezone: country.timezone,
    defaultCurrencyCode: country.defaultCurrencyCode,
    defaultCurrencySymbol: country.defaultCurrencySymbol,
  };
}
