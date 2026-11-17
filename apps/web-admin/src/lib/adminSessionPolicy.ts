/**
 * Política de sesión del panel administrativo (referencia: OWASP ASVS 3.3,
 * NIST SP 800-63B — consolas con datos operativos).
 *
 * - Inactividad: cierre tras 30 min sin interacción.
 * - Aviso: 2 min antes del cierre por inactividad.
 * - Duración máxima: 12 h desde el inicio de sesión (un turno).
 */

export const ADMIN_SESSION_IDLE_MS = 30 * 60 * 1000;
export const ADMIN_SESSION_WARN_MS = 2 * 60 * 1000;
export const ADMIN_SESSION_ABSOLUTE_MS = 12 * 60 * 60 * 1000;

export const ADMIN_ACTIVITY_STORAGE_KEY = "hercom-admin-last-activity";
export const ADMIN_SESSION_START_KEY = "hercom-admin-session-start";
export const ADMIN_TIMEOUT_REASON_KEY = "hercom-admin-timeout-reason";

export type AdminSessionTimeoutReason = "idle" | "absolute";

export function touchAdminSessionStart(now = Date.now()): number {
  const existing = sessionStorage.getItem(ADMIN_SESSION_START_KEY);
  if (existing !== null && existing !== "") {
    const parsed = Number(existing);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  sessionStorage.setItem(ADMIN_SESSION_START_KEY, String(now));
  return now;
}

export function markAdminSessionActivity(now = Date.now()) {
  localStorage.setItem(ADMIN_ACTIVITY_STORAGE_KEY, String(now));
}

export function readAdminLastActivity(fallback = Date.now()): number {
  const raw = localStorage.getItem(ADMIN_ACTIVITY_STORAGE_KEY);
  if (raw === null || raw === "") {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function readAdminSessionStart(fallback = Date.now()): number {
  const raw = sessionStorage.getItem(ADMIN_SESSION_START_KEY);
  if (raw === null || raw === "") {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function clearAdminSessionMarkers() {
  sessionStorage.removeItem(ADMIN_SESSION_START_KEY);
  localStorage.removeItem(ADMIN_ACTIVITY_STORAGE_KEY);
}

export function adminSessionTimeoutMessage(
  reason: AdminSessionTimeoutReason,
): string {
  if (reason === "idle") {
    return "Tu sesión se cerró por inactividad (30 minutos). Vuelve a iniciar sesión.";
  }
  return "Tu sesión alcanzó el límite máximo de 12 horas. Vuelve a iniciar sesión.";
}