import { resolvePeruRegionFromGoogleComponents } from "@proyecto/backend/peruLocations";
import {
  isGoogleMapsApiKeyConfigured,
  requireGoogleMapsApiKey,
} from "./googleMapsConfig";

export { isGoogleMapsApiKeyConfigured } from "./googleMapsConfig";

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GoogleGeocodeResult = {
  formatted_address: string;
  address_components: GoogleAddressComponent[];
  types?: string[];
};

type GoogleGeocodeResponse = {
  status: string;
  results: GoogleGeocodeResult[];
  error_message?: string;
};

/** Open Location Code, p. ej. `C8X2+Q5`. No es un nombre de calle. */
const PLUS_CODE =
  /[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}/i;

export function looksLikePlusCode(value: string): boolean {
  const head = value.trim().split(",")[0]?.trim() ?? "";
  return PLUS_CODE.test(head) && !/[a-zñáéíóú]/i.test(head.replace(PLUS_CODE, ""));
}

/**
 * Quita el Plus Code y el país final.
 * «C8X2+Q5, Calle Berlín, Miraflores, Peru» → «Calle Berlín, Miraflores».
 */
export function toPeopleAddress(formatted: string): string {
  let text = formatted.replace(
    /[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}/gi,
    " ",
  );
  text = text.replace(/,?\s*(Perú|Peru)\s*$/i, "");
  text = text
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,]+|[\s,]+$/g, "")
    .trim();
  return text.length >= 3 ? text : formatted.trim();
}

function addressFromComponents(components: GoogleAddressComponent[]): string {
  const route = getComponent(components, "route");
  const streetNumber = getComponent(components, "street_number");
  const premise = getComponent(components, "premise");
  const neighborhood =
    getComponent(components, "neighborhood") ??
    getComponent(components, "sublocality_level_1") ??
    getComponent(components, "sublocality");
  const district =
    getComponent(components, "locality") ??
    getComponent(components, "administrative_area_level_3");
  const province = getComponent(components, "administrative_area_level_2");

  const parts: string[] = [];
  if (route !== undefined && !looksLikePlusCode(route)) {
    parts.push(
      streetNumber !== undefined && !looksLikePlusCode(streetNumber)
        ? `${route} ${streetNumber}`
        : route,
    );
  } else if (premise !== undefined && !looksLikePlusCode(premise)) {
    parts.push(premise);
  }
  if (
    neighborhood !== undefined &&
    neighborhood !== district &&
    !looksLikePlusCode(neighborhood) &&
    !parts.includes(neighborhood)
  ) {
    parts.push(neighborhood);
  }
  if (
    district !== undefined &&
    !looksLikePlusCode(district) &&
    !parts.includes(district)
  ) {
    parts.push(district);
  }
  if (parts.length === 0 && province !== undefined && !looksLikePlusCode(province)) {
    parts.push(province);
  }
  return parts.join(", ");
}

function addressScore(result: GoogleGeocodeResult): number {
  const types = result.types ?? [];
  const components = result.address_components;
  let score = 0;
  if (getComponent(components, "route") !== undefined) score += 80;
  if (getComponent(components, "street_number") !== undefined) score += 20;
  if (getComponent(components, "premise") !== undefined) score += 15;
  if (types.includes("street_address")) score += 30;
  if (types.includes("route")) score += 20;
  if (types.includes("establishment") || types.includes("point_of_interest")) {
    score += 25;
  }
  if (
    types.includes("neighborhood") ||
    types.includes("sublocality") ||
    types.includes("sublocality_level_1")
  ) {
    score += 8;
  }
  if (PLUS_CODE.test(result.formatted_address) || types.includes("plus_code")) {
    score -= 40;
  }
  return score;
}

function readableAddress(result: GoogleGeocodeResult): string {
  const fromParts = addressFromComponents(result.address_components);
  const tidy = toPeopleAddress(result.formatted_address);
  const formattedIsCode = looksLikePlusCode(result.formatted_address);
  if (!formattedIsCode && tidy.length >= 3 && !looksLikePlusCode(tidy)) {
    return tidy;
  }
  if (fromParts.length >= 3) {
    return fromParts;
  }
  if (tidy.length >= 3 && !looksLikePlusCode(tidy)) {
    return tidy;
  }
  return fromParts.length >= 3 ? fromParts : tidy;
}

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

  const matches: Array<{
    result: GoogleGeocodeResult;
    region: NonNullable<ReturnType<typeof resolvePeruRegionFromGoogleComponents>>;
  }> = [];
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
      matches.push({ result, region });
    }
  }

  matches.sort((left, right) => addressScore(right.result) - addressScore(left.result));
  const best = matches[0];
  if (best !== undefined) {
    const address = readableAddress(best.result);
    return {
      address: address.trim() !== "" ? address : toPeopleAddress(best.result.formatted_address),
      lat,
      lng,
      department: best.region.department,
      ...(best.region.province !== undefined ? { province: best.region.province } : {}),
      ...(best.region.district !== undefined ? { district: best.region.district } : {}),
    };
  }

  throw new Error(
    "No se pudo clasificar departamento/provincia/distrito para Perú.",
  );
}
