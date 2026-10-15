import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getMarketByCountry } from "./markets";
import { normalizeMoney } from "./money";
import { getMinimumOfferPrice } from "./pricing";
import { resolveCountryCode } from "./regionFilters";

export const DEFAULT_MAX_DRIVER_MARKUP_OVER_BASE = 0.5;

export type OfferLimitResolution = {
  minOfferPrice: number;
  maxOfferPrice: number;
  catalogBasePrice: number;
  maxMarkupOverBase: number;
  districtRuleApplied: boolean;
};

async function findDistrictPricingRule(
  ctx: QueryCtx | MutationCtx,
  origin: {
    countryCode?: string;
    department?: string;
    province?: string;
    district?: string;
  },
): Promise<Doc<"districtPricingRules"> | null> {
  const countryCode = resolveCountryCode(origin);
  const department = origin.department?.trim() ?? "";
  if (department === "") {
    return null;
  }
  const rules = await ctx.db
    .query("districtPricingRules")
    .withIndex("by_country_department", (q) =>
      q.eq("countryCode", countryCode).eq("department", department),
    )
    .collect();

  const province = origin.province?.trim() ?? "";
  const district = origin.district?.trim() ?? "";

  const scored = rules
    .filter((rule) => rule.active)
    .map((rule) => {
      let score = 0;
      if (rule.province !== undefined && rule.province !== "") {
        if (rule.province !== province) {
          return null;
        }
        score += 1;
      }
      if (rule.district !== undefined && rule.district !== "") {
        if (rule.district !== district) {
          return null;
        }
        score += 2;
      }
      return { rule, score };
    })
    .filter((item): item is { rule: Doc<"districtPricingRules">; score: number } =>
      item !== null,
    )
    .sort((a, b) => b.score - a.score);

  return scored[0]?.rule ?? null;
}

export async function resolveOfferLimits(
  ctx: QueryCtx | MutationCtx,
  service: {
    catalogBasePrice?: number;
    basePrice: number;
    origin: {
      countryCode?: string;
      department?: string;
      province?: string;
      district?: string;
    };
  },
): Promise<OfferLimitResolution> {
  const catalogBasePrice = normalizeMoney(
    service.catalogBasePrice ?? service.basePrice,
  );
  const minOfferPrice = getMinimumOfferPrice(service);
  const market = await getMarketByCountry(ctx, service.origin.countryCode);
  const districtRule = await findDistrictPricingRule(ctx, service.origin);

  const markup =
    districtRule?.maxDriverMarkupOverBase ??
    market.maxDriverMarkupOverBase ??
    DEFAULT_MAX_DRIVER_MARKUP_OVER_BASE;

  let maxOfferPrice = normalizeMoney(catalogBasePrice * (1 + markup));
  if (districtRule?.maxDriverOfferPrice !== undefined) {
    maxOfferPrice = Math.min(
      maxOfferPrice,
      normalizeMoney(districtRule.maxDriverOfferPrice),
    );
  }

  return {
    minOfferPrice,
    maxOfferPrice: Math.max(minOfferPrice, maxOfferPrice),
    catalogBasePrice,
    maxMarkupOverBase: markup,
    districtRuleApplied: districtRule !== null,
  };
}
