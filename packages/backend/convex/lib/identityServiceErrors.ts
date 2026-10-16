/** API caída, sin suscripción o sin credenciales — habilita ingreso manual en app. */
export class IdentityServiceUnavailableError extends Error {
  constructor(
    message = "Servicio de RENIEC no disponible, ingrese sus datos manualmente.",
  ) {
    super(message);
    this.name = "IdentityServiceUnavailableError";
  }
}

/** @deprecated alias usado en reniec.ts */
export const ReniecServiceUnavailableError = IdentityServiceUnavailableError;

/** Cupo mensual de Factiliza agotado — usar VerificaPE como respaldo. */
export class FactilizaQuotaExceededError extends Error {
  constructor(message = "Consultas Factiliza agotadas para este mes.") {
    super(message);
    this.name = "FactilizaQuotaExceededError";
  }
}

export function isIdentityServiceUnavailableStatus(status: number): boolean {
  return (
    status === 401 ||
    status === 402 ||
    status === 403 ||
    status === 429 ||
    status >= 500
  );
}

export function isFactilizaQuotaMessage(body: string): boolean {
  return /l[ií]mite|tope|quota|agotad|exced|alcanz|sin consultas|no tiene consultas|plan/i.test(
    body,
  );
}
