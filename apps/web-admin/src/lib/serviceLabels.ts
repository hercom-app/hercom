import type { Doc } from "@proyecto/backend/dataModel";

export const SERVICE_TYPE_LABELS: Record<
  NonNullable<Doc<"services">["serviceType"]>,
  { label: string; badgeClass: string }
> = {
  app: { label: "App", badgeClass: "bg-sky-100 text-sky-800" },
  premium: { label: "Premium", badgeClass: "bg-violet-100 text-violet-800" },
};

export const REQUEST_CHANNEL_LABELS: Record<
  NonNullable<Doc<"services">["requestChannel"]>,
  string
> = {
  mobile_app: "App móvil",
  web_comercial: "Web comercial",
  phone: "Teléfono",
};

export function getServiceTypeMeta(service: Doc<"services">) {
  const serviceType = service.serviceType ?? "app";
  return SERVICE_TYPE_LABELS[serviceType];
}

export function getRequestChannelLabel(service: Doc<"services">): string {
  const channel = service.requestChannel ?? "mobile_app";
  return REQUEST_CHANNEL_LABELS[channel];
}
