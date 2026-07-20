import { Linking, Platform } from "react-native";
import * as Location from "expo-location";
import { reverseGeocodeWithDevice } from "./deviceGeocoding";
import {
  isGoogleMapsApiKeyConfigured,
  reverseGeocodeWithGoogle,
  type ReverseGeocodeResult,
} from "./googleGeocoding";

export type PickupLocationResult = ReverseGeocodeResult;

export type LocationAccessStatus = {
  permissionGranted: boolean;
  servicesEnabled: boolean;
};

async function reverseGeocodePickup(
  lat: number,
  lng: number,
): Promise<PickupLocationResult> {
  if (isGoogleMapsApiKeyConfigured()) {
    try {
      return await reverseGeocodeWithGoogle(lat, lng);
    } catch {
      // Si Google falla, intentamos geocoder nativo del dispositivo.
    }
  }
  return reverseGeocodeWithDevice(lat, lng);
}

export async function getLocationAccessStatus(): Promise<LocationAccessStatus> {
  const permission = await Location.getForegroundPermissionsAsync();
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  return {
    permissionGranted: permission.status === "granted",
    servicesEnabled,
  };
}

/**
 * Pide permiso de ubicación en primer plano (diálogo nativo del sistema).
 * Si el usuario denegó antes, indica abrir Ajustes.
 */
export async function ensureLocationAccess(): Promise<void> {
  const current = await Location.getForegroundPermissionsAsync();

  if (current.status === "undetermined") {
    const requested = await Location.requestForegroundPermissionsAsync();
    if (requested.status !== "granted") {
      throw new Error(
        "Necesitamos permiso de ubicación. Acepta el permiso cuando el celular lo solicite.",
      );
    }
  } else if (current.status === "denied") {
    throw new Error(
      Platform.OS === "ios"
        ? "Ubicación bloqueada. Ve a Ajustes → Expo Go → Ubicación y elige «Al usar la app»."
        : "Ubicación bloqueada. Ve a Ajustes → Apps → Expo Go → Permisos → Ubicación → Permitir.",
    );
  } else if (current.status !== "granted") {
    const requested = await Location.requestForegroundPermissionsAsync();
    if (requested.status !== "granted") {
      throw new Error("Permiso de ubicación no concedido.");
    }
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new Error(
      "Activa el GPS del celular (ubicación) en los ajustes rápidos o en Ajustes → Ubicación.",
    );
  }
}

export async function openDeviceLocationSettings(): Promise<void> {
  await Linking.openSettings();
}

export async function detectPickupLocation(): Promise<PickupLocationResult> {
  await ensureLocationAccess();

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const result = await reverseGeocodePickup(
    position.coords.latitude,
    position.coords.longitude,
  );

  return {
    ...result,
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };
}

export function formatDetectedRegion(result: PickupLocationResult): string {
  const parts = [result.department];
  if (result.province !== undefined) {
    parts.push(result.province);
  }
  if (result.district !== undefined) {
    parts.push(result.district);
  }
  return parts.join(" · ");
}

export function applyPickupLocationResult(
  result: PickupLocationResult,
  setters: {
    setOrigin: (value: string) => void;
    setOriginLat: (value: number) => void;
    setOriginLng: (value: number) => void;
    setDepartment: (value: string) => void;
    setProvince: (value: string) => void;
    setDistrict: (value: string) => void;
    setDetectedRegionLabel: (value: string) => void;
  },
): void {
  setters.setOrigin(result.address);
  setters.setOriginLat(result.lat);
  setters.setOriginLng(result.lng);
  setters.setDepartment(result.department);
  setters.setProvince(result.province ?? "");
  setters.setDistrict(result.district ?? "");
  setters.setDetectedRegionLabel(formatDetectedRegion(result));
}
