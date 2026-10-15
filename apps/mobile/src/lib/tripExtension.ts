import type { Doc } from "@proyecto/backend/dataModel";

export const EXTEND_SERVICE_PROMPT_MS = 20 * 60 * 1000;

const EXTENDABLE_STATUSES: Doc<"services">["status"][] = [
  "in_progress",
  "en_route",
  "arrived_destination",
];

export function canClientExtendTrip(
  status: Doc<"services">["status"],
): boolean {
  return EXTENDABLE_STATUSES.includes(status);
}

export function resolveServiceEndsAtMs(service: Doc<"services">): number | null {
  if (service.serviceEndsAt !== undefined) {
    return service.serviceEndsAt;
  }
  if (service.departedWithClientAt === undefined) {
    return null;
  }
  const hours = service.serviceHours ?? 2;
  return service.departedWithClientAt + hours * 60 * 60 * 1000;
}

export function msUntilServiceEnd(
  service: Doc<"services">,
  nowMs = Date.now(),
): number | null {
  const endsAt = resolveServiceEndsAtMs(service);
  if (endsAt === null) {
    return null;
  }
  return endsAt - nowMs;
}

export function shouldPromptExtendService(
  service: Doc<"services">,
  nowMs = Date.now(),
): boolean {
  if (!canClientExtendTrip(service.status)) {
    return false;
  }
  const remaining = msUntilServiceEnd(service, nowMs);
  if (remaining === null) {
    return false;
  }
  return remaining > 0 && remaining <= EXTEND_SERVICE_PROMPT_MS;
}

export function formatRemainingTime(ms: number): string {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000));
  if (totalMinutes >= 60) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m > 0 ? `${h} h ${m} min` : `${h} h`;
  }
  return `${totalMinutes} min`;
}
