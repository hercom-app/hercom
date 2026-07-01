import * as Location from "expo-location";
import { resolvePeruRegionFromGoogleComponents } from "@proyecto/backend/peruLocations";
import type { ReverseGeocodeResult } from "./googleGeocoding";

function buildAddressFromPlace(place: Location.LocationGeocodedAddress): string {
  const parts = [
    place.street,
    place.streetNumber,
    place.name,
    place.district,
    place.city,
    place.subregion,
    place.region,
  ].filter((part): part is string => part !== null && part.trim() !== "");

  const uniqueParts = [...new Set(parts)];
  return uniqueParts.length > 0 ? uniqueParts.join(", ") : "Ubicación actual";
}

/**
 * Geocodificación inversa nativa del dispositivo (sin Google API key).
 * Menos precisa que Google Maps pero suficiente para dept/provincia/distrito.
 */
export async function reverseGeocodeWithDevice(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  const places = await Location.reverseGeocodeAsync({
    latitude: lat,
    longitude: lng,
  });

  const place = places[0];
  if (place === undefined) {
    throw new Error("No se pudo obtener dirección desde el GPS del dispositivo.");
  }

  const districtCandidates = [place.city, place.district, place.name, place.subregion].filter(
    (value): value is string => value !== null && value.trim() !== "",
  );

  const region = resolvePeruRegionFromGoogleComponents({
    department: place.region ?? undefined,
    province: place.subregion ?? undefined,
    districtCandidates,
  });

  if (region === null) {
    throw new Error(
      "No se pudo clasificar departamento/provincia/distrito. Elige la región manualmente.",
    );
  }

  return {
    address: buildAddressFromPlace(place),
    lat,
    lng,
    department: region.department,
    ...(region.province !== undefined ? { province: region.province } : {}),
    ...(region.district !== undefined ? { district: region.district } : {}),
  };
}
