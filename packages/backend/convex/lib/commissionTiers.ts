import { normalizeMoney } from "./money";

export type CommissionTier = {
  fromHour: number;
  toHour: number | null;
  rate: number;
};

export const DEFAULT_COMMISSION_FROM_HOUR_3 = 3;
export const DEFAULT_COMMISSION_FROM_HOUR_8 = 8;
export const DEFAULT_COMMISSION_RATE_HOUR_3 = 0.15;
export const DEFAULT_COMMISSION_RATE_HOUR_8 = 0.1;

export type MarketCommissionConfig = {
  /** Comisión horas 1–2 (típ. 0.25). */
  commissionRate: number;
  commissionRateFromHour3?: number;
  commissionRateFromHour8?: number;
  commissionFromHour3?: number;
  commissionFromHour8?: number;
};

export function buildCommissionTiers(
  config: MarketCommissionConfig,
): CommissionTier[] {
  const from3 = config.commissionFromHour3 ?? DEFAULT_COMMISSION_FROM_HOUR_3;
  const from8 = config.commissionFromHour8 ?? DEFAULT_COMMISSION_FROM_HOUR_8;
  const rate3 = config.commissionRateFromHour3 ?? DEFAULT_COMMISSION_RATE_HOUR_3;
  const rate8 = config.commissionRateFromHour8 ?? DEFAULT_COMMISSION_RATE_HOUR_8;
  return [
    { fromHour: 1, toHour: from3 - 1, rate: config.commissionRate },
    { fromHour: from3, toHour: from8 - 1, rate: rate3 },
    { fromHour: from8, toHour: null, rate: rate8 },
  ];
}

function rateForHour(hour: number, tiers: CommissionTier[]): number {
  for (const tier of tiers) {
    const to = tier.toHour ?? Number.POSITIVE_INFINITY;
    if (hour >= tier.fromHour && hour <= to) {
      return tier.rate;
    }
  }
  return tiers[tiers.length - 1]?.rate ?? 0;
}

/** Comisión Hercom por horas contratadas × tarifa horaria. */
export function computeTieredPlatformCommission(
  hourlyRate: number,
  serviceHours: number,
  config: MarketCommissionConfig,
): number {
  const hours = Math.max(1, Math.round(serviceHours));
  const tiers = buildCommissionTiers(config);
  let total = 0;
  for (let h = 1; h <= hours; h += 1) {
    total += hourlyRate * rateForHour(h, tiers);
  }
  return normalizeMoney(total);
}

export function inferServiceHoursFromListPrice(
  listPrice: number,
  hourlyRate: number,
  minServiceHours: number,
): number {
  if (hourlyRate <= 0) {
    return minServiceHours;
  }
  const inferred = Math.round(listPrice / hourlyRate);
  return Math.max(minServiceHours, inferred);
}

export const MS_PER_SERVICE_HOUR = 60 * 60 * 1000;

export function computeServiceEndsAt(
  startedAtMs: number,
  serviceHours: number,
): number {
  return startedAtMs + Math.max(1, serviceHours) * MS_PER_SERVICE_HOUR;
}
