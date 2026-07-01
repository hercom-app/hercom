import {
  MAX_PROMOTION_DISCOUNT_RATE,
  PLATFORM_COMMISSION_RATE,
} from "./constants";

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

export function computePlatformCommissionForService(
  offeredPrice: number,
  discountRate: number | undefined,
): number {
  if (discountRate === undefined || discountRate <= 0) {
    return normalizeMoney(offeredPrice * PLATFORM_COMMISSION_RATE);
  }
  return computePromotionalPricing(offeredPrice, discountRate).platformCommission;
}

export function getMinimumOfferPrice(service: {
  catalogBasePrice?: number;
  basePrice: number;
}): number {
  return normalizeMoney(service.catalogBasePrice ?? service.basePrice);
}
