import { resolvePeruRegionFromGoogleComponents } from "@proyecto/backend/peruLocations";

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GoogleGeocodeResponse = {
  status: string;
  results: Array<{
    formatted_address: string;
    address_components: GoogleAddressComponent[];
  }>;
  error_message?: string;
};

function getComponent(
  components: GoogleAddressComponent[],
  ...types: string[]
): string | undefined {
  for (const type of types) {
    const match = components.find((component) => component.types.includes(type));
    if (match !== undefined) {
      return match.long_name;
    }
  }
  return undefined;
}

function getGoogleMapsApiKey(): string | undefined {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (apiKey === undefined || apiKey.trim() === "") {
    return undefined;
  }
  return apiKey.trim();
}

export function isGoogleMapsApiKeyConfigured(): boolean {
  return getGoogleMapsApiKey() !== undefined;
}

function requireGoogleMapsApiKey(): string {
  const apiKey = getGoogleMapsApiKey();
  if (apiKey === undefined) {
    throw new Error(
      "Falta EXPO_PUBLIC_GOOGLE_MAPS_API_KEY. Configúrala en apps/mobile/.env (Geocoding API).",
    );
  }
  return apiKey;
}

export type ReverseGeocodeResult = {
  address: string;
  lat: number;
  lng: number;
  department: string;
  province?: string;
  district?: string;
};

/**
 * Geocodificación inversa con Google Maps Geocoding API.
 * @see https://developers.google.com/maps/documentation/geocoding/requests-reverse-geocoding
 */
export async function reverseGeocodeWithGoogle(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  const apiKey = requireGoogleMapsApiKey();
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}` +
    `&key=${encodeURIComponent(apiKey)}&language=es&region=pe`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("No se pudo contactar a Google Maps Geocoding.");
  }

  const data = (await response.json()) as GoogleGeocodeResponse;
  if (data.status !== "OK" || data.results.length === 0) {
    throw new Error(
      data.error_message ??
        "Google Maps no encontró dirección para esta ubicación.",
    );
  }

  for (const result of data.results) {
    const components = result.address_components;
    const department = getComponent(
      components,
      "administrative_area_level_1",
    );
    const province = getComponent(
      components,
      "administrative_area_level_2",
    );
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

    if (region !== null) {
      return {
        address: result.formatted_address,
        lat,
        lng,
        department: region.department,
        ...(region.province !== undefined ? { province: region.province } : {}),
        ...(region.district !== undefined ? { district: region.district } : {}),
      };
    }
  }

  throw new Error(
    "No se pudo clasificar departamento/provincia/distrito para Perú.",
  );
}
