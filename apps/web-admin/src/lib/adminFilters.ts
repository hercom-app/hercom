export type RegionFilter = {
  department: string;
  province: string;
  district: string;
};

export const EMPTY_REGION_FILTER: RegionFilter = {
  department: "",
  province: "",
  district: "",
};

export function hasRegionFilter(filter: RegionFilter): boolean {
  return filter.department !== "";
}

export function regionToQueryArgs(filter: RegionFilter): {
  department?: string;
  province?: string;
  district?: string;
} {
  return {
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
    department: string;
    province?: string;
    district?: string;
  },
  filter: RegionFilter,
): boolean {
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

export const selectClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-hercom";

export const inputClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-hercom";
