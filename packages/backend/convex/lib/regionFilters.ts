type OriginRegion = {
  department?: string;
  province?: string;
  district?: string;
};

type RegionFilterArgs = {
  department?: string | undefined;
  province?: string | undefined;
  district?: string | undefined;
};

export function matchesOriginRegion(
  origin: OriginRegion,
  filter: RegionFilterArgs,
): boolean {
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
  promotion: OriginRegion & { department: string },
  filter: RegionFilterArgs,
): boolean {
  return matchesOriginRegion(promotion, filter);
}
