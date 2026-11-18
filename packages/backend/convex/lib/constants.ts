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
 * Comisión de Hercom sobre lo que gana el chofer en el viaje.
 * Defecto: 25%. Un distrito puede fijar otro porcentaje.
 */
export const PLATFORM_COMMISSION_RATE = 0.25;

/**
 * Piso de saldo del chofer. Puede quedar en -15; por debajo no se le asigna otro viaje.
 */
export const MIN_DRIVER_WALLET_BALANCE = -15;

/**
 * Comisión de plataforma sobre la ganancia del chofer (tarifa del viaje).
 * Redondea a 2 decimales.
 */
export function computePlatformCommission(
  driverEarnings: number,
  commissionRate: number = PLATFORM_COMMISSION_RATE,
): number {
  return Math.round(driverEarnings * commissionRate * 100) / 100;
}

/**
 * Adelanto que el cliente entrega al chofer antes de que salga (25% de la tarifa ofertada).
 * No es la comisión de Hercom.
 */
export const CLIENT_ADVANCE_RATE = 0.25;

/**
 * Tiempo máximo que una solicitud `pending` permanece abierta para ofertar.
 * Pasado ese lapso se cancela automáticamente.
 */
export const PENDING_SERVICE_TTL_MS = 2 * 60 * 60 * 1000;

export function computeClientAdvance(offeredPrice: number): number {
  return Math.round(offeredPrice * CLIENT_ADVANCE_RATE * 100) / 100;
}

/**
 * Descuento máximo de promoción festiva: 25%.
 * A ese tope Hercom deja de ganar (el cliente paga lo mismo que el neto del chofer).
 */
export const MAX_PROMOTION_DISCOUNT_RATE = PLATFORM_COMMISSION_RATE;

/**
 * Alias de compatibilidad con código existente.
 */
export const computeDriverCommission = computePlatformCommission;
