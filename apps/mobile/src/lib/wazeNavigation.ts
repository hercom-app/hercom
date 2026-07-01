import { Linking } from "react-native";

type WazeLocation = {
  address: string;
  lat: number;
  lng: number;
};

function hasCoordinates(location: WazeLocation): boolean {
  return !(location.lat === 0 && location.lng === 0);
}

/**
 * Abre Waze hacia una parada. Usa coordenadas si existen; si no, busca por dirección.
 */
export async function openWazeNavigation(location: WazeLocation): Promise<void> {
  const navigateSuffix = "&navigate=yes";
  const wazeByCoords = `waze://?ll=${location.lat},${location.lng}${navigateSuffix}`;
  const webByCoords = `https://waze.com/ul?ll=${location.lat},${location.lng}${navigateSuffix}`;
  const webByAddress = `https://waze.com/ul?q=${encodeURIComponent(location.address)}${navigateSuffix}`;

  if (hasCoordinates(location)) {
    try {
      const canOpenWaze = await Linking.canOpenURL(wazeByCoords);
      await Linking.openURL(canOpenWaze ? wazeByCoords : webByCoords);
      return;
    } catch {
      await Linking.openURL(webByCoords);
      return;
    }
  }

  await Linking.openURL(webByAddress);
}

export function formatServiceStopsLabel(
  destination: WazeLocation,
  extraDestinations?: WazeLocation[],
): string {
  const stops = [destination.address, ...(extraDestinations ?? []).map((stop) => stop.address)];
  if (stops.length === 1) {
    return stops[0]!;
  }
  return stops
    .map((address, index) => `${index + 1}. ${address}`)
    .join(" → ");
}
