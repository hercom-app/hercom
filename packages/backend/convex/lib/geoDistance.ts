/** Radio máximo chofer ↔ origen del servicio para ofertar o tomar solicitud. */
export const DRIVER_MAX_SERVICE_DISTANCE_KM = 10;

/** Ubicación del chofer válida para ofertar (ms). */
export const DRIVER_LOCATION_MAX_AGE_MS = 15 * 60 * 1000;

export function haversineDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function isValidGeoPoint(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

export function isWithinDriverServiceRadius(
  driver: { lat: number; lng: number },
  origin: { lat: number; lng: number },
  maxKm = DRIVER_MAX_SERVICE_DISTANCE_KM,
): boolean {
  if (!isValidGeoPoint(driver.lat, driver.lng)) {
    return false;
  }
  if (!isValidGeoPoint(origin.lat, origin.lng)) {
    return false;
  }
  return haversineDistanceKm(driver, origin) <= maxKm;
}

/** Sin API de rutas: factor calle/línea recta y velocidad media urbana (Lima). */
const ROAD_DISTANCE_FACTOR = 1.3;
const URBAN_AVG_SPEED_KMH = 22;

/** Distancia por calle y minutos estimados recorriendo los puntos en orden. */
export function estimateRoadLeg(
  points: { lat: number; lng: number }[],
): { km: number; minutes: number } {
  let straightKm = 0;
  for (let index = 1; index < points.length; index += 1) {
    straightKm += haversineDistanceKm(points[index - 1]!, points[index]!);
  }
  const km = Math.round(straightKm * ROAD_DISTANCE_FACTOR * 10) / 10;
  const minutes = Math.max(1, Math.round((km / URBAN_AVG_SPEED_KMH) * 60));
  return { km, minutes };
}

export function formatDistanceKm(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}
