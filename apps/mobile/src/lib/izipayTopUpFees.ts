/** Comisión Izipay para recarga de saldo (referencia Yango / pasarela Perú). */
export const IZIPAY_TOP_UP_FEE_RATE = 0.0248;
export const IZIPAY_TOP_UP_FEE_FIXED_PEN = 0.34;

/** Rango de precios de paquetes de recarga (1 / 2 / 5 viajes). */
export const IZIPAY_TOP_UP_MIN_PEN = 30;
export const IZIPAY_TOP_UP_MAX_PEN = 100;

export type IzipayTopUpQuote = {
  amountPen: number;
  commissionPen: number;
  totalDebitPen: number;
};

function roundPen(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeIzipayTopUpQuote(amountPen: number): IzipayTopUpQuote {
  const safe = Number.isFinite(amountPen) ? amountPen : 0;
  const commissionPen = roundPen(
    safe * IZIPAY_TOP_UP_FEE_RATE + IZIPAY_TOP_UP_FEE_FIXED_PEN,
  );
  const totalDebitPen = roundPen(safe + commissionPen);
  return { amountPen: safe, commissionPen, totalDebitPen };
}

export function formatWalletPen(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  const formatted =
    abs % 1 === 0 ? abs.toFixed(1) : abs.toFixed(2).replace(/\.?0+$/, "");
  return `${sign}S/ ${formatted}`;
}

export function formatPenAmount(amount: number): string {
  const rounded = roundPen(amount);
  return Number.isInteger(rounded)
    ? `${rounded} PEN`
    : `${rounded.toFixed(2)} PEN`;
}
