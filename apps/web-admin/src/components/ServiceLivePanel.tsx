import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import { computeMapBounds, liveStatusLabel } from "../lib/liveTrip";
import { AdminCard, AdminLoading } from "./AdminLayout";
import { LiveTripMap } from "./LiveTripMap";
import { btnGhostClass } from "../lib/adminUi";

type ServiceLivePanelProps = {
  serviceId: Id<"services">;
  onClose: () => void;
};

export function ServiceLivePanel({ serviceId, onClose }: ServiceLivePanelProps) {
  const live = useQuery(api.serviceTracking.getForAdmin, { serviceId });

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

  return (
    <AdminCard>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">
            Ubicación en tiempo real
          </h2>
          {live !== undefined && live !== null && (
            <p className="mt-1 text-sm text-slate-500">
              {liveStatusLabel(live.status)}
              {live.driverName !== undefined ? ` · ${live.driverName}` : ""}
              {lastUpdated !== null ? ` · act. ${lastUpdated}` : ""}
            </p>
          )}
        </div>
        <button type="button" onClick={onClose} className={`${btnGhostClass} shrink-0`}>
          Cerrar
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
          <div className="h-[min(50dvh,380px)] min-h-[240px] overflow-hidden rounded-lg border border-slate-200 sm:h-[380px]">
            <LiveTripMap
              key={serviceId}
              origin={mapData.origin}
              destination={mapData.destination}
              driver={mapData.driver}
              trail={mapData.trail}
              center={mapData.bounds.center}
              zoom={mapData.bounds.zoom}
            />
          </div>
          <div className="mt-3 space-y-1 text-xs text-slate-500">
            {!live.isLive && (
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
            {live.shareToken !== null && (
              <p>
                Link comercial:{" "}
                <span className="break-all font-mono text-slate-700">
                  /live/{live.shareToken}
                </span>
              </p>
            )}
          </div>
        </>
      )}
    </AdminCard>
  );
}
