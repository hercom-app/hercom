import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  getCountryDefinition,
  normalizeCountryCode,
  type CountryGeoDefinition,
} from "../data/countryCatalog";
import {
  HOURLY_SERVICE_RATE_PEN,
  MIN_SERVICE_HOURS,
  PLATFORM_COMMISSION_RATE,
} from "./constants";
import { localToUsd, normalizeMoney, usdToLocal } from "./money";

export type MarketPricing = {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  currencySymbol: string;
  usdExchangeRate: number;
  hourlyRate: number;
  minServiceHours: number;
  minServicePrice: number;
  commissionRate: number;
  level1Label: string;
  level2Label: string;
  level3Label: string;
  timezone: string;
};

export type MarketDoc = Doc<"markets">;

function pricingFromMarket(
  market: MarketDoc,
  country: CountryGeoDefinition,
): MarketPricing {
  const hourlyRate = market.hourlyRate;
  const minServiceHours = market.minServiceHours;
  return {
    countryCode: market.countryCode,
    countryName: market.name,
    currencyCode: market.currencyCode,
    currencySymbol: market.currencySymbol,
    usdExchangeRate: market.usdExchangeRate,
    hourlyRate,
    minServiceHours,
    minServicePrice: normalizeMoney(hourlyRate * minServiceHours),
    commissionRate: market.commissionRate,
    level1Label: country.level1Label,
    level2Label: country.level2Label,
    level3Label: country.level3Label,
    timezone: country.timezone,
  };
}

function fallbackPricing(countryCode: string): MarketPricing {
  const country = getCountryDefinition(countryCode) ?? getCountryDefinition("PE")!;
  return {
    countryCode: country.code,
    countryName: country.name,
    currencyCode: country.defaultCurrencyCode,
    currencySymbol: country.defaultCurrencySymbol,
    usdExchangeRate: 3.75,
    hourlyRate: HOURLY_SERVICE_RATE_PEN,
    minServiceHours: MIN_SERVICE_HOURS,
    minServicePrice: HOURLY_SERVICE_RATE_PEN * MIN_SERVICE_HOURS,
    commissionRate: PLATFORM_COMMISSION_RATE,
    level1Label: country.level1Label,
    level2Label: country.level2Label,
    level3Label: country.level3Label,
    timezone: country.timezone,
  };
}

export async function getMarketByCountry(
  ctx: QueryCtx | MutationCtx,
  countryCode?: string,
): Promise<MarketPricing> {
  const normalized = normalizeCountryCode(countryCode);
  const country = getCountryDefinition(normalized);
  if (country === null) {
    throw new Error(`País no soportado: ${normalized}`);
  }

  const market = await ctx.db
    .query("markets")
    .withIndex("by_country", (q) => q.eq("countryCode", normalized))
    .unique();

  if (market === null || !market.active) {
    return fallbackPricing(normalized);
  }

  return pricingFromMarket(market, country);
}

export function marketMoneySummary(
  pricing: MarketPricing,
  amountLocal: number,
): {
  local: number;
  usd: number;
  formattedLocal: string;
  formattedUsd: string;
} {
  const local = normalizeMoney(amountLocal);
  const usd = localToUsd(local, pricing.usdExchangeRate);
  return {
    local,
    usd,
    formattedLocal: `${pricing.currencySymbol}${local.toFixed(2)}`,
    formattedUsd: `US$${usd.toFixed(2)}`,
  };
}

export function buildDefaultMarketRecord(
  country: CountryGeoDefinition,
): Omit<MarketDoc, "_id" | "_creationTime"> {
  const now = Date.now();
  return {
    countryCode: country.code,
    name: country.name,
    currencyCode: country.defaultCurrencyCode,
    currencySymbol: country.defaultCurrencySymbol,
    usdExchangeRate: country.code === "PE" ? 3.75 : 1,
    hourlyRate: HOURLY_SERVICE_RATE_PEN,
    minServiceHours: MIN_SERVICE_HOURS,
    commissionRate: PLATFORM_COMMISSION_RATE,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
}

export { localToUsd, usdToLocal };
