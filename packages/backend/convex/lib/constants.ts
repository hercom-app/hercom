/**
 * Porcentaje de la tarifa total que corresponde al chofer como comisión.
 * Ajustable; en el futuro podría moverse a una tabla de configuración.
 */
export const COMMISSION_RATE = 0.2;

/**
 * Calcula la comisión del chofer a partir del precio total del servicio.
 * Redondea a 2 decimales para evitar errores de coma flotante.
 */
export function computeDriverCommission(totalPrice: number): number {
  return Math.round(totalPrice * COMMISSION_RATE * 100) / 100;
}
