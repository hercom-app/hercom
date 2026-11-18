export function formatWalletBalance(balance: number): string {
  const abs = Math.abs(balance).toFixed(2);
  return balance < 0 ? `-S/ ${abs}` : `S/ ${abs}`;
}

export function formatWalletDelta(
  amount: number,
  type: "top_up" | "commission_debit" | "trip_debit",
): string {
  if (type === "trip_debit") {
    const n = Math.round(amount);
    const label = n === 1 ? "1 viaje" : `${n} viajes`;
    return `−${label}`;
  }
  const soles = `S/ ${Math.abs(amount).toFixed(2)}`;
  return type === "top_up" ? `+${soles}` : `−${soles}`;
}
