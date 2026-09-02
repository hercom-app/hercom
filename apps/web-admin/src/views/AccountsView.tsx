import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc, Id } from "@proyecto/backend/dataModel";
import { AdminRegionFilters } from "../components/AdminRegionFilters";
import { DriverDossierPanel } from "../components/DriverDossierPanel";
import {
  EMPTY_REGION_FILTER,
  hasRegionFilter,
  inputClass,
  matchesTextSearch,
  regionToQueryArgs,
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
  selectClass as uiSelectClass,
  tableClass,
  tableHeadClass,
  tdClass,
  thClass,
} from "../lib/adminUi";

const ROLE_LABELS: Record<string, string> = {
  client: "Cliente",
  driver: "Chofer",
  admin: "Admin",
  superadmin: "Superadmin",
};

type ApplicationStatusFilter =
  | ""
  | Doc<"driverApplications">["status"];

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function AccountsView() {
  const [region, setRegion] = useState<RegionFilter>(EMPTY_REGION_FILTER);
  const [roleFilter, setRoleFilter] = useState<"" | Doc<"users">["role"]>("");
  const [applicationStatusFilter, setApplicationStatusFilter] =
    useState<ApplicationStatusFilter>("");
  const [search, setSearch] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<Id<"users"> | null>(null);

  const users = useQuery(
    api.users.listAll,
    roleFilter !== "" ? { role: roleFilter } : {},
  );
  const drivers = useQuery(api.drivers.listAll, {});
  const driverApplications = useQuery(
    api.driverApplications.listForAdmin,
    applicationStatusFilter !== ""
      ? { status: applicationStatusFilter }
      : {},
  );
  const regionalServices = useQuery(
    api.services.listAllForAdmin,
    hasRegionFilter(region) ? regionToQueryArgs(region) : "skip",
  );
  const setRole = useMutation(api.users.setRole);

  const applicationByUserId = useMemo(() => {
    if (driverApplications === undefined) {
      return new Map();
    }
    const map = new Map<Id<"users">, (typeof driverApplications)[number]>();
    for (const application of driverApplications) {
      if (!map.has(application.userId)) {
        map.set(application.userId, application);
      }
    }
    return map;
  }, [driverApplications]);

  const filteredUsers = useMemo(() => {
    if (users === undefined) {
      return undefined;
    }

    let result = users.filter((user) =>
      matchesTextSearch(search, [user.name, user.email, user.phone]),
    );

    if (applicationStatusFilter !== "") {
      result = result.filter((user) => {
        const application = applicationByUserId.get(user._id);
        return application?.status === applicationStatusFilter;
      });
    }

    if (hasRegionFilter(region) && regionalServices !== undefined && drivers !== undefined) {
      const clientIds = new Set(regionalServices.map((service) => service.clientId));
      const driverUserIds = new Set(
        regionalServices
          .map((service) => service.driverId)
          .filter((id): id is Id<"drivers"> => id !== undefined)
          .map((driverId) => drivers.find((driver) => driver._id === driverId)?.userId)
          .filter((userId): userId is Id<"users"> => userId !== undefined),
      );

      result = result.filter(
        (user) => clientIds.has(user._id) || driverUserIds.has(user._id),
      );
    }

    return result;
  }, [
    users,
    drivers,
    regionalServices,
    region,
    search,
    applicationByUserId,
    applicationStatusFilter,
  ]);

  async function handleRoleChange(
    userId: Id<"users">,
    role: Doc<"users">["role"],
  ) {
    await setRole({ userId, role });
  }

  return (
    <AdminPage>
      <AdminPageHeader
        title="Cuentas"
        description="Usuarios registrados. En choferes puedes abrir el expediente (DNI, brevete, CUL) para evaluarlo."
      />

      <AdminRegionFilters value={region} onChange={setRegion}>
        <select
          value={roleFilter}
          onChange={(event) =>
            setRoleFilter(event.target.value as "" | Doc<"users">["role"])
          }
          className={selectClass}
        >
          <option value="">Todos los roles</option>
          <option value="client">Clientes</option>
          <option value="driver">Choferes</option>
          <option value="admin">Admins</option>
          <option value="superadmin">Superadmin</option>
        </select>
        <select
          value={applicationStatusFilter}
          onChange={(event) =>
            setApplicationStatusFilter(
              event.target.value as ApplicationStatusFilter,
            )
          }
          className={selectClass}
        >
          <option value="">Expediente: todos</option>
          <option value="pending">Pendiente de revisión</option>
          <option value="approved">Expediente aprobado</option>
          <option value="rejected">Expediente rechazado</option>
        </select>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar nombre, correo o teléfono"
          className={inputClass}
        />
      </AdminRegionFilters>

      <AdminCard>
        {filteredUsers === undefined ? (
          <AdminLoading message="Cargando usuarios…" />
        ) : filteredUsers.length === 0 ? (
          <AdminEmpty message="No hay cuentas con estos filtros." />
        ) : (
          <AdminTableWrap>
            <table className={tableClass}>
              <thead className={tableHeadClass}>
                <tr>
                  <th className={thClass}>Usuario</th>
                  <th className={thClass}>Correo</th>
                  <th className={`${thClass} hidden md:table-cell`}>Teléfono</th>
                  <th className={thClass}>Rol</th>
                  <th className={thClass}>Expediente</th>
                  <th className={`${thClass} hidden sm:table-cell`}>Registro</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const application = applicationByUserId.get(user._id);
                  const isDriver = user.role === "driver";
                  const isExpanded = expandedUserId === user._id;
                  return (
                    <Fragment key={user._id}>
                      <tr className={rowClass}>
                        <td className={`${tdClass} font-medium text-slate-900`}>
                          {user.name ?? "Sin nombre"}
                        </td>
                        <td className={tdClass}>{user.email ?? "—"}</td>
                        <td className={`${tdClass} hidden md:table-cell`}>
                          {user.phone ?? "—"}
                        </td>
                        <td className={tdClass}>
                          <select
                            value={user.role}
                            onChange={(event) =>
                              void handleRoleChange(
                                user._id,
                                event.target.value as Doc<"users">["role"],
                              )
                            }
                            className={`${uiSelectClass} !py-1.5 text-xs`}
                          >
                            <option value="client">{ROLE_LABELS.client}</option>
                            <option value="driver">{ROLE_LABELS.driver}</option>
                            {user.role === "admin" ? (
                              <option value="admin">{ROLE_LABELS.admin}</option>
                            ) : null}
                            <option value="superadmin">
                              {ROLE_LABELS.superadmin}
                            </option>
                          </select>
                        </td>
                        <td className={tdClass}>
                          {isDriver ? (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedUserId(isExpanded ? null : user._id)
                              }
                              className={btnGhostClass}
                            >
                              {isExpanded
                                ? "Ocultar"
                                : application !== undefined
                                  ? "Ver expediente"
                                  : "Sin expediente"}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className={`${tdClass} hidden text-slate-500 sm:table-cell`}>
                          {formatDate(user._creationTime)}
                        </td>
                      </tr>
                      {isDriver && isExpanded && (
                        <tr>
                          <td colSpan={6} className="px-0 pb-4 pt-1">
                            <DriverDossierPanel
                              application={application ?? null}
                              userName={user.name ?? user.email ?? "Chofer"}
                            />
                          </td>
                        </tr>
                      )}
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
