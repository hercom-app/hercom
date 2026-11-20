export type TripPaymentMethod = "cash" | "yape" | "plin" | "card";

export const TRIP_PAYMENT_OPTIONS: { value: TripPaymentMethod; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "yape", label: "Yape" },
  { value: "plin", label: "Plin" },
  { value: "card", label: "Tarjeta" },
];

export const TRIP_PAYMENT_LABELS: Record<TripPaymentMethod, string> = {
  cash: "Efectivo",
  yape: "Yape",
  plin: "Plin",
  card: "Tarjeta",
};