import type { Doc } from "../_generated/dataModel";

/** Detalle cuando status = cancelled (solo cancelaciones por persona). */
export const SERVICE_CLOSURE_REASONS = [
  "cancelled_by_client",
  "cancelled_by_staff",
] as const;

export type ServiceClosureReason = (typeof SERVICE_CLOSURE_REASONS)[number];

export type ServiceClosureFields = Pick<
  Doc<"services">,
  "status" | "closureReason" | "driverId" | "assignedAt"
>;

export function isTerminalServiceStatus(
  status: Doc<"services">["status"],
): boolean {
  return (
    status === "finished" ||
    status === "cancelled" ||
    status === "unattended"
  );
}

/** Métrica «No atendido»: status propio o legacy cancelled sin chofer. */
export function isUnattendedService(service: ServiceClosureFields): boolean {
  if (service.status === "unattended") {
    return true;
  }
  if (service.status !== "cancelled") {
    return false;
  }
  if (service.closureReason === "unattended") {
    return true;
  }
  if (
    service.closureReason === "cancelled_by_client" ||
    service.closureReason === "cancelled_by_staff"
  ) {
    return false;
  }
  return service.driverId === undefined && service.assignedAt === undefined;
}

/** Etiqueta operativa en panel admin. */
export function getAdminServiceStatusLabel(
  service: ServiceClosureFields & { status: Doc<"services">["status"] },
): string {
  const labels: Record<Doc<"services">["status"], string> = {
    pending: "Pendiente",
    assigned: "Asignado",
    heading_to_pickup: "Yendo a recoger",
    arrived_pickup: "Llegó al punto",
    in_progress: "En viaje",
    arrived_destination: "Llegó al destino",
    en_route: "En camino",
    finished: "Finalizado",
    unattended: "No atendido",
    cancelled: "Cancelado",
  };
  if (service.status === "cancelled" && isUnattendedService(service)) {
    return "No atendido";
  }
  return labels[service.status] ?? service.status;
}
