import { PLATFORM_COMMISSION_RATE } from "./constants";
import { inferServiceHoursFromListPrice } from "./commissionTiers";
import { quoteDriverFare } from "./driverFare";
import type { MarketPricing } from "./markets";

export { driverFacingTripMoney, quoteDriverFare } from "./driverFare";
export type { DriverFareQuote } from "./driverFare";

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
 * El descuento lo absorbe Hercom. El chofer sigue ganando lista × (1 − comisión)
 * y ve la oferta tachada, lo que le paga el cliente y la comisión menor.
 *
 * Lista S/80, comisión 25%, descuento 15% (S/12):
 * - Cliente le paga al chofer S/68
 * - Comisión S/8 (no S/20)
 * - Chofer se queda S/60
 */
export function computePromotionalPricing(
  listPrice: number,
  discountRate: number,
  commissionRate: number = PLATFORM_COMMISSION_RATE,
): PromotionalPricing {
  const quote = quoteDriverFare(listPrice, discountRate, commissionRate);
  return {
    listPrice: quote.offer,
    discountRate: quote.discountRate,
    clientPrice: quote.clientPays,
    driverNet: quote.net,
    platformCommission: quote.commission,
  };
}

export function computeClientTotalForOffer(
  offeredPrice: number,
  discountRate: number | undefined,
  commissionRate: number = PLATFORM_COMMISSION_RATE,
): number {
  if (discountRate === undefined || discountRate <= 0) {
    return normalizeMoney(offeredPrice);
  }
  return computePromotionalPricing(offeredPrice, discountRate, commissionRate)
    .clientPrice;
}

export function computePlatformCommissionForService(
  offeredPrice: number,
  discountRate: number | undefined,
  options?: {
    /** Porcentaje plano sobre lo que gana el chofer. Defecto: 25%. */
    commissionRate?: number;
    serviceHours?: number;
    hourlyRate?: number;
    market?: MarketPricing;
  },
): number {
  const list = normalizeMoney(offeredPrice);
  const rate = options?.commissionRate ?? PLATFORM_COMMISSION_RATE;
  if (discountRate === undefined || discountRate <= 0) {
    return normalizeMoney(list * rate);
  }
  const promo = computePromotionalPricing(list, discountRate, rate);
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

/** Monto de lista y lo que paga el cliente por horas extra en el viaje. */
export function computeExtensionAmounts(
  extraHours: number,
  hourlyRate: number,
  discountRate: number | undefined,
  commissionRate: number = PLATFORM_COMMISSION_RATE,
): { listExtra: number; clientExtra: number } {
  const listExtra = normalizeMoney(Math.max(extraHours, 0) * hourlyRate);
  const clientExtra = computeClientTotalForOffer(
    listExtra,
    discountRate,
    commissionRate,
  );
  return { listExtra, clientExtra };
}

export function getMinimumOfferPrice(service: {
  catalogBasePrice?: number;
  basePrice: number;
}): number {
  return normalizeMoney(service.catalogBasePrice ?? service.basePrice);
}
