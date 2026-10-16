/** Respuestas Factiliza usan `status: 200` + "Exito!" sin `success: true` en licencia. */
export type FactilizaEnvelope = {
  status?: number;
  success?: boolean;
  message?: string;
  data?: unknown;
};

export function isFactilizaSuccess(
  httpStatus: number,
  payload: FactilizaEnvelope,
): boolean {
  if (payload.data === undefined || payload.data === null) {
    return false;
  }
  const code = payload.status ?? httpStatus;
  if (code >= 200 && code < 300) {
    return true;
  }
  if (payload.success === true) {
    return true;
  }
  const message = payload.message?.trim() ?? "";
  if (/^exito!?\.?$/i.test(message)) {
    return true;
  }
  return false;
}
