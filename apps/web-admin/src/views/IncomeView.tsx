import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc } from "@proyecto/backend/dataModel";
import {
  AdminCard,
  AdminEmpty,
  AdminLoading,
  AdminPage,
  AdminPageHeader,
  AdminTableWrap,
} from "../components/AdminLayout";
import { limaDaysAgo, limaToday, liveStatusLabel } from "../lib/liveTrip";
import { AdminRegionFilters } from "../components/AdminRegionFilters";
import {
  EMPTY_REGION_FILTER,
  hasRegionFilter,
  regionToQueryArgs,
  type RegionFilter,
} from "../lib/adminFilters";
import {
  inputClass,
  rowClass,
  selectClass,
  tableClass,
  tableHeadClass,
  tdClass,
  thClass,
} from "../lib/adminUi";

type StatusFilter = "" | Doc<"services">["status"];
type TypeFilter = "all" | NonNullable<Doc<"services">["serviceType"]>;

function formatMoney(amount: number): string {
  return `S/${amount.toFixed(2)}`;
}

function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function IncomeView({
  isFullAdmin = true,
  districtScopes = [],
}: {
  isFullAdmin?: boolean;
  districtScopes?: Array<{
    countryCode: string;
    department: string;
    province: string;
    district: string;
  }>;
}) {
  const [fromDate, setFromDate] = useState(() => limaDaysAgo(30));
  const [toDate, setToDate] = useState(() => limaToday());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("finished");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [region, setRegion] = useState<RegionFilter>(EMPTY_REGION_FILTER);

  const report = useQuery(api.reports.listRevenueForAdmin, {
    fromDate,
    toDate,
    ...(statusFilter !== "" ? { status: statusFilter } : {}),
    ...(typeFilter !== "all" ? { serviceType: typeFilter } : {}),
    ...(hasRegionFilter(region) ? regionToQueryArgs(region) : {}),
  });

  return (
    <AdminPage>
      <AdminPageHeader
        title="Ingresos"
        description="Viajes filtrados por fecha (hora de Lima) y estado. Los montos cerrados corresponden a servicios finalizados."
      />

      <AdminRegionFilters
        value={region}
        onChange={setRegion}
        allowedScopes={isFullAdmin ? undefined : districtScopes}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Desde
          </span>
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Hasta
          </span>
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Estado
          </span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            className={selectClass}
          >
            <option value="">Todos</option>
            <option value="finished">Finalizado</option>
            <option value="cancelled">Cancelado</option>
            <option value="in_progress">En viaje</option>
            <option value="assigned">Asignado</option>
            <option value="pending">Pendiente</option>
            <option value="heading_to_pickup">Yendo a recoger</option>
            <option value="arrived_pickup">Llegó al punto</option>
            <option value="arrived_destination">Llegó al destino</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tipo
          </span>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
            className={selectClass}
          >
            <option value="all">Todos</option>
            <option value="app">App</option>
            <option value="premium">Premium</option>
          </select>
        </label>
      </div>

      {report === undefined ? (
        <AdminCard>
          <AdminLoading message="Cargando ingresos…" />
        </AdminCard>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Viajes en rango"
              value={String(report.totals.trips)}
            />
            <SummaryCard
              label="Ingreso cerrado"
              value={formatMoney(report.totals.closedGross)}
              hint={`${report.totals.finishedTrips} finalizados`}
            />
            <SummaryCard
              label="Comisión Hercom"
              value={formatMoney(report.totals.closedCommission)}
            />
            <SummaryCard
              label="Saldo cliente pendiente"
              value={formatMoney(report.totals.pendingPayments)}
            />
          </div>

          <AdminCard>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">
                Detalle
              </h2>
              <span className="text-xs font-medium text-slate-500">
                {report.rows.length} registros
              </span>
            </div>
            {report.rows.length === 0 ? (
              <AdminEmpty message="No hay viajes con estos filtros." />
            ) : (
              <AdminTableWrap>
                <table className={`${tableClass} min-w-[860px]`}>
                  <thead className={tableHeadClass}>
                    <tr>
                      <th className={thClass}>Fecha</th>
                      <th className={thClass}>Estado</th>
                      <th className={`${thClass} hidden sm:table-cell`}>Tipo</th>
                      <th className={thClass}>Ruta</th>
                      <th className={thClass}>Total</th>
                      <th className={`${thClass} hidden md:table-cell`}>
                        Comisión
                      </th>
                      <th className={`${thClass} hidden lg:table-cell`}>Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row) => (
                      <tr key={row.serviceId} className={rowClass}>
                        <td className={tdClass}>
                          {formatDateTime(row.activityAt)}
                        </td>
                        <td className={tdClass}>
                          {liveStatusLabel(row.status)}
                        </td>
                        <td className={`${tdClass} hidden capitalize sm:table-cell`}>
                          {row.serviceType}
                        </td>
                        <td className={`${tdClass} max-w-[240px] whitespace-normal`}>
                          <span className="line-clamp-2">
                            {row.origin} → {row.destination}
                          </span>
                        </td>
                        <td className={`${tdClass} font-semibold`}>
                          {formatMoney(row.totalPrice)}
                        </td>
                        <td className={`${tdClass} hidden md:table-cell`}>
                          {formatMoney(row.commission)}
                        </td>
                        <td className={`${tdClass} hidden lg:table-cell`}>
                          {row.paymentStatus === "paid"
                            ? `Cobrado ${formatMoney(row.paymentAmount)}`
                            : row.paymentStatus === "pending"
                              ? `Pendiente ${formatMoney(row.paymentAmount)}`
                              : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminTableWrap>
            )}
          </AdminCard>
        </>
      )}
    </AdminPage>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <AdminCard>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      {hint !== undefined && (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      )}
    </AdminCard>
  );
}
