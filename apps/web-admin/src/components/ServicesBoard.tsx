import type { Doc } from "@proyecto/backend/dataModel";
import {
  getRequestChannelLabel,
  getServiceTypeMeta,
} from "../lib/serviceLabels";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  heading_to_pickup: "Chofer yendo a recoger",
  arrived_pickup: "Chofer llegó al punto",
  in_progress: "Chofer salió con cliente",
  arrived_destination: "Chofer llegó al destino",
  en_route: "En camino",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

type ServicesBoardProps = {
  services: Doc<"services">[] | undefined;
  title?: string;
};

export function ServicesBoard({
  services,
  title = "Servicios",
}: ServicesBoardProps) {
  if (services === undefined) {
    return (
      <section className="rounded-3xl bg-white p-6 shadow-lg">
        <p className="text-sm text-slate-500">Cargando servicios...</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <span className="text-xs text-slate-500">
          {services.length} {services.length === 1 ? "registro" : "registros"}
        </span>
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-slate-500">No hay servicios con estos filtros.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Tipo</th>
                <th className="py-2 pr-4">Canal</th>
                <th className="py-2 pr-4">Región recojo</th>
                <th className="py-2 pr-4">Promo</th>
                <th className="py-2 pr-4">Ruta</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Comisión</th>
                <th className="py-2 pr-4">Anticipo</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2">Código</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => {
                const advanceAmount =
                  service.advanceAmount ??
                  (service.offeredPrice !== undefined
                    ? Math.round(service.offeredPrice * 0.25 * 100) / 100
                    : null);
                const typeMeta = getServiceTypeMeta(service);
                const regionParts = [
                  service.origin.department,
                  service.origin.province,
                  service.origin.district,
                ].filter(Boolean);
                return (
                  <tr key={service._id} className="border-b border-slate-100">
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${typeMeta.badgeClass}`}
                      >
                        {typeMeta.label}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-xs text-slate-600">
                      {getRequestChannelLabel(service)}
                    </td>
                    <td className="py-2 pr-4 text-xs text-slate-600">
                      {regionParts.length > 0 ? regionParts.join(" · ") : "—"}
                    </td>
                    <td className="py-2 pr-4 text-xs text-slate-600">
                      {service.promotionName ?? "—"}
                    </td>
                    <td className="py-2 pr-4 text-slate-800">
                      {service.origin.address} → {service.destination.address}
                    </td>
                    <td className="py-2 pr-4">S/{service.totalPrice.toFixed(2)}</td>
                    <td className="py-2 pr-4">
                      S/{service.driverCommission.toFixed(2)}
                    </td>
                    <td className="py-2 pr-4">
                      {advanceAmount !== null ? (
                        <>
                          S/{advanceAmount.toFixed(2)}
                          {service.advanceConfirmedAt !== undefined ? " ✓" : ""}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {STATUS_LABELS[service.status] ?? service.status}
                    </td>
                    <td className="py-2">{service.securityCode ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
