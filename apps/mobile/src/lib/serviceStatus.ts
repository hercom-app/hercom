import type { Doc } from "@proyecto/backend/dataModel";

/** Viaje ya inició (código OK): compartir enlace / mapa en vivo. */
export function canShareLiveTrip(
  status: Doc<"services">["status"],
): boolean {
  return (
    status === "in_progress" ||
    status === "en_route" ||
    status === "arrived_destination"
  );
}

/** Viaje en curso (cliente o chofer). */
export function isActiveServiceStatus(
  status: Doc<"services">["status"],
): boolean {
  return (
    status === "pending" ||
    status === "assigned" ||
    status === "heading_to_pickup" ||
    status === "arrived_pickup" ||
    status === "in_progress" ||
    status === "arrived_destination" ||
    status === "en_route"
  );
}
