import { computeClientAdvance } from "@proyecto/backend/constants";
import type { Doc } from "@proyecto/backend/dataModel";

export function clientAdvanceAmount(service: Pick<Doc<"services">, "advanceAmount" | "totalPrice">): number {
  return service.advanceAmount ?? computeClientAdvance(service.totalPrice);
}

export function clientBalanceDue(service: Pick<Doc<"services">, "advanceAmount" | "totalPrice">): number {
  const advance = clientAdvanceAmount(service);
  return Math.round(Math.max(service.totalPrice - advance, 0) * 100) / 100;
}