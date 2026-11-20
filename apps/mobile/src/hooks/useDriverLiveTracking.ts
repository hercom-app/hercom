import { useEffect, useRef } from "react";
import { Alert, AppState, type AppStateStatus } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc, Id } from "@proyecto/backend/dataModel";
import * as Location from "expo-location";
import { canShareLiveTrip } from "../lib/serviceStatus";
import {
  flushTripLocationQueue,
  startTripLocationUpdates,
  stopTripLocationUpdates,
} from "../lib/backgroundTripTracking";

type TrackableService = {
  _id: Id<"services">;
  status: string;
};

const FOREGROUND_FLUSH_MS = 20000;

/**
 * Registra el recorrido del chofer desde que inicia el viaje.
 * Con permiso «Permitir siempre» usa la tarea en segundo plano (sigue con Waze);
 * si no, cae al GPS solo con la app abierta.
 */
export function useDriverLiveTracking(services: TrackableService[] | undefined) {
  const updateMyLiveLocation = useMutation(
    api.serviceTracking.updateMyLiveLocation,
  );
  const appendMyLocationBatch = useMutation(
    api.serviceTracking.appendMyLocationBatch,
  );
  const ensureForMyService = useMutation(api.serviceTracking.ensureForMyService);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const activeIdRef = useRef<Id<"services"> | null>(null);
  const warnedRef = useRef<Id<"services"> | null>(null);
  const askedRef = useRef<Id<"services"> | null>(null);

  const liveService =
    services?.find((service) => canShareLiveTrip(service.status as Doc<"services">["status"])) ??
    null;

  useEffect(() => {
    let cancelled = false;
    const flush = () => {
      void flushTripLocationQueue((args) => appendMyLocationBatch(args)).catch(() => {});
    };

    function stopForegroundWatch() {
      if (subscriptionRef.current !== null) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      activeIdRef.current = null;
    }

    async function startForegroundWatch(serviceId: Id<"services">) {
      stopForegroundWatch();
      activeIdRef.current = serviceId;
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 15,
        },
        (position) => {
          const targetId = activeIdRef.current;
          if (targetId === null) {
            return;
          }
          void updateMyLiveLocation({
            serviceId: targetId,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            ...(position.coords.heading != null && position.coords.heading >= 0
              ? { heading: position.coords.heading }
              : {}),
            ...(position.coords.speed != null && position.coords.speed >= 0
              ? { speed: position.coords.speed }
              : {}),
          }).catch(() => {
            /* silenciar errores de red puntuales */
          });
        },
      );
    }

    async function start(serviceId: Id<"services">) {
      try {
        await ensureForMyService({ serviceId });
      } catch {
        // El servidor también crea tracking al cambiar de estado.
      }
      if (cancelled) {
        return;
      }
      const askPermission = askedRef.current !== serviceId;
      askedRef.current = serviceId;
      let background = false;
      try {
        background = await startTripLocationUpdates(serviceId, askPermission);
      } catch {
        background = false;
      }
      if (cancelled) {
        return;
      }
      if (background) {
        stopForegroundWatch();
        flush();
        return;
      }
      const foreground = await Location.getForegroundPermissionsAsync();
      if (!foreground.granted || cancelled) {
        return;
      }
      await startForegroundWatch(serviceId);
      if (warnedRef.current !== serviceId) {
        warnedRef.current = serviceId;
        Alert.alert(
          "Ubicación en segundo plano",
          "Para guardar la ruta real mientras usas Waze, permite la ubicación «Todo el tiempo» para Hercom en los ajustes del teléfono.",
        );
      }
    }

    if (liveService === null) {
      stopForegroundWatch();
      void stopTripLocationUpdates()
        .catch(() => {})
        .finally(flush);
      return () => {
        cancelled = true;
      };
    }

    void start(liveService._id);

    const onAppState = (state: AppStateStatus) => {
      if (state === "active") {
        void start(liveService._id);
      }
    };
    const appSub = AppState.addEventListener("change", onAppState);
    const interval = setInterval(() => {
      if (AppState.currentState === "active") {
        flush();
      }
    }, FOREGROUND_FLUSH_MS);

    return () => {
      cancelled = true;
      appSub.remove();
      clearInterval(interval);
      stopForegroundWatch();
    };
  }, [
    liveService?._id,
    liveService?.status,
    appendMyLocationBatch,
    ensureForMyService,
    updateMyLiveLocation,
  ]);
}
