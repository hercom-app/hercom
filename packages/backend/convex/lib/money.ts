export function normalizeMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Convierte monto en moneda local a USD.
 * `usdExchangeRate` = unidades de moneda local por 1 USD (ej. 3.75 PEN/USD).
 */
export function localToUsd(
  amountLocal: number,
  usdExchangeRate: number,
): number {
  if (usdExchangeRate <= 0) {
    return 0;
  }
  return normalizeMoney(amountLocal / usdExchangeRate);
}

/**
 * Convierte USD a moneda local.
 */
export function usdToLocal(
  amountUsd: number,
  usdExchangeRate: number,
): number {
  return normalizeMoney(amountUsd * usdExchangeRate);
}

export function formatMoney(
  amount: number,
  currencySymbol: string,
): string {
  return `${currencySymbol}${amount.toFixed(2)}`;
}
