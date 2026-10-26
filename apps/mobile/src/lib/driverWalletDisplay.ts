export function formatTripCreditsShort(tripCredits: number): string {
  const n = Math.max(0, Math.round(tripCredits));
  return n === 1 ? "1 viaje" : `${n} viajes`;
}

export function formatTripDelta(amount: number, type: "top_up" | "trip_debit"): string {
  const n = Math.round(amount);
  const label = n === 1 ? "1 viaje" : `${n} viajes`;
  return type === "trip_debit" ? `−${label}` : `+${label}`;
}
