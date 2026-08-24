import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import * as Location from "expo-location";

const LIVE_STATUSES = new Set([
  "heading_to_pickup",
  "arrived_pickup",
  "in_progress",
  "en_route",
  "arrived_destination",
]);

type TrackableService = {
  _id: Id<"services">;
  status: string;
};

/**
 * Publica la ubicación GPS del chofer mientras hay un servicio en vivo.
 * Nota: con la app en segundo plano (p. ej. Waze) el OS puede pausar el GPS;
 * al volver a Hercom se reanuda.
 */
export function useDriverLiveTracking(services: TrackableService[] | undefined) {
  const updateMyLiveLocation = useMutation(
    api.serviceTracking.updateMyLiveLocation,
  );
  const ensureForMyService = useMutation(api.serviceTracking.ensureForMyService);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const activeIdRef = useRef<Id<"services"> | null>(null);

  const liveService =
    services?.find((service) => LIVE_STATUSES.has(service.status)) ?? null;

  useEffect(() => {
    let cancelled = false;

    async function stopWatching() {
      if (subscriptionRef.current !== null) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      activeIdRef.current = null;
    }

    async function startWatching(serviceId: Id<"services">) {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted || cancelled) {
        return;
      }
      try {
        await ensureForMyService({ serviceId });
      } catch {
        // El servidor también crea tracking al cambiar de estado.
      }
      if (cancelled) {
        return;
      }

      await stopWatching();
      activeIdRef.current = serviceId;
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
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

    if (liveService === null) {
      void stopWatching();
      return () => {
        cancelled = true;
        void stopWatching();
      };
    }

    void startWatching(liveService._id);

    const onAppState = (state: AppStateStatus) => {
      if (state === "active" && liveService !== null) {
        void startWatching(liveService._id);
      }
    };
    const appSub = AppState.addEventListener("change", onAppState);

    return () => {
      cancelled = true;
      appSub.remove();
      void stopWatching();
    };
  }, [
    liveService?._id,
    liveService?.status,
    ensureForMyService,
    updateMyLiveLocation,
  ]);
}
