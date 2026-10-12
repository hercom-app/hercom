import { useState } from "react";
import type { Doc, Id } from "@proyecto/backend/dataModel";
import {
  getAdminServiceStatusLabel,
  getRequestChannelLabel,
  getServiceTypeMeta,
} from "../lib/serviceLabels";
import {
  AdminCard,
  AdminEmpty,
  AdminLoading,
  AdminTableWrap,
} from "./AdminLayout";
import { AdminPagination, usePagedItems } from "./AdminPagination";
import {
  rowClass,
  tableClass,
  tableHeadClass,
  tdClass,
  thClass,
} from "../lib/adminUi";
import { formatServiceRequestedAt } from "../lib/formatDateTime";
import { ServiceRouteDetailModal } from "./ServiceRouteDetailModal";
import { TruncatedAddressCell } from "./TruncatedAddressCell";

type ServicesBoardProps = {
  services: Doc<"services">[] | undefined;
  title?: string;
  selectedId?: Id<"services"> | null;
  onSelect?: (serviceId: Id<"services">) => void;
  resetKey?: string;
};

export function ServicesBoard({
  services,
  title = "Servicios",
  selectedId,
  onSelect,
  resetKey,
}: ServicesBoardProps) {
  const [routeDetailService, setRouteDetailService] =
    useState<Doc<"services"> | null>(null);

  const { page, setPage, pageCount, total, paged } = usePagedItems(
    services,
    resetKey ?? String(services?.length ?? "loading"),
  );

  if (services === undefined || paged === undefined) {
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
          {total} {total === 1 ? "registro" : "registros"}
        </span>
      </div>

      {total === 0 ? (
        <AdminEmpty message="No hay servicios con estos filtros." />
      ) : (
        <>
        <AdminTableWrap>
          <table className={tableClass}>
            <thead className={tableHeadClass}>
              <tr>
                <th className={thClass}>Fecha y hora</th>
                <th className={thClass} title="services.serviceType">
                  Producto
                </th>
                <th className={thClass} title="Origen: department · province · district">
                  Región recojo
                </th>
                <th className={thClass} title="services.origin.address">
                  Origen (De)
                </th>
                <th className={thClass} title="services.destination.address">
                  Destino (A)
                </th>
                <th className={thClass} title="services.promotionName">
                  Promo
                </th>
                <th className={thClass}>Total</th>
                <th className={thClass}>Comisión</th>
                <th className={thClass}>Anticipo</th>
                <th className={thClass}>Estado</th>
                <th
                  className={thClass}
                  title="securityCode — PIN para iniciar viaje (tras asignar chofer / aceptar oferta)"
                >
                  Cód. inicio
                </th>
                {onSelect !== undefined && <th className={thClass}>Mapa</th>}
              </tr>
            </thead>
            <tbody>
              {paged.map((service) => {
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
                    <td
                      className={`${tdClass} whitespace-nowrap text-xs font-semibold text-slate-900`}
                    >
                      {formatServiceRequestedAt(service)}
                    </td>
                    <td className={tdClass}>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeMeta.badgeClass}`}
                      >
                        {typeMeta.label}
                      </span>
                      <p
                        className="mt-1 text-[11px] leading-snug text-slate-500"
                        title="services.requestChannel"
                      >
                        Canal: {getRequestChannelLabel(service)}
                      </p>
                    </td>
                    <td className={`${tdClass} max-w-[9rem] text-xs`}>
                      <span
                        className="block truncate"
                        title={regionParts.join(" · ")}
                      >
                        {regionParts.length > 0 ? regionParts.join(" · ") : "—"}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <TruncatedAddressCell
                        address={service.origin.address}
                        ariaLabel="Ver origen y ruta completa"
                        onPress={() => setRouteDetailService(service)}
                      />
                    </td>
                    <td className={tdClass}>
                      <TruncatedAddressCell
                        address={service.destination.address}
                        ariaLabel="Ver destino y ruta completa"
                        onPress={() => setRouteDetailService(service)}
                      />
                    </td>
                    <td className={`${tdClass} text-xs`}>
                      {service.promotionName ?? "—"}
                    </td>
                    <td className={`${tdClass} font-semibold text-slate-900`}>
                      S/{service.totalPrice.toFixed(2)}
                    </td>
                    <td className={tdClass}>
                      S/{service.driverCommission.toFixed(2)}
                    </td>
                    <td className={tdClass}>
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
                        {getAdminServiceStatusLabel(service)}
                      </span>
                    </td>
                    <td className={tdClass}>
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
        <AdminPagination
          page={page}
          pageCount={pageCount}
          total={total}
          onPageChange={setPage}
        />
        </>
      )}

      {routeDetailService !== null && (
        <ServiceRouteDetailModal
          service={routeDetailService}
          onClose={() => setRouteDetailService(null)}
        />
      )}
    </AdminCard>
  );
}
