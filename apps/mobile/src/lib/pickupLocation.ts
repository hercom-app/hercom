import * as Location from "expo-location";
import { reverseGeocodeWithDevice } from "./deviceGeocoding";
import {
  isGoogleMapsApiKeyConfigured,
  reverseGeocodeWithGoogle,
  type ReverseGeocodeResult,
} from "./googleGeocoding";

export type PickupLocationResult = ReverseGeocodeResult;

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

export async function detectPickupLocation(): Promise<PickupLocationResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error(
      "Activa el permiso de ubicación para detectar tu departamento, provincia y distrito.",
    );
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new Error("Activa el GPS del dispositivo e intenta de nuevo.");
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return reverseGeocodePickup(
    position.coords.latitude,
    position.coords.longitude,
  );
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
