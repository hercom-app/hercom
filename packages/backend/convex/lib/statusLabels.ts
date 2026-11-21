import type { Doc } from "../_generated/dataModel";

type DriverStatus = Doc<"drivers">["status"];

const DRIVER_STATUS_ES: Record<DriverStatus, string> = {
  available: "Disponible",
  busy: "Ocupado",
  offline: "Desconectado",
};

export function formatDriverStatus(status: DriverStatus): string {
  return DRIVER_STATUS_ES[status];
}

type ApplicationStatus = Doc<"driverApplications">["status"];

const APPLICATION_STATUS_ES: Record<ApplicationStatus, string> = {
  pending: "Pendiente de revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
};

export function formatDriverApplicationStatus(status: ApplicationStatus): string {
  return APPLICATION_STATUS_ES[status];
}

export function resolveAdminDriverRowStatus(args: {
  driverStatus?: DriverStatus;
  applicationStatus?: ApplicationStatus;
}): string {
  if (args.applicationStatus === "pending") {
    return APPLICATION_STATUS_ES.pending;
  }
  if (args.applicationStatus === "rejected") {
    return APPLICATION_STATUS_ES.rejected;
  }
  if (args.driverStatus !== undefined) {
    return formatDriverStatus(args.driverStatus);
  }
  if (args.applicationStatus !== undefined) {
    return formatDriverApplicationStatus(args.applicationStatus);
  }
  return "—";
}