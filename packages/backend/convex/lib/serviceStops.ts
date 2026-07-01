import type { Doc } from "../_generated/dataModel";

type ServiceLocation = Doc<"services">["destination"];

/** Paradas ordenadas: destino principal + destinos adicionales opcionales. */
export function getServiceStops(service: {
  destination: ServiceLocation;
  extraDestinations?: ServiceLocation[];
}): ServiceLocation[] {
  return [service.destination, ...(service.extraDestinations ?? [])];
}

export function getCurrentStop(
  service: {
    destination: ServiceLocation;
    extraDestinations?: ServiceLocation[];
    currentStopIndex?: number;
  },
): ServiceLocation {
  const stops = getServiceStops(service);
  const index = service.currentStopIndex ?? 0;
  return stops[Math.min(index, stops.length - 1)]!;
}
