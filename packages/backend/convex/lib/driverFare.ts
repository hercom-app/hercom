import {
  MAX_PROMOTION_DISCOUNT_RATE,
  PLATFORM_COMMISSION_RATE,
} from "./constants";

export type DriverFareQuote = {
  /** Lo que oferta el chofer. */
  offer: number;
  /** Lo que el cliente le paga al chofer. */
  clientPays: number;
  /** Comisión real que Hercom le cobra en este viaje. */
  commission: number;
  /** Comisión si el viaje no tuviera descuento. */
  fullCommission: number;
  /** Lo que le queda al chofer: lo que le paga el cliente menos la comisión. */
  net: number;
  discountRate: number;
  discounted: boolean;
};

function money(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Reparte una oferta. Con descuento el cliente paga menos, Hercom cobra menos
 * y el chofer se queda con el mismo neto (lista × (1 − comisión)).
 *
 * Lista S/80, comisión 25%, descuento 15%:
 * cliente S/68, comisión S/8 (no S/20), chofer S/60.
 */
export function quoteDriverFare(
  offer: number,
  discountRate?: number,
  commissionRate: number = PLATFORM_COMMISSION_RATE,
): DriverFareQuote {
  const list = money(Math.max(offer, 0));
  const commission = Math.min(Math.max(commissionRate, 0), 1);
  const rate = Math.min(
    Math.max(discountRate ?? 0, 0),
    MAX_PROMOTION_DISCOUNT_RATE,
    commission,
  );
  const net = money(list * (1 - commission));
  const clientPays = rate > 0 ? money(list * (1 - rate)) : list;
  const realCommission =
    rate > 0 ? money(Math.max(clientPays - net, 0)) : money(list * commission);
  return {
    offer: list,
    clientPays,
    commission: realCommission,
    fullCommission: money(Math.max(list - net, 0)),
    net,
    discountRate: rate,
    discounted: rate > 0 && clientPays < list,
  };
}

/** Números ya guardados en el servicio, para ingresos y el viaje en curso. */
export function driverFacingTripMoney(service: {
  offeredPrice?: number;
  catalogBasePrice?: number;
  basePrice?: number;
  totalPrice: number;
  driverCommission: number;
  discountRate?: number;
}): DriverFareQuote {
  const offer = money(
    service.offeredPrice ??
      service.catalogBasePrice ??
      service.basePrice ??
      service.totalPrice,
  );
  const clientPays = money(service.totalPrice);
  const commission = money(Math.max(service.driverCommission, 0));
  const net = money(Math.max(clientPays - commission, 0));
  const rate = Math.max(service.discountRate ?? 0, 0);
  const discounted = rate > 0 && clientPays + 0.009 < offer;
  return {
    offer,
    clientPays,
    commission,
    fullCommission: money(Math.max(offer - net, 0)),
    net,
    discountRate: rate,
    discounted,
  };
}
