import {
  MIN_DRIVER_WALLET_BALANCE,
  PLATFORM_COMMISSION_RATE,
} from "@proyecto/backend/constants";

/** Comisión estimada con la tasa por defecto. El servidor aplica la del distrito. */
export function estimatedCommission(offeredPrice: number): number {
  return Math.round(offeredPrice * PLATFORM_COMMISSION_RATE * 100) / 100;
}

/** El saldo después de la comisión no puede bajar de S/-15. */
export function canAffordOffer(
  balance: number,
  offeredPrice: number,
  commission?: number,
): boolean {
  const debit = commission ?? estimatedCommission(offeredPrice);
  const next = Math.round((balance - debit) * 100) / 100;
  return next >= MIN_DRIVER_WALLET_BALANCE;
}
