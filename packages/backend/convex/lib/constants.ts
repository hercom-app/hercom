/**
 * Tarifa horaria de referencia para servicio de chofer de reemplazo.
 */
export const HOURLY_SERVICE_RATE_PEN = 40;

/**
 * Contratación mínima del servicio (en horas).
 */
export const MIN_SERVICE_HOURS = 2;

/**
 * Tarifa base mínima para crear un servicio (= tarifa horaria × horas mínimas).
 */
export const MIN_SERVICE_PRICE_PEN =
  HOURLY_SERVICE_RATE_PEN * MIN_SERVICE_HOURS;

/**
 * Comisión de intermediación de plataforma.
 * Para demo: 25% del total acordado.
 */
export const PLATFORM_COMMISSION_RATE = 0.25;

/**
 * Límite mínimo de saldo permitido para chofer.
 * El chofer puede quedar como máximo en -10 y luego debe recargar.
 */
export const MIN_DRIVER_WALLET_BALANCE = -10;

/**
 * Calcula la comisión de plataforma a partir del precio total del servicio.
 * Redondea a 2 decimales para evitar errores de coma flotante.
 */
export function computePlatformCommission(totalPrice: number): number {
  return Math.round(totalPrice * PLATFORM_COMMISSION_RATE * 100) / 100;
}

/**
 * Adelanto que el cliente entrega al chofer antes de que salga (25% de la tarifa ofertada).
 */
export const CLIENT_ADVANCE_RATE = PLATFORM_COMMISSION_RATE;

/**
 * Tiempo máximo que una solicitud `pending` permanece abierta para ofertar.
 * Pasado ese lapso se cancela automáticamente.
 */
export const PENDING_SERVICE_TTL_MS = 2 * 60 * 60 * 1000;

export function computeClientAdvance(offeredPrice: number): number {
  return computePlatformCommission(offeredPrice);
}

/**
 * Descuento máximo de promoción festiva: 25%.
 * A ese tope Hercom deja de ganar (cliente paga lo mismo que el neto del chofer).
 */
export const MAX_PROMOTION_DISCOUNT_RATE = PLATFORM_COMMISSION_RATE;

/**
 * Alias de compatibilidad con código existente.
 */
export const computeDriverCommission = computePlatformCommission;
