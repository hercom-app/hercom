import { Linking, Platform } from "react-native";

type WazeLocation = {
  address: string;
  lat: number;
  lng: number;
};

function hasCoordinates(location: WazeLocation): boolean {
  return !(location.lat === 0 && location.lng === 0);
}

/**
 * Abre Waze hacia una parada.
 * Usa el enlace universal https (no waze://) para que Android deje Hercom
 * en segundo plano en lugar de matar el proceso — sobre todo en Expo Go.
 */
export async function openWazeNavigation(location: WazeLocation): Promise<void> {
  const navigate = "navigate=yes";
  const url = hasCoordinates(location)
    ? `https://waze.com/ul?ll=${location.lat},${location.lng}&${navigate}`
    : `https://waze.com/ul?q=${encodeURIComponent(location.address)}&${navigate}`;

  try {
    await Linking.openURL(url);
  } catch {
    // Último recurso: esquema nativo (puede sacar más fuerte a Expo Go).
    if (hasCoordinates(location) && Platform.OS !== "web") {
      await Linking.openURL(
        `waze://?ll=${location.lat},${location.lng}&${navigate}`,
      );
    }
  }
}

export function formatServiceStopsLabel(
  destination: WazeLocation,
  extraDestinations?: WazeLocation[],
): string {
  const stops = [
    destination.address,
    ...(extraDestinations ?? []).map((stop) => stop.address),
  ];
  if (stops.length === 1) {
    return stops[0]!;
  }
  return stops
    .map((address, index) => `${index + 1}. ${address}`)
    .join(" → ");
}
