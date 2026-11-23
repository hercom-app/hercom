/** Comisión Izipay para recarga de saldo (referencia Yango / pasarela Perú). */
export const IZIPAY_TOP_UP_FEE_RATE = 0.0248;
export const IZIPAY_TOP_UP_FEE_FIXED_PEN = 0.34;

/** Debe coincidir con `walletTopUps` en Convex (validación servidor). */
export const WALLET_TOP_UP_MIN_PEN = 10;
export const WALLET_TOP_UP_MAX_PEN = 500;

/** @deprecated Usar WALLET_TOP_UP_MIN_PEN */
export const IZIPAY_TOP_UP_MIN_PEN = WALLET_TOP_UP_MIN_PEN;
/** @deprecated Usar WALLET_TOP_UP_MAX_PEN */
export const IZIPAY_TOP_UP_MAX_PEN = WALLET_TOP_UP_MAX_PEN;

/** Interpreta texto del chofer → soles (null si vacío o no numérico). */
export function parseTopUpAmountPen(text: string): number | null {
  const trimmed = text.trim().replace(/\s/g, "").replace(/,/g, ".");
  if (trimmed === "") {
    return null;
  }
  const normalized = trimmed.replace(/^s\/\s*/i, "");
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value)) {
    return null;
  }
  return Math.round(value * 100) / 100;
}

export function validateTopUpAmountPen(amountPen: number | null): string | null {
  if (amountPen === null) {
    return "Indica cuánto quieres recargar.";
  }
  if (amountPen < WALLET_TOP_UP_MIN_PEN) {
    return `El monto mínimo es S/ ${WALLET_TOP_UP_MIN_PEN}.`;
  }
  if (amountPen > WALLET_TOP_UP_MAX_PEN) {
    return `El monto máximo es S/ ${WALLET_TOP_UP_MAX_PEN}.`;
  }
  return null;
}

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
