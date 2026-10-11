import { useEffect } from "react";
import type { Doc } from "@proyecto/backend/dataModel";
import { formatServiceRequestedAt } from "../lib/formatDateTime";
import {
  getRequestChannelLabel,
  getServiceTypeMeta,
} from "../lib/serviceLabels";
import { btnPrimaryClass, btnSecondaryClass } from "../lib/adminUi";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  heading_to_pickup: "Yendo a recoger",
  arrived_pickup: "Llegó al punto",
  in_progress: "En viaje",
  arrived_destination: "Llegó al destino",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

type ServiceRouteDetailModalProps = {
  service: Doc<"services">;
  onClose: () => void;
};

function LocationBlock({
  label,
  location,
}: {
  label: string;
  location: Doc<"services">["origin"];
}) {
  const region = [location.department, location.province, location.district]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium text-zinc-900">
        {location.address.trim() !== "" ? location.address : "—"}
      </p>
      {region !== "" && (
        <p className="mt-2 text-xs text-zinc-600">{region}</p>
      )}
      <p className="mt-1 font-mono text-[11px] text-zinc-500">
        {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
      </p>
    </div>
  );
}

export function ServiceRouteDetailModal({
  service,
  onClose,
}: ServiceRouteDetailModalProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const typeMeta = getServiceTypeMeta(service);
  const extras = service.extraDestinations ?? [];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-route-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[min(90dvh,640px)] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="service-route-modal-title"
              className="font-display text-lg font-bold text-zinc-900"
            >
              Detalle del servicio
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {formatServiceRequestedAt(service)}
              {" · "}
              {STATUS_LABELS[service.status] ?? service.status}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {typeMeta.label} · Canal: {getRequestChannelLabel(service)} · S/
              {service.totalPrice.toFixed(2)}
            </p>
          </div>
          <button type="button" onClick={onClose} className={btnSecondaryClass}>
            Cerrar
          </button>
        </div>

        <div className="space-y-3">
          <LocationBlock label="Origen (De)" location={service.origin} />
          <LocationBlock label="Destino (A)" location={service.destination} />
          {extras.map((stop, index) => (
            <LocationBlock
              key={`${index}-${stop.address}`}
              label={`Parada ${index + 2}`}
              location={stop}
            />
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-amber-200/80 bg-amber-50/90 p-3 text-xs text-amber-950">
          <p className="font-semibold">Código de inicio (securityCode)</p>
          <p className="mt-1 leading-relaxed">
            PIN de 4 dígitos que se genera cuando hay chofer asignado o el cliente
            acepta una oferta. Cliente y chofer lo usan en la app para{" "}
            <strong>iniciar el viaje</strong> (el chofer debe ingresarlo). En
            solicitudes <strong>pending</strong> sin chofer suele mostrarse «—».
          </p>
          <p className="mt-2 font-mono text-base font-bold tracking-widest text-zinc-900">
            {service.securityCode ?? "—"}
          </p>
        </div>

        {service.notes !== undefined && service.notes.trim() !== "" && (
          <div className="mt-3 text-sm">
            <p className="text-xs font-semibold text-zinc-500">Notas</p>
            <p className="mt-1 whitespace-pre-wrap text-zinc-800">
              {service.notes}
            </p>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className={btnPrimaryClass}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
