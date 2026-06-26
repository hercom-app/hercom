/**
 * Tarifa mínima para crear un servicio de chofer de reemplazo.
 */
export const MIN_SERVICE_PRICE_PEN = 40;

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
 * Alias de compatibilidad con código existente.
 */
export const computeDriverCommission = computePlatformCommission;
