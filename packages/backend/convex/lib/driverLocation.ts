import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  DRIVER_LOCATION_MAX_AGE_MS,
  isValidGeoPoint,
} from "./geoDistance";

export async function persistDriverLocation(
  ctx: MutationCtx,
  driverId: Doc<"drivers">["_id"],
  lat: number,
  lng: number,
): Promise<void> {
  if (!isValidGeoPoint(lat, lng)) {
    throw new Error("Ubicación GPS no válida.");
  }
  await ctx.db.patch(driverId, {
    lastLat: lat,
    lastLng: lng,
    lastLocationAt: Date.now(),
  });
}

export function resolveDriverLocationForOffers(
  driver: Doc<"drivers">,
  argsLat?: number,
  argsLng?: number,
): { lat: number; lng: number } | null {
  if (
    argsLat !== undefined &&
    argsLng !== undefined &&
    isValidGeoPoint(argsLat, argsLng)
  ) {
    return { lat: argsLat, lng: argsLng };
  }
  if (
    driver.lastLat !== undefined &&
    driver.lastLng !== undefined &&
    driver.lastLocationAt !== undefined &&
    Date.now() - driver.lastLocationAt <= DRIVER_LOCATION_MAX_AGE_MS &&
    isValidGeoPoint(driver.lastLat, driver.lastLng)
  ) {
    return { lat: driver.lastLat, lng: driver.lastLng };
  }
  return null;
}
