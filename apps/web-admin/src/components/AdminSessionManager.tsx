import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  ADMIN_ACTIVITY_STORAGE_KEY,
  ADMIN_SESSION_ABSOLUTE_MS,
  ADMIN_SESSION_IDLE_MS,
  ADMIN_SESSION_WARN_MS,
  ADMIN_TIMEOUT_REASON_KEY,
  clearAdminSessionMarkers,
  markAdminSessionActivity,
  readAdminLastActivity,
  readAdminSessionStart,
  touchAdminSessionStart,
  type AdminSessionTimeoutReason,
} from "../lib/adminSessionPolicy";
import { btnPrimaryClass, btnSecondaryClass } from "../lib/adminUi";

const CHECK_INTERVAL_MS = 15_000;
const MOUSEMOVE_THROTTLE_MS = 30_000;

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function AdminSessionManager({ children }: { children: ReactNode }) {
  const { signOut } = useAuthActions();
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const signingOutRef = useRef(false);
  const lastMouseActivityRef = useRef(0);

  const performTimedSignOut = useCallback(
    async (reason: AdminSessionTimeoutReason) => {
      if (signingOutRef.current) {
        return;
      }
      signingOutRef.current = true;
      setWarningOpen(false);
      sessionStorage.setItem(ADMIN_TIMEOUT_REASON_KEY, reason);
      clearAdminSessionMarkers();
      try {
        await signOut();
      } catch {
        // Marcadores locales ya limpiados; el login forzará nueva auth.
      }
    },
    [signOut],
  );

  const evaluateSession = useCallback(() => {
    const now = Date.now();
    const lastActivity = readAdminLastActivity(now);
    const sessionStart = readAdminSessionStart(now);
    const idleRemaining = lastActivity + ADMIN_SESSION_IDLE_MS - now;
    const absoluteRemaining = sessionStart + ADMIN_SESSION_ABSOLUTE_MS - now;

    if (absoluteRemaining <= 0) {
      void performTimedSignOut("absolute");
      return;
    }

    if (idleRemaining <= 0) {
      void performTimedSignOut("idle");
      return;
    }

    if (idleRemaining <= ADMIN_SESSION_WARN_MS) {
      setWarningOpen(true);
      setSecondsLeft(Math.max(1, Math.ceil(idleRemaining / 1000)));
    } else {
      setWarningOpen(false);
    }
  }, [performTimedSignOut]);

  const extendSession = useCallback(() => {
    markAdminSessionActivity();
    setWarningOpen(false);
    evaluateSession();
  }, [evaluateSession]);

  useEffect(() => {
    touchAdminSessionStart();
    markAdminSessionActivity();

    const onActivity = () => {
      markAdminSessionActivity();
      evaluateSession();
    };

    const onMouseMove = () => {
      const now = Date.now();
      if (now - lastMouseActivityRef.current < MOUSEMOVE_THROTTLE_MS) {
        return;
      }
      lastMouseActivityRef.current = now;
      onActivity();
    };

    const activityEvents = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    for (const eventName of activityEvents) {
      window.addEventListener(eventName, onActivity, { passive: true });
    }
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    const onStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_ACTIVITY_STORAGE_KEY) {
        evaluateSession();
      }
    };
    window.addEventListener("storage", onStorage);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        evaluateSession();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const intervalId = window.setInterval(evaluateSession, CHECK_INTERVAL_MS);
    evaluateSession();

    return () => {
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, onActivity);
      }
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(intervalId);
    };
  }, [evaluateSession]);

  useEffect(() => {
    if (!warningOpen) {
      return;
    }

    const tick = () => {
      const now = Date.now();
      const idleRemaining = readAdminLastActivity(now) + ADMIN_SESSION_IDLE_MS - now;
      if (idleRemaining <= 0) {
        void performTimedSignOut("idle");
        return;
      }
      setSecondsLeft(Math.max(1, Math.ceil(idleRemaining / 1000)));
    };

    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [warningOpen, performTimedSignOut]);

  return (
    <>
      {children}
      {warningOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-session-timeout-title"
            aria-describedby="admin-session-timeout-desc"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-panel"
          >
            <h2
              id="admin-session-timeout-title"
              className="text-lg font-semibold text-slate-900"
            >
              Sesión por expirar
            </h2>
            <p
              id="admin-session-timeout-desc"
              className="mt-2 text-sm leading-relaxed text-slate-600"
            >
              Por seguridad, el panel cerrará tu sesión tras{" "}
              <span className="font-semibold text-slate-900">30 minutos</span> sin
              actividad. Tiempo restante:{" "}
              <span className="font-mono font-semibold text-hercom-dark">
                {formatCountdown(secondsLeft)}
              </span>
              .
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className={`${btnSecondaryClass} w-full sm:w-auto`}
                onClick={() => void performTimedSignOut("idle")}
              >
                Cerrar sesión ahora
              </button>
              <button
                type="button"
                className={`${btnPrimaryClass} w-full sm:w-auto`}
                onClick={extendSession}
              >
                Continuar sesión
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}