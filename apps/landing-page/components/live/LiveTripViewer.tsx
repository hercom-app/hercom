"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { getByShareToken } from "@/lib/convexApi";
import { computeMapBounds, liveStatusLabel } from "@/lib/liveTrip";
import { isConvexConfigured } from "@/lib/convex";

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-100">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}

const LiveTripMap = dynamic(
  () => import("./LiveTripMap").then((module) => module.LiveTripMap),
  {
    ssr: false,
    loading: () => <LoadingPanel label="Cargando mapa…" />,
  },
);

type LiveTripViewerProps = {
  shareToken: string;
};

export function LiveTripViewer({ shareToken }: LiveTripViewerProps) {
  const normalizedToken = shareToken.trim().toLowerCase();
  const convexReady = isConvexConfigured();
  const live = useQuery(
    getByShareToken,
    convexReady ? { shareToken: normalizedToken } : "skip",
  );

  if (!convexReady) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold text-slate-800">
          Seguimiento no disponible
        </p>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Falta configurar <code>NEXT_PUBLIC_CONVEX_URL</code> en el servidor.
        </p>
      </div>
    );
  }

  const mapData = useMemo(() => {
    if (live === undefined || live === null) {
      return null;
    }

    const trail = live.trail.map((point) => ({
      lat: point.lat,
      lng: point.lng,
    }));
    const driver =
      live.lat !== null && live.lng !== null
        ? { lat: live.lat, lng: live.lng }
        : null;
    const origin = { lat: live.origin.lat, lng: live.origin.lng };
    const destination = {
      lat: live.destination.lat,
      lng: live.destination.lng,
    };
    const points = [origin, destination, ...trail];
    if (driver !== null) {
      points.push(driver);
    }

    return {
      origin,
      destination,
      driver,
      trail,
      bounds: computeMapBounds(points),
    };
  }, [live]);

  const lastUpdated =
    live?.updatedAt !== null && live?.updatedAt !== undefined
      ? new Date(live.updatedAt).toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : null;

  if (live === undefined) {
    return (
      <div className="flex flex-1 flex-col">
        <LoadingPanel label="Cargando ubicación…" />
      </div>
    );
  }

  if (live === null || mapData === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold text-slate-800">
          No encontramos este viaje
        </p>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          El enlace puede haber expirado o el código es incorrecto.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Hercom · Viaje en vivo
        </p>
        <h1 className="mt-1 text-xl font-bold text-slate-900">
          {liveStatusLabel(live.status)}
        </h1>
        {lastUpdated !== null && (
          <p className="mt-1 text-xs text-slate-500">
            Actualizado {lastUpdated}
          </p>
        )}
      </header>

      <div className="relative min-h-[50vh] flex-1">
        <LiveTripMap
          origin={mapData.origin}
          destination={mapData.destination}
          driver={mapData.driver}
          trail={mapData.trail}
          center={mapData.bounds.center}
          zoom={mapData.bounds.zoom}
        />
      </div>

      <footer className="border-t border-slate-200 bg-white px-4 py-4">
        {!live.isLive && (
          <p className="mb-2 text-center text-sm font-semibold text-slate-600">
            {live.status === "finished"
              ? "El viaje ya terminó. Se muestra el rastro recorrido."
              : "El seguimiento en vivo no está activo."}
          </p>
        )}
        {live.lat === null && live.isLive && (
          <p className="mb-2 text-center text-sm text-slate-500">
            Esperando la primera señal GPS del chofer…
          </p>
        )}
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700">De:</span>{" "}
          {live.origin.address}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">A:</span>{" "}
          {live.destination.address}
        </p>
      </footer>
    </div>
  );
}
