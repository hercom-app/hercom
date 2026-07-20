import {
  matchDepartment,
  matchProvince,
  resolvePeruRegionFromGoogleComponents,
  type PeruRegionMatch,
} from "@proyecto/backend/peruLocations";
import {
  isGoogleMapsApiKeyConfigured,
  requireGoogleMapsApiKey,
} from "./googleMapsConfig";

type PlacesNewAddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

type PlacesNewAutocompleteSuggestion = {
  placePrediction?: {
    placeId?: string;
    text?: { text?: string };
    structuredFormat?: {
      mainText?: { text?: string };
      secondaryText?: { text?: string };
    };
  };
};

type PlacesNewAutocompleteResponse = {
  suggestions?: PlacesNewAutocompleteSuggestion[];
  error?: {
    message?: string;
    status?: string;
  };
};

type PlacesNewPlaceDetailsResponse = {
  id?: string;
  formattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  addressComponents?: PlacesNewAddressComponent[];
  error?: {
    message?: string;
    status?: string;
  };
};

export type PlaceSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText?: string;
};

export type SelectedPlace = {
  placeId: string;
  address: string;
  lat: number;
  lng: number;
  department?: string;
  province?: string;
  district?: string;
};

export type AddressRegionFilter = {
  department: string;
  province?: string;
  district?: string;
};

type LocationBias = {
  lat: number;
  lng: number;
  radiusMeters: number;
};

/** Radio seguro para Places API (New): máximo 50 km, usamos menos por margen. */
const DEFAULT_LOCATION_BIAS_RADIUS_METERS = 25_000;
const MAX_LOCATION_BIAS_RADIUS_METERS = 49_999;

const PLACES_AUTOCOMPLETE_URL =
  "https://places.googleapis.com/v1/places:autocomplete";

/** Centros aproximados para sesgar sugerencias cuando no hay GPS. */
const PROVINCE_BIAS_CENTERS: Record<string, { lat: number; lng: number }> = {
  "Lima|Lima": { lat: -12.0464, lng: -77.0428 },
  "Callao|Callao": { lat: -12.0561, lng: -77.1181 },
  "Arequipa|Arequipa": { lat: -16.409, lng: -71.5375 },
  "La Libertad|Trujillo": { lat: -8.1116, lng: -79.0288 },
  "Cusco|Cusco": { lat: -13.5319, lng: -71.9675 },
  "Lambayeque|Chiclayo": { lat: -6.7714, lng: -79.8409 },
  "Piura|Piura": { lat: -5.1783, lng: -80.6544 },
};

function getComponent(
  components: PlacesNewAddressComponent[],
  ...types: string[]
): string | undefined {
  for (const type of types) {
    const match = components.find((component) => component.types?.includes(type));
    if (match?.longText !== undefined) {
      return match.longText;
    }
  }
  return undefined;
}

function resolveRegionFromPlaceComponents(
  components: PlacesNewAddressComponent[],
): PeruRegionMatch {
  const department = getComponent(components, "administrative_area_level_1");
  const province = getComponent(components, "administrative_area_level_2");
  const districtCandidates = [
    getComponent(components, "locality"),
    getComponent(components, "administrative_area_level_3"),
    getComponent(components, "sublocality_level_1"),
    getComponent(components, "sublocality"),
    getComponent(components, "neighborhood"),
  ].filter((value): value is string => value !== undefined);

  const region = resolvePeruRegionFromGoogleComponents({
    department,
    province,
    districtCandidates,
  });

  if (region === null) {
    throw new Error(
      "La dirección seleccionada no pertenece a una región reconocida de Perú.",
    );
  }

  return region;
}

async function parsePlacesError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as PlacesNewAutocompleteResponse;
    return (
      data.error?.message ??
      `Google Places respondió con error (${response.status}).`
    );
  } catch {
    return `Google Places respondió con error (${response.status}).`;
  }
}

export function isGooglePlacesConfigured(): boolean {
  return isGoogleMapsApiKeyConfigured();
}

/** Centro por defecto (Lima) cuando aún no hay GPS ni región elegida. */
const DEFAULT_BIAS_CENTER = { lat: -12.0464, lng: -77.0428 };

function normalizeCircleRadiusMeters(radiusMeters?: number): number {
  if (radiusMeters === undefined || !Number.isFinite(radiusMeters) || radiusMeters <= 0) {
    return DEFAULT_LOCATION_BIAS_RADIUS_METERS;
  }
  return Math.min(MAX_LOCATION_BIAS_RADIUS_METERS, radiusMeters);
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function toPlacesLocationBias(bias: LocationBias): {
  circle: {
    center: { latitude: number; longitude: number };
    radius: number;
  };
} {
  return {
    circle: {
      center: {
        latitude: bias.lat,
        longitude: bias.lng,
      },
      radius: normalizeCircleRadiusMeters(bias.radiusMeters),
    },
  };
}

export function buildLocationBias(
  region: AddressRegionFilter,
  gps?: { lat: number; lng: number },
): LocationBias {
  const radiusMeters = DEFAULT_LOCATION_BIAS_RADIUS_METERS;

  if (gps !== undefined && isValidCoordinate(gps.lat, gps.lng)) {
    return {
      lat: gps.lat,
      lng: gps.lng,
      radiusMeters,
    };
  }

  if (
    region.department !== "" &&
    region.province !== undefined &&
    region.province !== ""
  ) {
    const center = PROVINCE_BIAS_CENTERS[`${region.department}|${region.province}`];
    if (center !== undefined) {
      return {
        lat: center.lat,
        lng: center.lng,
        radiusMeters,
      };
    }
  }

  return {
    lat: DEFAULT_BIAS_CENTER.lat,
    lng: DEFAULT_BIAS_CENTER.lng,
    radiusMeters,
  };
}

export function selectedPlaceMatchesRegion(
  place: SelectedPlace,
  region: AddressRegionFilter,
): boolean {
  if (region.department === "") {
    return place.department !== undefined;
  }

  const placeDepartment = matchDepartment(place.department);
  if (placeDepartment !== region.department) {
    return false;
  }

  if (region.province !== undefined && region.province !== "") {
    const placeProvince = matchProvince(region.department, place.province);
    if (placeProvince !== region.province) {
      return false;
    }
  }

  return true;
}

export function formatRegionScopeLabel(region: AddressRegionFilter): string {
  if (region.department === "") {
    return "tu zona (GPS)";
  }
  const parts = [region.department];
  if (region.province !== undefined && region.province !== "") {
    parts.push(`prov. ${region.province}`);
  }
  return parts.join(" · ");
}

export async function fetchPlaceSuggestions(
  input: string,
  options: {
    region: AddressRegionFilter;
    sessionToken: string;
    gpsCenter?: { lat: number; lng: number };
  },
): Promise<PlaceSuggestion[]> {
  const trimmed = input.trim();
  if (trimmed.length < 3) {
    return [];
  }

  const apiKey = requireGoogleMapsApiKey();
  const locationBias = buildLocationBias(options.region, options.gpsCenter);
  const body: Record<string, unknown> = {
    input: trimmed,
    includedRegionCodes: ["PE"],
    languageCode: "es",
    regionCode: "PE",
    sessionToken: options.sessionToken,
    locationBias: toPlacesLocationBias(locationBias),
  };

  const response = await fetch(PLACES_AUTOCOMPLETE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await parsePlacesError(response));
  }

  const data = (await response.json()) as PlacesNewAutocompleteResponse;
  const suggestions = data.suggestions ?? [];

  // Google ya restringe a Perú (includedRegionCodes) y sesga por GPS.
  // La validación fuerte de departamento/provincia ocurre al elegir (Place Details).
  return suggestions
    .map((suggestion): PlaceSuggestion | null => {
      const prediction = suggestion.placePrediction;
      if (prediction === undefined) {
        return null;
      }
      const placeId = prediction.placeId;
      const description = prediction.text?.text;
      if (placeId === undefined || description === undefined) {
        return null;
      }
      const item: PlaceSuggestion = {
        placeId,
        description,
        mainText:
          prediction.structuredFormat?.mainText?.text ?? description,
      };
      const secondaryText = prediction.structuredFormat?.secondaryText?.text;
      if (secondaryText !== undefined) {
        item.secondaryText = secondaryText;
      }
      return item;
    })
    .filter((item): item is PlaceSuggestion => item !== null);
}

export async function fetchPlaceDetails(
  placeId: string,
  sessionToken: string,
): Promise<SelectedPlace> {
  const apiKey = requireGoogleMapsApiKey();
  const params = new URLSearchParams({ sessionToken });
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?${params.toString()}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,formattedAddress,location,addressComponents",
      },
    },
  );

  if (!response.ok) {
    throw new Error(await parsePlacesError(response));
  }

  const data = (await response.json()) as PlacesNewPlaceDetailsResponse;
  if (
    data.formattedAddress === undefined ||
    data.location?.latitude === undefined ||
    data.location.longitude === undefined ||
    data.addressComponents === undefined
  ) {
    throw new Error(
      data.error?.message ?? "Google Places no devolvió el detalle del lugar.",
    );
  }

  const region = resolveRegionFromPlaceComponents(data.addressComponents);

  return {
    placeId,
    address: data.formattedAddress,
    lat: data.location.latitude,
    lng: data.location.longitude,
    ...(region.province !== undefined ? { province: region.province } : {}),
    ...(region.district !== undefined ? { district: region.district } : {}),
    department: region.department,
  };
}

export function createPlacesSessionToken(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
