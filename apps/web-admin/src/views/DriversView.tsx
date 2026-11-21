import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import { AdminRegionFilters } from "../components/AdminRegionFilters";
import type { DistrictScopeOption } from "../components/AdminRegionFilters";
import { isDriverApplicantMinor } from "@proyecto/backend/age";
import {
  formatPeruPersonFullName,
  formatPersonNameForDisplay,
  splitPeruDisplayFullName,
} from "@proyecto/backend/personName";
import { resolveAdminDriverRowStatus } from "@proyecto/backend/statusLabels";
import {
  DriverDossierPanel,
  type DriverApplicationForAdmin,
  type DriverFinanceInfo,
} from "../components/DriverDossierPanel";
import { DriverServicesHistory } from "../components/DriverServicesHistory";
import { ServiceLivePanel } from "../components/ServiceLivePanel";
import { AdminPagination, usePagedItems } from "../components/AdminPagination";
import {
  EMPTY_REGION_FILTER,
  hasRegionFilter,
  inputClass,
  matchesTextSearch,
  selectClass,
  type RegionFilter,
} from "../lib/adminFilters";
import {
  AdminCard,
  AdminEmpty,
  AdminLoading,
  AdminPage,
  AdminTableWrap,
} from "../components/AdminLayout";
import {
  btnPrimaryClass,
  btnSecondaryClass,
  rowClass,
  tableClass,
  tableHeadClass,
  tdClass,
  thClass,
} from "../lib/adminUi";

const DRIVERS_PAGE_SIZE = 20;

function nameLinesFromApplication(application: {
  firstLastName: string;
  secondLastName: string;
  firstName: string;
}): { surnames: string; givenNames: string } {
  return splitPeruDisplayFullName(
    formatPeruPersonFullName({
      firstLastName: application.firstLastName,
      secondLastName: application.secondLastName,
      firstName: application.firstName,
    }),
  );
}

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
  showFinance?: boolean;
  canEditHrExtras?: boolean;
  districtScopes: DistrictScopeOption[];
  /** Incrementa al pulsar «Choferes» en el menú para salir del detalle. */
  listResetKey?: number;
};

type ChoferRow = {
  key: string;
  userId: Id<"users">;
  nameSurnames: string;
  nameGivenNames: string;
  dni: string | undefined;
  department: string | undefined;
  province: string | undefined;
  district: string | undefined;
  zone: string;
  statusLabel: string;
  registeredAt: number;
  application: DriverApplicationForAdmin | null;
  finance: DriverFinanceInfo;
  driverId: Id<"drivers"> | null;
};

export function DriversView({
  isFullAdmin,
  showFinance = isFullAdmin,
  canEditHrExtras = false,
  districtScopes,
  listResetKey = 0,
}: DriversViewProps) {
  const [region, setRegion] = useState<RegionFilter>(EMPTY_REGION_FILTER);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [detail, setDetail] = useState<{
    userId: Id<"users">;
    section: "registro" | "historial";
  } | null>(null);
  const [openServiceId, setOpenServiceId] = useState<Id<"services"> | null>(null);

  useEffect(() => {
    setDetail(null);
    setOpenServiceId(null);
  }, [listResetKey]);

  const drivers = useQuery(api.drivers.listAll, {});
  const applications = useQuery(api.driverApplications.listForAdmin, {});
  const wallets = useQuery(
    api.driverWallets.listForAdmin,
    isFullAdmin ? {} : "skip",
  );

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

  const rows = useMemo((): ChoferRow[] | undefined => {
    if (drivers === undefined || applications === undefined) {
      return undefined;
    }

    const walletByDriverId = new Map(
      (wallets ?? []).map((wallet) => [wallet.driverId, wallet.balance]),
    );
    const driverUserIds = new Set(drivers.map((driver) => driver.userId));
    const fromDrivers: ChoferRow[] = drivers.map((driver) => {
      const application = applicationByUserId.get(driver.userId);
      const displayName =
        formatPersonNameForDisplay(driver.fullName) || "Sin nombre";
      const nameParts = splitPeruDisplayFullName(displayName);
      return {
        key: driver._id,
        userId: driver.userId,
        nameSurnames: nameParts.surnames || displayName,
        nameGivenNames: nameParts.givenNames,
        dni: driver.dni,
        department: driver.department,
        province: driver.province,
        district: driver.district,
        zone: zoneLabel(driver),
        statusLabel: resolveAdminDriverRowStatus({
          driverStatus: driver.status,
          ...(application !== undefined
            ? { applicationStatus: application.status }
            : {}),
        }),
        registeredAt: driver._creationTime,
        application: application ?? null,
        driverId: driver._id,
        finance: {
          hasProfile: true,
          fullName: driver.fullName,
          dni: driver.dni,
          yape: driver.yape,
          plin: driver.plin,
          bankAccount1: driver.bankAccount1,
          bankAccount2: driver.bankAccount2,
          bankAccount3: driver.bankAccount3,
          walletBalance: walletByDriverId.get(driver._id),
        },
      };
    });

    const pendingOnly: ChoferRow[] = applications
      .filter(
        (application) =>
          application.status === "pending" &&
          !driverUserIds.has(application.userId),
      )
      .map((application) => {
        const nameParts = nameLinesFromApplication(application);
        return {
        key: `app-${application._id}`,
        userId: application.userId,
        nameSurnames: nameParts.surnames || "Sin nombre",
        nameGivenNames: nameParts.givenNames,
        dni: application.dni,
        department: application.department,
        province: application.province,
        district: application.district,
        zone: zoneLabel(application),
        statusLabel: resolveAdminDriverRowStatus({
          applicationStatus: application.status,
        }),
        registeredAt: application.submittedAt,
        application,
        driverId: null,
        finance: {
          hasProfile: false,
          fullName: undefined,
          dni: undefined,
          yape: undefined,
          plin: undefined,
          bankAccount1: undefined,
          bankAccount2: undefined,
          bankAccount3: undefined,
          walletBalance: undefined,
        },
      };
      });

    return [...pendingOnly, ...fromDrivers];
  }, [drivers, applications, applicationByUserId, wallets]);

  const filteredRows = useMemo(() => {
    if (rows === undefined) {
      return undefined;
    }
    return rows.filter((row) => {
      if (
        !matchesTextSearch(search, [
          row.nameSurnames,
          row.nameGivenNames,
          row.dni,
          row.application?.licenseNumber,
        ])
      ) {
        return false;
      }
      if (hasRegionFilter(region)) {
        if (region.department !== "" && row.department !== region.department) {
          return false;
        }
        if (region.province !== "" && row.province !== region.province) {
          return false;
        }
        if (region.district !== "" && row.district !== region.district) {
          return false;
        }
      }
      if (statusFilter === "pending") {
        return row.application?.status === "pending";
      }
      if (statusFilter === "approved") {
        return row.application?.status === "approved";
      }
      if (statusFilter === "rejected") {
        return row.application?.status === "rejected";
      }
      return true;
    });
  }, [rows, search, region, statusFilter]);

  const { page, setPage, pageCount, total, paged, pageSize } = usePagedItems(
    filteredRows,
    `${region.department}|${region.province}|${region.district}|${search}|${statusFilter}`,
    DRIVERS_PAGE_SIZE,
  );

  const selectedRow =
    detail === null
      ? null
      : (rows ?? []).find((row) => row.userId === detail.userId) ?? null;

  if (detail !== null && detail.section === "historial" && openServiceId !== null) {
    return (
      <AdminPage>
        <ServiceLivePanel
          serviceId={openServiceId}
          onClose={() => setOpenServiceId(null)}
        />
      </AdminPage>
    );
  }

  if (detail !== null) {
    const title =
      detail.section === "historial"
        ? "Historial de servicios"
        : [selectedRow?.nameSurnames, selectedRow?.nameGivenNames]
            .filter((part) => part !== "")
            .join(" ") || "Registro del chofer";
    const description =
      selectedRow === null
        ? ""
        : (detail.section === "historial"
            ? [
                selectedRow.nameSurnames,
                selectedRow.nameGivenNames,
                selectedRow.dni,
                selectedRow.zone,
              ]
            : [selectedRow.dni, selectedRow.zone]
          )
            .filter((part) => part !== undefined && part !== "")
            .join(" · ");
    return (
      <AdminPage>
        <div className="mb-4">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            {title}
          </h2>
          {description !== "" ? (
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          ) : null}
        </div>
        {rows === undefined ? (
          <AdminCard>
            <AdminLoading message="Cargando registro…" />
          </AdminCard>
        ) : selectedRow === null ? (
          <AdminCard>
            <AdminEmpty message="No se encontró este chofer." />
          </AdminCard>
        ) : detail.section === "historial" ? (
          <DriverServicesHistory
            driverId={selectedRow.driverId}
            onOpenService={setOpenServiceId}
          />
        ) : (
          <DriverDossierPanel
            application={selectedRow.application}
            userName={[selectedRow.nameSurnames, selectedRow.nameGivenNames]
              .filter((part) => part !== "")
              .join(" ")}
            finance={selectedRow.finance}
            showFinance={showFinance}
            canEditHrExtras={canEditHrExtras}
          />
        )}
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <AdminRegionFilters
        layout="inline"
        value={region}
        onChange={setRegion}
        allowedScopes={isFullAdmin ? undefined : districtScopes}
        onClear={() => {
          setSearch("");
          setStatusFilter("");
        }}
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar nombre o DNI"
          className={`${inputClass} min-w-[11rem]`}
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className={`${selectClass} min-w-[11rem]`}
        >
          <option value="">Estado: todos</option>
          <option value="pending">Pendiente de revisión</option>
          <option value="approved">Aprobada</option>
          <option value="rejected">Rechazada</option>
        </select>
      </AdminRegionFilters>

      <AdminCard>
        {filteredRows === undefined ? (
          <AdminLoading message="Cargando choferes…" />
        ) : filteredRows.length === 0 ? (
          <AdminEmpty message="No hay choferes ni solicitudes con estos filtros." />
        ) : (
          <>
          <AdminPagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            className="mb-3 border-b border-zinc-100 pb-3"
          />
          <AdminTableWrap>
            <table className={tableClass}>
              <thead className={tableHeadClass}>
                <tr>
                  <th className={thClass}>Chofer</th>
                  <th className={thClass}>DNI</th>
                  <th className={thClass}>Zona</th>
                  <th className={thClass}>Estado</th>
                  <th className={thClass}>Registro</th>
                  <th className={thClass}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(paged ?? []).map((row) => (
                  <tr key={row.key} className={rowClass}>
                    <td className={`${tdClass} max-w-[11rem] whitespace-normal font-medium text-slate-900`}>
                      <span className="block leading-snug">{row.nameSurnames}</span>
                      {row.nameGivenNames !== "" ? (
                        <span className="block text-sm font-normal text-slate-600">
                          {row.nameGivenNames}
                        </span>
                      ) : null}
                    </td>
                    <td className={tdClass}>{row.dni ?? "—"}</td>
                    <td className={tdClass}>{row.zone || "—"}</td>
                    <td className={tdClass}>
                      <span>{row.statusLabel}</span>
                      {row.application !== null &&
                      row.application.status === "pending" &&
                      isDriverApplicantMinor(row.application.birthDate) ? (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold normal-case text-amber-900">
                          Menor de 18
                        </span>
                      ) : null}
                    </td>
                    <td className={`${tdClass} text-slate-500`}>
                      {formatDate(row.registeredAt)}
                    </td>
                    <td className={`${tdClass} whitespace-normal`}>
                      <div className="flex min-w-[12.5rem] flex-col items-stretch gap-2">
                        <button
                          type="button"
                          className={`${btnPrimaryClass} min-h-9 px-3 py-1.5 text-xs`}
                          onClick={() =>
                            setDetail({
                              userId: row.userId,
                              section: "registro",
                            })
                          }
                        >
                          Registro
                        </button>
                        <button
                          type="button"
                          className={`${btnSecondaryClass} min-h-9 px-3 py-1.5 text-xs`}
                          onClick={() =>
                            setDetail({
                              userId: row.userId,
                              section: "historial",
                            })
                          }
                        >
                          Historial de servicios
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableWrap>
          <AdminPagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            className="mt-4 border-t border-zinc-100 pt-4"
          />
          </>
        )}
      </AdminCard>
    </AdminPage>
  );
}
