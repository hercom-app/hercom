import { useEffect } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import {
  reportUncleanExitIfNeeded,
  setAppErrorFlush,
  setAppErrorScreen,
} from "../lib/appErrorReporter";

/**
 * Enlaza la cola local de errores con Convex y etiqueta al usuario
 * autenticado. Debe vivir dentro de ConvexAuthProvider.
 */
export function AppErrorBridge() {
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.getMe, isAuthenticated ? {} : "skip");
  const report = useMutation(api.appErrors.report);

  useEffect(() => {
    if (me === undefined) {
      setAppErrorScreen(isAuthenticated ? "app" : "login");
      return;
    }
    if (me === null) {
      setAppErrorScreen("login");
      return;
    }
    setAppErrorScreen(me.role === "driver" ? "driver" : "client");
  }, [isAuthenticated, me]);

  useEffect(() => {
    setAppErrorFlush(async (payload) => {
      await report({
        deviceId: payload.deviceId,
        kind: payload.kind,
        message: payload.message,
        ...(payload.stack !== undefined ? { stack: payload.stack } : {}),
        ...(payload.screen !== undefined ? { screen: payload.screen } : {}),
        ...(payload.platform !== undefined ? { platform: payload.platform } : {}),
        ...(payload.deviceBrand !== undefined
          ? { deviceBrand: payload.deviceBrand }
          : {}),
        ...(payload.deviceModel !== undefined
          ? { deviceModel: payload.deviceModel }
          : {}),
        ...(payload.osVersion !== undefined
          ? { osVersion: payload.osVersion }
          : {}),
        ...(payload.appVersion !== undefined
          ? { appVersion: payload.appVersion }
          : {}),
        ...(payload.extra !== undefined ? { extra: payload.extra } : {}),
      });
    });
    void reportUncleanExitIfNeeded();
    return () => {
      setAppErrorFlush(null);
    };
  }, [report]);

  return null;
}
