/** ¿Tiene al menos un viaje prepagado para ofertar? */
export function hasTripCreditForOffer(tripCredits: number): boolean {
  return Math.round(tripCredits) >= 1;
}

export function formatTripCredits(tripCredits: number): string {
  const n = Math.max(0, Math.round(tripCredits));
  return n === 1 ? "1 viaje" : `${n} viajes`;
}
