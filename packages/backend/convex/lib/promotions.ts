import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { computePromotionalPricing } from "./pricing";

type RegionFilter = {
  department: string;
  province?: string;
  district?: string;
};

function isWithinDateRange(
  promotion: Doc<"promotions">,
  atMs: number,
): boolean {
  return atMs >= promotion.startsAt && atMs <= promotion.endsAt;
}

function regionSpecificity(promotion: Doc<"promotions">): number {
  if (promotion.district !== undefined) {
    return 3;
  }
  if (promotion.province !== undefined) {
    return 2;
  }
  return 1;
}

function promotionMatchesRegion(
  promotion: Doc<"promotions">,
  region: RegionFilter,
): boolean {
  if (promotion.department !== region.department) {
    return false;
  }
  if (promotion.province !== undefined && promotion.province !== region.province) {
    return false;
  }
  if (promotion.district !== undefined && promotion.district !== region.district) {
    return false;
  }
  return true;
}

export async function findActivePromotion(
  ctx: QueryCtx | MutationCtx,
  region: RegionFilter,
  atMs: number = Date.now(),
): Promise<Doc<"promotions"> | null> {
  if (region.department.trim() === "") {
    return null;
  }

  const activePromotions = await ctx.db
    .query("promotions")
    .withIndex("by_active", (q) => q.eq("active", true))
    .collect();

  const matches = activePromotions
    .filter(
      (promotion) =>
        isWithinDateRange(promotion, atMs) &&
        promotionMatchesRegion(promotion, region),
    )
    .sort((a, b) => {
      const specDiff = regionSpecificity(b) - regionSpecificity(a);
      if (specDiff !== 0) {
        return specDiff;
      }
      return b.discountRate - a.discountRate;
    });

  return matches[0] ?? null;
}

export type AppliedPromotion = {
  promotionId: Id<"promotions">;
  promotionName: string;
  festivityLabel?: string;
  catalogBasePrice: number;
  basePrice: number;
  discountRate: number;
  driverCommissionEstimate: number;
};

export async function applyPromotionToListPrice(
  ctx: QueryCtx | MutationCtx,
  listBasePrice: number,
  region: RegionFilter,
  atMs: number = Date.now(),
): Promise<AppliedPromotion | null> {
  const promotion = await findActivePromotion(ctx, region, atMs);
  if (promotion === null) {
    return null;
  }

  const pricing = computePromotionalPricing(listBasePrice, promotion.discountRate);

  return {
    promotionId: promotion._id,
    promotionName: promotion.name,
    ...(promotion.festivityLabel !== undefined
      ? { festivityLabel: promotion.festivityLabel }
      : {}),
    catalogBasePrice: pricing.listPrice,
    basePrice: pricing.clientPrice,
    discountRate: pricing.discountRate,
    driverCommissionEstimate: pricing.platformCommission,
  };
}
