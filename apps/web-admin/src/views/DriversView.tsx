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
} from "@proyecto/backend/personName";
import {
  DriverDossierPanel,
  type DriverApplicationForAdmin,
  type DriverFinanceInfo,
} from "../components/DriverDossierPanel";
import { DriverServicesHistory } from "../components/DriverServicesHistory";
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
  showFinance?: boolean;
  canEditHrExtras?: boolean;
  districtScopes: DistrictScopeOption[];
  /** Incrementa al pulsar «Choferes» en el menú para salir del detalle. */
  listResetKey?: number;
};

type ChoferRow = {
  key: string;
  userId: Id<"users">;
  fullName: string;
  dni: string | undefined;
  department: string | undefined;
  province: string | undefined;
  district: string | undefined;
  zone: string;
  statusLabel: string;
  documentsLabel: string;
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

  useEffect(() => {
    setDetail(null);
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
      (wallets ?? []).map((wallet) => [wallet.driverId, wallet.tripCredits]),
    );
    const driverUserIds = new Set(drivers.map((driver) => driver.userId));
    const fromDrivers: ChoferRow[] = drivers.map((driver) => {
      const application = applicationByUserId.get(driver.userId);
      return {
        key: driver._id,
        userId: driver.userId,
        fullName:
          formatPersonNameForDisplay(driver.fullName) || "Sin nombre",
        dni: driver.dni,
        department: driver.department,
        province: driver.province,
        district: driver.district,
        zone: zoneLabel(driver),
        statusLabel: driver.status,
        documentsLabel:
          application === undefined
            ? "Sin solicitud"
            : [
                application.conductorRecordPdfUrl !== null
                  ? "Récord"
                  : "Récord pendiente",
                application.culPdfUrl !== null ? "CUL" : "CUL pendiente",
              ].join(" · "),
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
          tripCredits: walletByDriverId.get(driver._id),
        },
      };
    });

    const pendingOnly: ChoferRow[] = applications
      .filter(
        (application) =>
          application.status === "pending" &&
          !driverUserIds.has(application.userId),
      )
      .map((application) => ({
        key: `app-${application._id}`,
        userId: application.userId,
        fullName: formatPeruPersonFullName({
          firstLastName: application.firstLastName,
          secondLastName: application.secondLastName,
          firstName: application.firstName,
        }),
        dni: application.dni,
        department: application.department,
        province: application.province,
        district: application.district,
        zone: zoneLabel(application),
        statusLabel: "Pendiente de revisión",
        documentsLabel: [
          application.conductorRecordPdfUrl !== null
            ? "Récord"
            : "Récord pendiente",
          application.culPdfUrl !== null ? "CUL" : "CUL pendiente",
        ].join(" · "),
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
          tripCredits: undefined,
        },
      }));

    return [...pendingOnly, ...fromDrivers];
  }, [drivers, applications, applicationByUserId, wallets]);

  const filteredRows = useMemo(() => {
    if (rows === undefined) {
      return undefined;
    }
    return rows.filter((row) => {
      if (
        !matchesTextSearch(search, [
          row.fullName,
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

  const { page, setPage, pageCount, total, paged } = usePagedItems(
    filteredRows,
    `${region.department}|${region.province}|${region.district}|${search}|${statusFilter}`,
  );

  const selectedRow =
    detail === null
      ? null
      : (rows ?? []).find((row) => row.userId === detail.userId) ?? null;

  if (detail !== null) {
    const title =
      detail.section === "historial"
        ? "Historial de servicios"
        : (selectedRow?.fullName ?? "Registro del chofer");
    const description =
      selectedRow === null
        ? ""
        : (detail.section === "historial"
            ? [selectedRow.fullName, selectedRow.dni, selectedRow.zone]
            : [selectedRow.dni, selectedRow.zone]
          )
            .filter((part) => part !== undefined && part !== "")
            .join(" · ");
    return (
      <AdminPage>
        <AdminPageHeader
          title={title}
          {...(description !== "" ? { description } : {})}
        />
        {rows === undefined ? (
          <AdminCard>
            <AdminLoading message="Cargando registro…" />
          </AdminCard>
        ) : selectedRow === null ? (
          <AdminCard>
            <AdminEmpty message="No se encontró este chofer." />
          </AdminCard>
        ) : detail.section === "historial" ? (
          <DriverServicesHistory driverId={selectedRow.driverId} />
        ) : (
          <DriverDossierPanel
            application={selectedRow.application}
            userName={selectedRow.fullName}
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
      <AdminPageHeader title="Choferes" />

      <AdminRegionFilters
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
          className={inputClass}
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className={selectClass}
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
          <AdminTableWrap>
            <table className={tableClass}>
              <thead className={tableHeadClass}>
                <tr>
                  <th className={thClass}>Chofer</th>
                  <th className={thClass}>DNI</th>
                  <th className={thClass}>Zona</th>
                  <th className={thClass}>Estado</th>
                  <th className={thClass}>Documentos</th>
                  <th className={thClass}>Registro</th>
                  <th className={thClass}></th>
                </tr>
              </thead>
              <tbody>
                {(paged ?? []).map((row) => (
                  <tr key={row.key} className={rowClass}>
                    <td className={`${tdClass} font-medium text-slate-900`}>
                      {row.fullName}
                    </td>
                    <td className={tdClass}>{row.dni ?? "—"}</td>
                    <td className={tdClass}>{row.zone || "—"}</td>
                    <td className={`${tdClass} capitalize`}>
                      <span>{row.statusLabel}</span>
                      {row.application !== null &&
                      row.application.status === "pending" &&
                      isDriverApplicantMinor(row.application.birthDate) ? (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold normal-case text-amber-900">
                          Menor de 18
                        </span>
                      ) : null}
                    </td>
                    <td className={`${tdClass} text-xs text-slate-600`}>
                      {row.documentsLabel}
                    </td>
                    <td className={`${tdClass} text-slate-500`}>
                      {formatDate(row.registeredAt)}
                    </td>
                    <td className={`${tdClass} whitespace-normal`}>
                      <div className="flex flex-col items-start gap-1">
                        <button
                          type="button"
                          className={btnGhostClass}
                          onClick={() =>
                            setDetail({
                              userId: row.userId,
                              section: "registro",
                            })
                          }
                        >
                          Vista de registro
                        </button>
                        <button
                          type="button"
                          className={btnGhostClass}
                          onClick={() =>
                            setDetail({
                              userId: row.userId,
                              section: "historial",
                            })
                          }
                        >
                          Vista de historial de servicios
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
            onPageChange={setPage}
          />
          </>
        )}
      </AdminCard>
    </AdminPage>
  );
}
