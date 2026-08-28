import type { Doc, Id } from "@proyecto/backend/dataModel";
import {
  getRequestChannelLabel,
  getServiceTypeMeta,
} from "../lib/serviceLabels";
import {
  AdminCard,
  AdminEmpty,
  AdminLoading,
  AdminTableWrap,
} from "./AdminLayout";
import {
  rowClass,
  tableClass,
  tableHeadClass,
  tdClass,
  thClass,
} from "../lib/adminUi";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  heading_to_pickup: "Yendo a recoger",
  arrived_pickup: "Llegó al punto",
  in_progress: "En viaje",
  arrived_destination: "Llegó al destino",
  en_route: "En camino",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

type ServicesBoardProps = {
  services: Doc<"services">[] | undefined;
  title?: string;
  selectedId?: Id<"services"> | null;
  onSelect?: (serviceId: Id<"services">) => void;
};

export function ServicesBoard({
  services,
  title = "Servicios",
  selectedId,
  onSelect,
}: ServicesBoardProps) {
  if (services === undefined) {
    return (
      <AdminCard>
        <AdminLoading message="Cargando servicios…" />
      </AdminCard>
    );
  }

  return (
    <AdminCard>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        <span className="text-xs font-medium text-slate-500">
          {services.length} {services.length === 1 ? "registro" : "registros"}
        </span>
      </div>

      {services.length === 0 ? (
        <AdminEmpty message="No hay servicios con estos filtros." />
      ) : (
        <AdminTableWrap>
          <table className={`${tableClass} min-w-[960px]`}>
            <thead className={tableHeadClass}>
              <tr>
                <th className={thClass}>Tipo</th>
                <th className={`${thClass} hidden lg:table-cell`}>Canal</th>
                <th className={`${thClass} hidden md:table-cell`}>Región</th>
                <th className={`${thClass} hidden xl:table-cell`}>Promo</th>
                <th className={thClass}>Ruta</th>
                <th className={thClass}>Total</th>
                <th className={`${thClass} hidden sm:table-cell`}>Comisión</th>
                <th className={`${thClass} hidden lg:table-cell`}>Anticipo</th>
                <th className={thClass}>Estado</th>
                <th className={`${thClass} hidden md:table-cell`}>Código</th>
                {onSelect !== undefined && <th className={thClass}>Mapa</th>}
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
                  <tr
                    key={service._id}
                    className={`${rowClass} ${
                      selectedId === service._id ? "bg-sky-50/80" : ""
                    }`}
                  >
                    <td className={tdClass}>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeMeta.badgeClass}`}
                      >
                        {typeMeta.label}
                      </span>
                    </td>
                    <td className={`${tdClass} hidden text-xs lg:table-cell`}>
                      {getRequestChannelLabel(service)}
                    </td>
                    <td className={`${tdClass} hidden text-xs md:table-cell`}>
                      {regionParts.length > 0 ? regionParts.join(" · ") : "—"}
                    </td>
                    <td className={`${tdClass} hidden text-xs xl:table-cell`}>
                      {service.promotionName ?? "—"}
                    </td>
                    <td className={`${tdClass} max-w-[220px] whitespace-normal text-slate-900 sm:max-w-xs`}>
                      <span className="line-clamp-2">
                        {service.origin.address} → {service.destination.address}
                      </span>
                    </td>
                    <td className={`${tdClass} font-semibold text-slate-900`}>
                      S/{service.totalPrice.toFixed(2)}
                    </td>
                    <td className={`${tdClass} hidden sm:table-cell`}>
                      S/{service.driverCommission.toFixed(2)}
                    </td>
                    <td className={`${tdClass} hidden lg:table-cell`}>
                      {advanceAmount !== null ? (
                        <>
                          S/{advanceAmount.toFixed(2)}
                          {service.advanceConfirmedAt !== undefined ? " ✓" : ""}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={tdClass}>
                      <span className="text-xs font-medium">
                        {STATUS_LABELS[service.status] ?? service.status}
                      </span>
                    </td>
                    <td className={`${tdClass} hidden md:table-cell`}>
                      {service.securityCode ?? "—"}
                    </td>
                    {onSelect !== undefined && (
                      <td className={tdClass}>
                        <button
                          type="button"
                          onClick={() => onSelect(service._id)}
                          className="text-xs font-semibold text-hercom hover:underline"
                        >
                          Ver mapa
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </AdminTableWrap>
      )}
    </AdminCard>
  );
}
