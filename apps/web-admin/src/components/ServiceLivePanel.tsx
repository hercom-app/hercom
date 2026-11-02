import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import { computeMapBounds, liveStatusLabel } from "../lib/liveTrip";
import { AdminCard, AdminLoading } from "./AdminLayout";
import { LiveTripMap } from "./LiveTripMap";
import { btnGhostClass, btnSecondaryClass } from "../lib/adminUi";
import { formatDateTime } from "../lib/formatDateTime";
import { TripReviewFacts } from "./TripReviewFacts";

type ServiceLivePanelProps = {
  serviceId: Id<"services">;
  onClose: () => void;
};

const REPLAY_MS_PER_POINT = 120;

export function ServiceLivePanel({ serviceId, onClose }: ServiceLivePanelProps) {
  const live = useQuery(api.serviceTracking.getForAdmin, { serviceId });
  const archivedRoute = useQuery(
    api.serviceRouteArchives.getForAdmin,
    live !== undefined && live !== null ? { serviceId } : "skip",
  );
  const review = useQuery(api.services.getReviewForAdmin, { serviceId });

  const isFinished = live?.status === "finished";
  const [replayIndex, setReplayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const recordedTrail = useMemo(() => {
    if (archivedRoute?.trail !== undefined && archivedRoute.trail.length > 0) {
      return archivedRoute.trail.map((point) => ({
        lat: point.lat,
        lng: point.lng,
      }));
    }
    if (live?.trail !== undefined && live.trail.length > 0) {
      return live.trail.map((point) => ({
        lat: point.lat,
        lng: point.lng,
      }));
    }
    return [];
  }, [archivedRoute?.trail, live?.trail]);

  useEffect(() => {
    setReplayIndex(0);
    setIsPlaying(false);
  }, [serviceId, recordedTrail.length]);

  useEffect(() => {
    if (!isPlaying || recordedTrail.length < 2) {
      return;
    }
    if (replayIndex >= recordedTrail.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setReplayIndex((prev) => Math.min(prev + 1, recordedTrail.length - 1));
    }, REPLAY_MS_PER_POINT);
    return () => window.clearTimeout(timer);
  }, [isPlaying, recordedTrail.length, replayIndex]);

  const mapData = useMemo(() => {
    if (live === undefined || live === null) {
      return null;
    }
    const liveTrail = live.trail.map((point) => ({
      lat: point.lat,
      lng: point.lng,
    }));
    const trail = recordedTrail.length >= liveTrail.length ? recordedTrail : liveTrail;
    const driver =
      !isFinished && live.lat !== null && live.lng !== null
        ? { lat: live.lat, lng: live.lng }
        : null;
    const origin = { lat: live.origin.lat, lng: live.origin.lng };
    const destination = {
      lat: live.destination.lat,
      lng: live.destination.lng,
    };
    const planned = [
      origin,
      ...(live.extraDestinations ?? []).map((stop) => ({
        lat: stop.lat,
        lng: stop.lng,
      })),
      destination,
    ];
    const points = [...planned, ...trail];
    if (driver !== null) {
      points.push(driver);
    }
    const replayPosition =
      isFinished && trail.length > 0
        ? trail[Math.min(replayIndex, trail.length - 1)]!
        : null;
    return {
      origin,
      destination,
      driver,
      trail,
      planned,
      replayPosition: isPlaying || replayIndex > 0 ? replayPosition : null,
      bounds: computeMapBounds(points),
    };
  }, [isFinished, live, recordedTrail, replayIndex, isPlaying]);

  const lastUpdated =
    live?.updatedAt !== null && live?.updatedAt !== undefined
      ? new Date(live.updatedAt).toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : null;

  const togglePlay = useCallback(() => {
    if (recordedTrail.length < 2) {
      return;
    }
    if (replayIndex >= recordedTrail.length - 1) {
      setReplayIndex(0);
    }
    setIsPlaying((prev) => !prev);
  }, [recordedTrail.length, replayIndex]);

  const panelTitle = "Detalles del servicio seleccionado";

  return (
    <AdminCard>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">
            {panelTitle}
          </h2>
          {live !== undefined && live !== null && (
            <>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Solicitado:{" "}
                {formatDateTime(live.requestedAt)}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">
                {liveStatusLabel(live.status)}
                {live.driverName !== undefined ? ` · ${live.driverName}` : ""}
                {!isFinished && lastUpdated !== null
                  ? ` · GPS act. ${lastUpdated}`
                  : ""}
              </p>
            </>
          )}
        </div>
        <button type="button" onClick={onClose} className={`${btnGhostClass} shrink-0`}>
          Volver
        </button>
      </div>

      {live === undefined ? (
        <AdminLoading message="Cargando ubicación…" />
      ) : live === null || mapData === null ? (
        <p className="text-sm text-slate-500">
          No hay datos de seguimiento para este servicio.
        </p>
      ) : (
        <>
          <div className="h-[min(55dvh,420px)] min-h-[260px] overflow-hidden rounded-lg border border-slate-200 sm:h-[420px]">
            <LiveTripMap
              key={`${serviceId}-${isFinished ? "rec" : "live"}`}
              origin={mapData.origin}
              destination={mapData.destination}
              driver={mapData.driver}
              trail={mapData.trail}
              planned={mapData.planned}
              center={mapData.bounds.center}
              zoom={mapData.bounds.zoom}
              replayPosition={mapData.replayPosition}
              recordedRoute={isFinished && mapData.trail.length > 1}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            La línea punteada es la ruta pedida (origen, paradas y destino). La
            línea azul es el recorrido GPS del chofer.
          </p>

          {isFinished && recordedTrail.length > 1 && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className={`${btnSecondaryClass} min-h-10 px-4 text-sm font-semibold`}
                >
                  {isPlaying ? "Pausar" : "Reproducir ruta"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setReplayIndex(0);
                  }}
                  className={`${btnGhostClass} min-h-10 text-sm`}
                >
                  Reiniciar
                </button>
                <span className="text-xs text-slate-600">
                  Punto {replayIndex + 1} / {recordedTrail.length}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={recordedTrail.length - 1}
                value={replayIndex}
                onChange={(event) => {
                  setIsPlaying(false);
                  setReplayIndex(Number(event.target.value));
                }}
                className="mt-2 w-full accent-hercom"
                aria-label="Posición en la ruta"
              />
              <p className="mt-1 text-xs text-slate-500">
                La línea naranja sigue el recorrido; el mapa Carto muestra calles y
                manzanas para revisar el trayecto real.
              </p>
            </div>
          )}

          {isFinished && recordedTrail.length <= 1 && (
            <p className="mt-3 text-sm text-amber-800">
              Este viaje finalizó sin puntos GPS suficientes para dibujar la ruta.
              Los viajes nuevos guardan el recorrido completo al cerrar.
            </p>
          )}

          <div className="mt-3 space-y-1 text-xs text-slate-500">
            {!live.isLive && !isFinished && (
              <p className="font-semibold text-slate-600">
                El seguimiento en vivo no está activo en este estado.
              </p>
            )}
            {live.lat === null && live.isLive && (
              <p>Esperando la primera señal GPS del chofer…</p>
            )}
            <p>
              <span className="font-semibold text-slate-700">De:</span>{" "}
              {live.origin.address}
            </p>
            <p>
              <span className="font-semibold text-slate-700">A:</span>{" "}
              {live.destination.address}
            </p>
            {live.shareToken !== null && !isFinished && (
              <p>
                Link comercial:{" "}
                <span className="break-all font-mono text-slate-700">
                  /live/{live.shareToken}
                </span>
              </p>
            )}
            {archivedRoute !== undefined && archivedRoute !== null && (
              <p>
                Ruta archivada: {archivedRoute.pointCount} puntos
                {archivedRoute.expiresAt !== null
                  ? ` · retención hasta ${formatDateTime(archivedRoute.expiresAt)}`
                  : ""}
              </p>
            )}
          </div>
          {review !== undefined && review !== null && (
            <div className="mt-4">
              <TripReviewFacts review={review} />
            </div>
          )}
        </>
      )}
    </AdminCard>
  );
}
