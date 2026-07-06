import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc, Id } from "@proyecto/backend/dataModel";
import { AdminRegionFilters } from "../components/AdminRegionFilters";
import {
  AdminCard,
  AdminEmpty,
  AdminLoading,
  AdminPage,
  AdminPageHeader,
} from "../components/AdminLayout";
import {
  EMPTY_REGION_FILTER,
  hasRegionFilter,
  inputClass,
  matchesTextSearch,
  regionToQueryArgs,
  selectClass,
  type RegionFilter,
} from "../lib/adminFilters";

type PeriodFilter = "today" | "week" | "month" | "all";
type DriverStatusFilter = "" | Doc<"drivers">["status"];

function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  today: "Hoy",
  week: "Últimos 7 días",
  month: "Últimos 30 días",
  all: "Todo el historial",
};

export function TopUpsView() {
  const [region, setRegion] = useState<RegionFilter>(EMPTY_REGION_FILTER);
  const [period, setPeriod] = useState<PeriodFilter>("today");
  const [driverStatus, setDriverStatus] = useState<DriverStatusFilter>("");
  const [search, setSearch] = useState("");
  const timezoneOffsetMinutes = new Date().getTimezoneOffset();

  const topUps = useQuery(api.driverWallets.listTopUpsForAdmin, {
    timezoneOffsetMinutes,
    period,
  });
  const regionalServices = useQuery(
    api.services.listAllForAdmin,
    hasRegionFilter(region) ? regionToQueryArgs(region) : "skip",
  );

  const filteredItems = useMemo(() => {
    if (topUps === undefined) {
      return undefined;
    }

    let driverIdsInRegion: Set<Id<"drivers">> | null = null;
    if (hasRegionFilter(region) && regionalServices !== undefined) {
      driverIdsInRegion = new Set(
        regionalServices
          .map((service) => service.driverId)
          .filter((id): id is Id<"drivers"> => id !== undefined),
      );
    }

    return topUps.items.filter((tx) => {
      if (driverStatus !== "" && tx.driverStatus !== driverStatus) {
        return false;
      }
      if (
        driverIdsInRegion !== null &&
        !driverIdsInRegion.has(tx.driverId)
      ) {
        return false;
      }
      return matchesTextSearch(search, [tx.userName, tx.userEmail, tx.plate]);
    });
  }, [topUps, regionalServices, region, driverStatus, search]);

  const filteredTotal =
    filteredItems?.reduce((sum, item) => sum + item.amount, 0) ?? 0;

  return (
    <AdminPage>
      <AdminPageHeader
        title="Recargas"
        description="Recargas de billetera de choferes. La región filtra choferes con servicios en esa zona."
      />

      <AdminRegionFilters value={region} onChange={setRegion}>
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value as PeriodFilter)}
          className={selectClass}
        >
          {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map((key) => (
            <option key={key} value={key}>
              {PERIOD_LABELS[key]}
            </option>
          ))}
        </select>
        <select
          value={driverStatus}
          onChange={(event) =>
            setDriverStatus(event.target.value as DriverStatusFilter)
          }
          className={selectClass}
        >
          <option value="">Estado chofer: todos</option>
          <option value="available">Disponible</option>
          <option value="busy">Ocupado</option>
          <option value="offline">Offline</option>
        </select>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar chofer, correo o placa"
          className={inputClass}
        />
      </AdminRegionFilters>

      <AdminCard>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">
            {PERIOD_LABELS[period]}
          </h2>
          <span className="text-xs font-medium text-slate-500">
            {filteredItems?.length ?? 0} movimientos
          </span>
        </div>

        <div className="mb-5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total filtrado
          </p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900">
            S/{filteredTotal.toFixed(2)}
          </p>
        </div>

        {filteredItems === undefined ? (
          <AdminLoading message="Cargando recargas…" />
        ) : filteredItems.length === 0 ? (
          <AdminEmpty message="No hay recargas con estos filtros." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredItems.map((tx) => (
              <li key={tx._id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{tx.userName}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>{tx.userEmail}</span>
                      <span>Placa: {tx.plate}</span>
                      <span className="capitalize">Estado: {tx.driverStatus}</span>
                      <span>{formatDateTime(tx.createdAt)}</span>
                    </div>
                  </div>
                  <p className="shrink-0 font-display text-lg font-bold text-emerald-700">
                    + S/{tx.amount.toFixed(2)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </AdminPage>
  );
}
