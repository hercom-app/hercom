import { requireGoogleMapsApiKey } from "./googleMapsConfig";

export type NearbyHealthPlace = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

type PlacesNearbyResponse = {
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
  }>;
  error?: { message?: string };
};

const SEARCH_NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby";
const SEARCH_TEXT_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.location";

function mapPlaces(
  places: PlacesNearbyResponse["places"],
): NearbyHealthPlace[] {
  const results: NearbyHealthPlace[] = [];
  for (const place of places ?? []) {
    if (
      place.id === undefined ||
      place.displayName?.text === undefined ||
      place.location?.latitude === undefined ||
      place.location.longitude === undefined
    ) {
      continue;
    }
    results.push({
      placeId: place.id,
      name: place.displayName.text,
      address: place.formattedAddress ?? place.displayName.text,
      lat: place.location.latitude,
      lng: place.location.longitude,
    });
  }
  return results;
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
      maxResultCount: 8,
      rankPreference: "DISTANCE",
      languageCode: "es",
      regionCode: "PE",
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 12_000,
        },
      },
    }),
  });

  if (!response.ok) {
    const data = (await response.json()) as PlacesNearbyResponse;
    throw new Error(
      data.error?.message ?? `Nearby Search falló (${response.status}).`,
    );
  }

  const data = (await response.json()) as PlacesNearbyResponse;
  return mapPlaces(data.places);
}

/** Complementa con clínicas / centros de salud por texto (Perú). */
async function searchTextClinics(
  lat: number,
  lng: number,
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
      textQuery: "clínica OR hospital OR centro de salud",
      languageCode: "es",
      regionCode: "PE",
      maxResultCount: 8,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 12_000,
        },
      },
    }),
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as PlacesNearbyResponse;
  return mapPlaces(data.places);
}

/**
 * Busca hospitales/clínicas cerca de lat/lng.
 * Combina Nearby (tipo hospital) + Text Search (clínica / centro de salud).
 */
export async function fetchNearbyHealthCenters(
  lat: number,
  lng: number,
): Promise<NearbyHealthPlace[]> {
  const [hospitals, clinics] = await Promise.all([
    searchNearbyHospitals(lat, lng),
    searchTextClinics(lat, lng),
  ]);

  const byId = new Map<string, NearbyHealthPlace>();
  for (const place of [...hospitals, ...clinics]) {
    if (!byId.has(place.placeId)) {
      byId.set(place.placeId, place);
    }
  }

  return Array.from(byId.values()).slice(0, 8);
}
