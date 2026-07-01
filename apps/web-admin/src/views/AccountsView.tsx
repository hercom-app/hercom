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

const ROLE_LABELS: Record<string, string> = {
  client: "Cliente",
  driver: "Chofer",
  admin: "Administrador",
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
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Cuentas</h1>
        <p className="text-sm text-slate-500">
          Usuarios registrados. En choferes puedes abrir el expediente (DNI,
          brevete, CUL) para evaluarlo.
        </p>
      </div>

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
          <option value="admin">Administradores</option>
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

      <section className="rounded-3xl bg-white p-6 shadow-lg">
        {filteredUsers === undefined ? (
          <p className="text-sm text-slate-500">Cargando usuarios...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-sm text-slate-500">No hay cuentas con estos filtros.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4">Usuario</th>
                  <th className="py-2 pr-4">Correo</th>
                  <th className="py-2 pr-4">Teléfono</th>
                  <th className="py-2 pr-4">Rol</th>
                  <th className="py-2 pr-4">Expediente</th>
                  <th className="py-2">Registro</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const application = applicationByUserId.get(user._id);
                  const isDriver = user.role === "driver";
                  const isExpanded = expandedUserId === user._id;
                  return (
                    <Fragment key={user._id}>
                      <tr className="border-b border-slate-100">
                        <td className="py-3 pr-4 font-medium text-slate-800">
                          {user.name ?? "Sin nombre"}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {user.email ?? "—"}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {user.phone ?? "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <select
                            value={user.role}
                            onChange={(event) =>
                              void handleRoleChange(
                                user._id,
                                event.target.value as Doc<"users">["role"],
                              )
                            }
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                          >
                            <option value="client">{ROLE_LABELS.client}</option>
                            <option value="driver">{ROLE_LABELS.driver}</option>
                            <option value="admin">{ROLE_LABELS.admin}</option>
                          </select>
                        </td>
                        <td className="py-3 pr-4">
                          {isDriver ? (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedUserId(isExpanded ? null : user._id)
                              }
                              className="text-xs font-semibold text-hercom hover:underline"
                            >
                              {isExpanded
                                ? "Ocultar expediente"
                                : application !== undefined
                                  ? "Ver brevete y CUL"
                                  : "Sin expediente"}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 text-slate-500">
                          {formatDate(user._creationTime)}
                        </td>
                      </tr>
                      {isDriver && isExpanded && (
                        <tr>
                          <td colSpan={6} className="pb-4 pt-1">
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
          </div>
        )}
      </section>
    </div>
  );
}
