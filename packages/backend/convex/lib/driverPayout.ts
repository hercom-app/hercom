/** Yape o Plin: el cliente los ve para adelantar el 25% antes de que el chofer salga. */
export function hasYapeOrPlin(driver: {
  yape?: string;
  plin?: string;
}): boolean {
  return (driver.yape?.trim() ?? "") !== "" || (driver.plin?.trim() ?? "") !== "";
}

export const MISSING_PAYOUT_OFFER_MESSAGE =
  "Registra Yape o Plin en tus datos de cobro antes de ofertar. El cliente los necesita para adelantarte el anticipo.";
