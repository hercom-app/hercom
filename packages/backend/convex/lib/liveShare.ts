import type { Doc } from "../_generated/dataModel";

/** Estados en los que el viaje ya comenzó (código validado) y se puede compartir seguimiento. */
export const SHARE_LIVE_STATUSES = new Set<Doc<"services">["status"]>([
  "in_progress",
  "en_route",
  "arrived_destination",
]);

export function canShareLiveTrip(
  status: Doc<"services">["status"],
): boolean {
  return SHARE_LIVE_STATUSES.has(status);
}

/** Tablero admin: incluye ida al recojo antes de iniciar el viaje. */
export const ADMIN_LIVE_STATUSES = new Set<Doc<"services">["status"]>([
  ...SHARE_LIVE_STATUSES,
  "heading_to_pickup",
  "arrived_pickup",
]);
