import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc, Id } from "@proyecto/backend/dataModel";
import { AdminRegionFilters } from "../components/AdminRegionFilters";
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
  btnPrimaryClass,
  btnSecondaryClass,
  filterPanelClass,
  rowClass,
  selectClass as uiSelectClass,
  tableClass,
  tableHeadClass,
  tdClass,
  thClass,
} from "../lib/adminUi";
import type { DistrictScopeOption } from "../components/AdminRegionFilters";
import { CreateAdminUserForm } from "./TeamView";

const ROLE_LABELS: Record<string, string> = {
  client: "Cliente",
  admin: "Admin",
  superadmin: "Superadmin",
};

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

type StaffRoleFilter = "" | "admin" | "superadmin";

type AccountsViewProps = {
  isFullAdmin: boolean;
  districtScopes: DistrictScopeOption[];
  audience?: "staff" | "clients";
};

export function AccountsView({
  isFullAdmin,
  districtScopes,
  audience = "staff",
}: AccountsViewProps) {
  const isClients = audience === "clients";
  const [region, setRegion] = useState<RegionFilter>(EMPTY_REGION_FILTER);
  const [roleFilter, setRoleFilter] = useState<StaffRoleFilter>("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const users = useQuery(
    api.users.listAll,
    isClients
      ? { role: "client" }
      : roleFilter !== ""
        ? { role: roleFilter }
        : {},
  );
  const regionalServices = useQuery(
    api.services.listAllForAdmin,
    isClients && hasRegionFilter(region)
      ? regionToQueryArgs(region)
      : "skip",
  );
  const setRole = useMutation(api.users.setRole);

  const filteredUsers = useMemo(() => {
    if (users === undefined) {
      return undefined;
    }

    let result = users.filter((user) =>
      matchesTextSearch(search, [user.name, user.email, user.phone]),
    );

    if (isClients) {
      result = result.filter((user) => user.role === "client");
      if (hasRegionFilter(region) && regionalServices !== undefined) {
        const clientIds = new Set(
          regionalServices.map((service) => service.clientId),
        );
        result = result.filter((user) => clientIds.has(user._id));
      }
    } else {
      result = result.filter(
        (user) => user.role === "admin" || user.role === "superadmin",
      );
    }

    return result;
  }, [users, regionalServices, region, search, isClients]);

  async function handleRoleChange(
    userId: Id<"users">,
    role: Doc<"users">["role"],
  ) {
    await setRole({ userId, role });
  }

  return (
    <AdminPage>
      <AdminPageHeader
        title={isClients ? "Clientes" : "Cuentas de usuario"}
        actions={
          !isClients && isFullAdmin ? (
            <button
              type="button"
              className={`${showCreate ? btnSecondaryClass : btnPrimaryClass} w-full sm:w-auto`}
              onClick={() => setShowCreate((open) => !open)}
            >
              {showCreate ? "Cerrar" : "Crear usuario"}
            </button>
          ) : undefined
        }
      />

      {!isClients && isFullAdmin && showCreate ? (
        <AdminCard>
          <h3 className="text-base font-semibold text-zinc-900">
            Nuevo usuario admin
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Crea un admin con clave y asígnale uno o varios distritos.
          </p>
          <div className="mt-4">
            <CreateAdminUserForm onCreated={() => setShowCreate(false)} />
          </div>
        </AdminCard>
      ) : null}

      {isClients ? (
        <AdminRegionFilters
          value={region}
          onChange={setRegion}
          allowedScopes={isFullAdmin ? undefined : districtScopes}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar nombre, correo o teléfono"
            className={inputClass}
          />
        </AdminRegionFilters>
      ) : (
        <div className={`${filterPanelClass} flex flex-col gap-3 sm:flex-row sm:items-center`}>
          {isFullAdmin ? (
            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as StaffRoleFilter)
              }
              className={selectClass}
            >
              <option value="">Todos los roles</option>
              <option value="admin">Admins</option>
              <option value="superadmin">Superadmin</option>
            </select>
          ) : null}
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar nombre, correo o teléfono"
            className={inputClass}
          />
        </div>
      )}

      <AdminCard>
        {filteredUsers === undefined ? (
          <AdminLoading
            message={isClients ? "Cargando clientes…" : "Cargando usuarios…"}
          />
        ) : filteredUsers.length === 0 ? (
          <AdminEmpty
            message={
              isClients
                ? "No hay clientes con estos filtros."
                : "No hay cuentas con estos filtros."
            }
          />
        ) : (
          <AdminTableWrap>
            <table className={tableClass}>
              <thead className={tableHeadClass}>
                <tr>
                  <th className={thClass}>Usuario</th>
                  <th className={thClass}>Correo</th>
                  <th className={thClass}>Teléfono</th>
                  <th className={thClass}>Rol</th>
                  <th className={thClass}>Registro</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className={rowClass}>
                    <td className={`${tdClass} font-medium text-slate-900`}>
                      {user.name ?? "Sin nombre"}
                    </td>
                    <td className={tdClass}>{user.email ?? "—"}</td>
                    <td className={tdClass}>{user.phone ?? "—"}</td>
                    <td className={tdClass}>
                      {isFullAdmin && user.role !== "admin" ? (
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
                          <option value="superadmin">
                            {ROLE_LABELS.superadmin}
                          </option>
                        </select>
                      ) : (
                        <span className="text-xs font-medium text-zinc-600">
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      )}
                    </td>
                    <td className={`${tdClass} text-slate-500`}>
                      {formatDate(user._creationTime)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableWrap>
        )}
      </AdminCard>
    </AdminPage>
  );
}
