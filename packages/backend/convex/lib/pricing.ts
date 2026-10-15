import {
  MAX_PROMOTION_DISCOUNT_RATE,
  PLATFORM_COMMISSION_RATE,
} from "./constants";
import {
  computeTieredPlatformCommission,
  inferServiceHoursFromListPrice,
  type MarketCommissionConfig,
} from "./commissionTiers";
import type { MarketPricing } from "./markets";

export type PromotionalPricing = {
  listPrice: number;
  discountRate: number;
  clientPrice: number;
  driverNet: number;
  platformCommission: number;
};

function normalizeMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Precio con promoción festiva: el descuento lo absorbe Hercom; el chofer mantiene
 * su neto sobre la tarifa de lista (75% del precio de lista).
 *
 * Ejemplo lista S/80, descuento 10%:
 * - Cliente paga S/72
 * - Chofer neto S/60 (75% de 80)
 * - Hercom S/12
 */
export function computePromotionalPricing(
  listPrice: number,
  discountRate: number,
): PromotionalPricing {
  const rate = Math.min(Math.max(discountRate, 0), MAX_PROMOTION_DISCOUNT_RATE);
  const list = normalizeMoney(listPrice);
  const clientPrice = normalizeMoney(list * (1 - rate));
  const driverNet = normalizeMoney(list * (1 - PLATFORM_COMMISSION_RATE));
  const platformCommission = normalizeMoney(Math.max(clientPrice - driverNet, 0));
  return {
    listPrice: list,
    discountRate: rate,
    clientPrice,
    driverNet,
    platformCommission,
  };
}

export function computeClientTotalForOffer(
  offeredPrice: number,
  discountRate: number | undefined,
): number {
  if (discountRate === undefined || discountRate <= 0) {
    return normalizeMoney(offeredPrice);
  }
  return computePromotionalPricing(offeredPrice, discountRate).clientPrice;
}

export function marketToCommissionConfig(
  market: MarketPricing,
): MarketCommissionConfig {
  const config: MarketCommissionConfig = {
    commissionRate: market.commissionRate,
  };
  if (market.commissionRateFromHour3 !== undefined) {
    config.commissionRateFromHour3 = market.commissionRateFromHour3;
  }
  if (market.commissionRateFromHour8 !== undefined) {
    config.commissionRateFromHour8 = market.commissionRateFromHour8;
  }
  if (market.commissionFromHour3 !== undefined) {
    config.commissionFromHour3 = market.commissionFromHour3;
  }
  if (market.commissionFromHour8 !== undefined) {
    config.commissionFromHour8 = market.commissionFromHour8;
  }
  return config;
}

export function computePlatformCommissionForService(
  offeredPrice: number,
  discountRate: number | undefined,
  options?: {
    serviceHours?: number;
    hourlyRate?: number;
    market?: MarketPricing;
  },
): number {
  const list = normalizeMoney(offeredPrice);
  let baseCommission: number;
  if (
    options?.serviceHours !== undefined &&
    options.hourlyRate !== undefined &&
    options.market !== undefined &&
    options.serviceHours > 0 &&
    options.hourlyRate > 0
  ) {
    baseCommission = computeTieredPlatformCommission(
      options.hourlyRate,
      options.serviceHours,
      marketToCommissionConfig(options.market),
    );
  } else {
    baseCommission = normalizeMoney(list * PLATFORM_COMMISSION_RATE);
  }

  if (discountRate === undefined || discountRate <= 0) {
    return baseCommission;
  }
  const promo = computePromotionalPricing(list, discountRate);
  return normalizeMoney(Math.max(promo.platformCommission, 0));
}

export function resolveServiceHoursAndHourlyRate(
  offeredPrice: number,
  market: MarketPricing,
  existingHours?: number,
  existingHourly?: number,
): { serviceHours: number; hourlyRateSnapshot: number } {
  if (existingHours !== undefined && existingHourly !== undefined) {
    return {
      serviceHours: existingHours,
      hourlyRateSnapshot: existingHourly,
    };
  }
  const serviceHours = inferServiceHoursFromListPrice(
    offeredPrice,
    market.hourlyRate,
    market.minServiceHours,
  );
  const hourlyRateSnapshot = normalizeMoney(offeredPrice / serviceHours);
  return { serviceHours, hourlyRateSnapshot };
}

export function getMinimumOfferPrice(service: {
  catalogBasePrice?: number;
  basePrice: number;
}): number {
  return normalizeMoney(service.catalogBasePrice ?? service.basePrice);
}
