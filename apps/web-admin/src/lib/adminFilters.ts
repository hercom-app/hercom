export type RegionFilter = {
  countryCode: string;
  department: string;
  province: string;
  district: string;
};

export const DEFAULT_COUNTRY_CODE = "PE";

export const EMPTY_REGION_FILTER: RegionFilter = {
  countryCode: DEFAULT_COUNTRY_CODE,
  department: "",
  province: "",
  district: "",
};

export function hasRegionFilter(filter: RegionFilter): boolean {
  return filter.department !== "";
}

export function regionToQueryArgs(filter: RegionFilter): {
  countryCode?: string;
  department?: string;
  province?: string;
  district?: string;
} {
  return {
    ...(filter.countryCode !== "" ? { countryCode: filter.countryCode } : {}),
    ...(filter.department !== "" ? { department: filter.department } : {}),
    ...(filter.province !== "" ? { province: filter.province } : {}),
    ...(filter.district !== "" ? { district: filter.district } : {}),
  };
}

export function matchesTextSearch(
  query: string,
  values: Array<string | undefined | null>,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (normalized === "") {
    return true;
  }
  return values.some((value) =>
    (value ?? "").toLowerCase().includes(normalized),
  );
}

export function matchesPromotionRegion(
  promotion: {
    countryCode?: string;
    department: string;
    province?: string;
    district?: string;
  },
  filter: RegionFilter,
): boolean {
  const promoCountry = (promotion.countryCode ?? DEFAULT_COUNTRY_CODE).toUpperCase();
  if (
    filter.countryCode !== "" &&
    promoCountry !== filter.countryCode.toUpperCase()
  ) {
    return false;
  }
  if (filter.department !== "" && promotion.department !== filter.department) {
    return false;
  }
  if (filter.province !== "" && promotion.province !== filter.province) {
    return false;
  }
  if (filter.district !== "" && promotion.district !== filter.district) {
    return false;
  }
  return true;
}

export {
  inputClass,
  selectClass,
} from "./adminUi";
