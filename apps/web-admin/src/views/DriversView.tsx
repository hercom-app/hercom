import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import { AdminRegionFilters } from "../components/AdminRegionFilters";
import type { DistrictScopeOption } from "../components/AdminRegionFilters";
import {
  DriverDossierPanel,
  type DriverApplicationForAdmin,
} from "../components/DriverDossierPanel";
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
  btnSecondaryClass,
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
};

export function DriversView({
  isFullAdmin,
  districtScopes,
}: DriversViewProps) {
  const [region, setRegion] = useState<RegionFilter>(EMPTY_REGION_FILTER);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(
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

  const rows = useMemo((): ChoferRow[] | undefined => {
    if (drivers === undefined || applications === undefined) {
      return undefined;
    }

    const driverUserIds = new Set(drivers.map((driver) => driver.userId));
    const fromDrivers: ChoferRow[] = drivers.map((driver) => {
      const application = applicationByUserId.get(driver.userId);
      return {
        key: driver._id,
        userId: driver.userId,
        fullName: driver.fullName ?? "Sin nombre",
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
        fullName:
          `${application.firstLastName} ${application.secondLastName} ${application.firstName}`.trim(),
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
      }));

    return [...pendingOnly, ...fromDrivers];
  }, [drivers, applications, applicationByUserId]);

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
    selectedUserId === null
      ? null
      : (rows ?? []).find((row) => row.userId === selectedUserId) ?? null;

  if (selectedUserId !== null) {
    return (
      <AdminPage>
        <AdminPageHeader
          title={selectedRow?.fullName ?? "Registro del chofer"}
          {...(selectedRow !== null
            ? {
                description: [selectedRow.dni, selectedRow.zone]
                  .filter(Boolean)
                  .join(" · "),
              }
            : {})}
          actions={
            <button
              type="button"
              className={`${btnSecondaryClass} w-full sm:w-auto`}
              onClick={() => setSelectedUserId(null)}
            >
              Volver a choferes
            </button>
          }
        />
        {rows === undefined ? (
          <AdminCard>
            <AdminLoading message="Cargando registro…" />
          </AdminCard>
        ) : selectedRow === null ? (
          <AdminCard>
            <AdminEmpty message="No se encontró este chofer." />
          </AdminCard>
        ) : (
          <DriverDossierPanel
            application={selectedRow.application}
            userName={selectedRow.fullName}
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
          placeholder="Buscar nombre, DNI o placa"
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
                      {row.statusLabel}
                    </td>
                    <td className={`${tdClass} text-xs text-slate-600`}>
                      {row.documentsLabel}
                    </td>
                    <td className={`${tdClass} text-slate-500`}>
                      {formatDate(row.registeredAt)}
                    </td>
                    <td className={tdClass}>
                      <button
                        type="button"
                        className={btnGhostClass}
                        onClick={() => setSelectedUserId(row.userId)}
                      >
                        Ver registro
                      </button>
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
