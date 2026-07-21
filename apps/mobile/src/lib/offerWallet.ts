/** Alineado con packages/backend/convex/lib/constants.ts */
const PLATFORM_COMMISSION_RATE = 0.25;
const MIN_DRIVER_WALLET_BALANCE = -10;

export function estimateOfferCommission(offeredPrice: number): number {
  return Math.round(offeredPrice * PLATFORM_COMMISSION_RATE * 100) / 100;
}

/** ¿El saldo alcanzaría para la comisión de esta oferta? */
export function canCoverOfferCommission(
  balance: number,
  offeredPrice: number,
): boolean {
  const projected = balance - estimateOfferCommission(offeredPrice);
  return projected >= MIN_DRIVER_WALLET_BALANCE;
}
