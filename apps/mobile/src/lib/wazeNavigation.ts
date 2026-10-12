import { Linking, Platform } from "react-native";

export type WazeLocation = {
  address: string;
  lat: number;
  lng: number;
};

function isValidCoordinate(value: number): boolean {
  return Number.isFinite(value);
}

/** Coordenadas usables para Waze (evita 0,0 y valores inválidos). */
export function hasReliableCoordinates(location: WazeLocation): boolean {
  if (!isValidCoordinate(location.lat) || !isValidCoordinate(location.lng)) {
    return false;
  }
  if (location.lat === 0 && location.lng === 0) {
    return false;
  }
  if (Math.abs(location.lat) > 90 || Math.abs(location.lng) > 180) {
    return false;
  }
  return true;
}

function buildWazeUniversalUrl(location: WazeLocation): string {
  const params = new URLSearchParams();
  if (hasReliableCoordinates(location)) {
    params.set("ll", `${location.lat},${location.lng}`);
  }
  const address = location.address.trim();
  if (address !== "") {
    params.set("q", address);
  }
  params.set("navigate", "yes");
  return `https://waze.com/ul?${params.toString()}`;
}

function buildWazeNativeUrl(location: WazeLocation): string | null {
  if (!hasReliableCoordinates(location)) {
    return null;
  }
  return `waze://?ll=${location.lat},${location.lng}&navigate=yes`;
}

/**
 * Abre Waze con navegación hacia la parada.
 * En build nativo (EAS) prioriza `waze://` para forzar ruta; fallback https universal.
 */
export async function openWazeNavigation(location: WazeLocation): Promise<void> {
  const universal = buildWazeUniversalUrl(location);
  const native = buildWazeNativeUrl(location);

  if (Platform.OS !== "web" && native !== null) {
    try {
      const canOpenNative = await Linking.canOpenURL(native);
      if (canOpenNative) {
        await Linking.openURL(native);
        return;
      }
    } catch {
      /* fallback https */
    }
  }

  try {
    await Linking.openURL(universal);
  } catch {
    if (native !== null && Platform.OS !== "web") {
      await Linking.openURL(native);
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
