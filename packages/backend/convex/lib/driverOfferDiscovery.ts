import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { DRIVER_MAX_SERVICE_DISTANCE_KM } from "./geoDistance";
import { getMarketByCountry } from "./markets";

export const MIN_DRIVER_OFFER_RADIUS_KM = 1;

/**
 * Radio máximo chofer ↔ origen para descubrir/ofertar servicios.
 * Configurable por mercado (`markets.maxDriverOfferDistanceKm`); fallback 10 km.
 */
export async function resolveMaxDriverOfferDistanceKm(
  ctx: QueryCtx | MutationCtx,
  countryCode?: string,
): Promise<number> {
  const market = await getMarketByCountry(ctx, countryCode);
  const configured = market.maxDriverOfferDistanceKm;
  if (
    configured !== undefined &&
    Number.isFinite(configured) &&
    configured > 0
  ) {
    return configured;
  }
  return DRIVER_MAX_SERVICE_DISTANCE_KM;
}

/** Radio efectivo del chofer: su preferencia, acotada al máximo del mercado. */
export async function resolveDriverOfferRadiusKm(
  ctx: QueryCtx | MutationCtx,
  driver: Doc<"drivers">,
  countryCode?: string,
): Promise<{ radiusKm: number; marketMaxKm: number }> {
  const marketMaxKm = await resolveMaxDriverOfferDistanceKm(
    ctx,
    driver.countryCode ?? countryCode,
  );
  const preferred = driver.offerRadiusKm;
  const radiusKm =
    preferred !== undefined && Number.isFinite(preferred) && preferred > 0
      ? Math.min(Math.max(preferred, MIN_DRIVER_OFFER_RADIUS_KM), marketMaxKm)
      : marketMaxKm;
  return { radiusKm, marketMaxKm };
}
