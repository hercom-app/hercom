import { requireGoogleMapsApiKey } from "./googleMapsConfig";

export type NearbyHealthPlace = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  openNow: boolean | null;
};

export type NearbyHealthLists = {
  hospitals: NearbyHealthPlace[];
  clinics: NearbyHealthPlace[];
};

type PlaceRaw = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  currentOpeningHours?: { openNow?: boolean };
};

type PlacesResponse = {
  places?: PlaceRaw[];
  error?: { message?: string };
};

const SEARCH_NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby";
const SEARCH_TEXT_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.location,places.currentOpeningHours";

const RADIUS_M = 20_000;

/** Ruido que no sirve para emergencia. */
const NAME_BLOCKLIST = [
  /casa de reposo/i,
  /asilo/i,
  /residencia\s+geriatr/i,
  /puesto de salud/i,
  /posta\b/i,
  /carnet de sanidad/i,
  /gerencia de salud/i,
  /direcci[oó]n de salud/i,
  /laboratorio/i,
  /farmacia/i,
  /veterinar/i,
];

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function isBlockedName(name: string): boolean {
  return NAME_BLOCKLIST.some((re) => re.test(name));
}

function mapPlaces(
  places: PlaceRaw[] | undefined,
  originLat: number,
  originLng: number,
): NearbyHealthPlace[] {
  const results: NearbyHealthPlace[] = [];
  for (const place of places ?? []) {
    const name = place.displayName?.text;
    const lat = place.location?.latitude;
    const lng = place.location?.longitude;
    if (
      place.id === undefined ||
      name === undefined ||
      lat === undefined ||
      lng === undefined ||
      isBlockedName(name)
    ) {
      continue;
    }
    results.push({
      placeId: place.id,
      name,
      address: place.formattedAddress ?? name,
      lat,
      lng,
      distanceMeters: haversineMeters(originLat, originLng, lat, lng),
      openNow: place.currentOpeningHours?.openNow ?? null,
    });
  }
  return results;
}

function sortForEmergency(a: NearbyHealthPlace, b: NearbyHealthPlace): number {
  const openScore = (p: NearbyHealthPlace) =>
    p.openNow === true ? 0 : p.openNow === null ? 1 : 2;
  const byOpen = openScore(a) - openScore(b);
  if (byOpen !== 0) return byOpen;
  return a.distanceMeters - b.distanceMeters;
}

function dedupe(places: NearbyHealthPlace[]): NearbyHealthPlace[] {
  const byId = new Map<string, NearbyHealthPlace>();
  for (const place of places) {
    if (!byId.has(place.placeId)) {
      byId.set(place.placeId, place);
    }
  }
  return Array.from(byId.values()).sort(sortForEmergency);
}

async function searchNearbyHospitals(
  lat: number,
  lng: number,
): Promise<NearbyHealthPlace[]> {
  const apiKey = requireGoogleMapsApiKey();
  const response = await fetch(SEARCH_NEARBY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: ["hospital"],
      maxResultCount: 20,
      rankPreference: "DISTANCE",
      languageCode: "es",
      regionCode: "PE",
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: RADIUS_M,
        },
      },
    }),
  });

  if (!response.ok) {
    const data = (await response.json()) as PlacesResponse;
    throw new Error(
      data.error?.message ?? `Nearby Search falló (${response.status}).`,
    );
  }

  const data = (await response.json()) as PlacesResponse;
  return mapPlaces(data.places, lat, lng);
}

/** Misma idea que buscar “hospital” o “clínica” en Google Maps. */
async function searchTextKeyword(
  lat: number,
  lng: number,
  textQuery: string,
): Promise<NearbyHealthPlace[]> {
  const apiKey = requireGoogleMapsApiKey();
  const response = await fetch(SEARCH_TEXT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery,
      languageCode: "es",
      regionCode: "PE",
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: RADIUS_M,
        },
      },
    }),
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as PlacesResponse;
  return mapPlaces(data.places, lat, lng);
}

/**
 * Dos búsquedas estilo Maps: “hospital” y “clínica”.
 * Listas separadas para mostrar en la misma ventana.
 */
export async function fetchNearbyHealthCenters(
  lat: number,
  lng: number,
): Promise<NearbyHealthLists> {
  const [nearbyHospitals, textHospitals, textClinics] = await Promise.all([
    searchNearbyHospitals(lat, lng),
    searchTextKeyword(lat, lng, "hospital"),
    searchTextKeyword(lat, lng, "clínica"),
  ]);

  return {
    hospitals: dedupe([...nearbyHospitals, ...textHospitals]).slice(0, 7),
    clinics: dedupe(textClinics).slice(0, 7),
  };
}

export function formatDistanceKm(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
