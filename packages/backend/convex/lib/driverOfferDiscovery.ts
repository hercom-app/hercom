import type { MutationCtx, QueryCtx } from "../_generated/server";
import { DRIVER_MAX_SERVICE_DISTANCE_KM } from "./geoDistance";
import { getMarketByCountry } from "./markets";

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
