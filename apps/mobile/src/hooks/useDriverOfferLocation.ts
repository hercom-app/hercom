import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";
import { useMutation } from "convex/react";
import { api } from "@proyecto/backend";

export type DriverGpsCoords = {
  lat: number;
  lng: number;
};

/**
 * Ubicación del chofer para filtrar ofertas (radio 10 km en servidor).
 */
export function useDriverOfferLocation(enabled: boolean) {
  const updateMyLocation = useMutation(api.drivers.updateMyLocation);
  const [coords, setCoords] = useState<DriverGpsCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (): Promise<DriverGpsCoords | null> => {
    setLoading(true);
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError("Activa la ubicación para ver solicitudes a 10 km.");
        setCoords(null);
        return null;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setCoords(next);
      await updateMyLocation(next);
      return next;
    } catch {
      setError("No se pudo obtener tu ubicación.");
      setCoords(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [updateMyLocation]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void refresh();
    const id = setInterval(() => void refresh(), 60_000);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  return { coords, error, loading, refresh };
}

export async function getDriverGpsForOffer(): Promise<DriverGpsCoords> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Activa la ubicación para ofertar servicios cercanos.");
  }
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };
}
