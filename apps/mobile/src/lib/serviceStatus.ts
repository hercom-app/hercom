import type { Doc } from "@proyecto/backend/dataModel";

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
