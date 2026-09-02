import { Fragment, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import { AdminRegionFilters } from "../components/AdminRegionFilters";
import type { DistrictScopeOption } from "../components/AdminRegionFilters";
import { DriverDossierPanel } from "../components/DriverDossierPanel";
import {
  EMPTY_REGION_FILTER,
  hasRegionFilter,
  inputClass,
  matchesTextSearch,
  type RegionFilter,
} from "../lib/adminFilters";
import {
  AdminCard,
  AdminEmpty,
  AdminLoading,
  AdminPage,
  AdminPageHeader,
  AdminTableWrap,
} from "../components/AdminLayout";
import {
  btnGhostClass,
  rowClass,
  tableClass,
  tableHeadClass,
  tdClass,
  thClass,
} from "../lib/adminUi";

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function zoneLabel(item: {
  countryCode?: string;
  department?: string;
  province?: string;
  district?: string;
}): string {
  return [item.district, item.province, item.department]
    .filter((part) => part !== undefined && part !== "")
    .join(", ");
}

type DriversViewProps = {
  isFullAdmin: boolean;
  districtScopes: DistrictScopeOption[];
};

export function DriversView({
  isFullAdmin,
  districtScopes,
}: DriversViewProps) {
  const [region, setRegion] = useState<RegionFilter>(EMPTY_REGION_FILTER);
  const [search, setSearch] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<Id<"users"> | null>(
    null,
  );

  const drivers = useQuery(api.drivers.listAll, {});
  const applications = useQuery(api.driverApplications.listForAdmin, {});

  const applicationByUserId = useMemo(() => {
    const map = new Map<
      Id<"users">,
      NonNullable<typeof applications>[number]
    >();
    for (const application of applications ?? []) {
      if (!map.has(application.userId)) {
        map.set(application.userId, application);
      }
    }
    return map;
  }, [applications]);

  const filteredDrivers = useMemo(() => {
    if (drivers === undefined) {
      return undefined;
    }
    return drivers.filter((driver) => {
      if (
        !matchesTextSearch(search, [
          driver.fullName,
          driver.dni,
          driver.licenseNumber,
          driver.vehicle.plate,
        ])
      ) {
        return false;
      }
      if (!hasRegionFilter(region)) {
        return true;
      }
      if (region.department !== "" && driver.department !== region.department) {
        return false;
      }
      if (region.province !== "" && driver.province !== region.province) {
        return false;
      }
      if (region.district !== "" && driver.district !== region.district) {
        return false;
      }
      return true;
    });
  }, [drivers, search, region]);

  return (
    <AdminPage>
      <AdminPageHeader title="Choferes" />

      <AdminRegionFilters
        value={region}
        onChange={setRegion}
        allowedScopes={isFullAdmin ? undefined : districtScopes}
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar nombre, DNI o placa"
          className={inputClass}
        />
      </AdminRegionFilters>

      <AdminCard>
        {filteredDrivers === undefined ? (
          <AdminLoading message="Cargando choferes…" />
        ) : filteredDrivers.length === 0 ? (
          <AdminEmpty message="No hay choferes con estos filtros." />
        ) : (
          <AdminTableWrap>
            <table className={tableClass}>
              <thead className={tableHeadClass}>
                <tr>
                  <th className={thClass}>Chofer</th>
                  <th className={thClass}>DNI</th>
                  <th className={thClass}>Zona</th>
                  <th className={thClass}>Estado</th>
                  <th className={thClass}>Registro</th>
                  <th className={thClass}></th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((driver) => {
                  const application = applicationByUserId.get(driver.userId);
                  const isExpanded = expandedUserId === driver.userId;
                  return (
                    <Fragment key={driver._id}>
                      <tr className={rowClass}>
                        <td className={`${tdClass} font-medium text-slate-900`}>
                          {driver.fullName ?? "Sin nombre"}
                        </td>
                        <td className={tdClass}>{driver.dni ?? "—"}</td>
                        <td className={tdClass}>{zoneLabel(driver) || "—"}</td>
                        <td className={`${tdClass} capitalize`}>
                          {driver.status}
                        </td>
                        <td className={`${tdClass} text-slate-500`}>
                          {formatDate(driver._creationTime)}
                        </td>
                        <td className={tdClass}>
                          <button
                            type="button"
                            className={btnGhostClass}
                            onClick={() =>
                              setExpandedUserId(
                                isExpanded ? null : driver.userId,
                              )
                            }
                          >
                            {isExpanded ? "Ocultar" : "Ver registro"}
                          </button>
                        </td>
                      </tr>
                      {isExpanded ? (
                        <tr>
                          <td colSpan={6} className="px-0 pb-4 pt-1">
                            <div className="sticky left-0 w-[min(36rem,calc(100vw-2.5rem))]">
                              <DriverDossierPanel
                                application={application ?? null}
                                userName={driver.fullName ?? "Chofer"}
                              />
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </AdminTableWrap>
        )}
      </AdminCard>
    </AdminPage>
  );
}
