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
  rowClass,
  selectClass as uiSelectClass,
  tableClass,
  tableHeadClass,
  tdClass,
  thClass,
} from "../lib/adminUi";
import type { DistrictScopeOption } from "../components/AdminRegionFilters";

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

type AccountsViewProps = {
  isFullAdmin: boolean;
  districtScopes: DistrictScopeOption[];
};

export function AccountsView({
  isFullAdmin,
  districtScopes,
}: AccountsViewProps) {
  const [region, setRegion] = useState<RegionFilter>(EMPTY_REGION_FILTER);
  const [roleFilter, setRoleFilter] = useState<"" | "client" | "admin" | "superadmin">("");
  const [search, setSearch] = useState("");

  const users = useQuery(
    api.users.listAll,
    roleFilter !== "" ? { role: roleFilter } : {},
  );
  const regionalServices = useQuery(
    api.services.listAllForAdmin,
    hasRegionFilter(region) ? regionToQueryArgs(region) : "skip",
  );
  const setRole = useMutation(api.users.setRole);

  const filteredUsers = useMemo(() => {
    if (users === undefined) {
      return undefined;
    }

    let result = users.filter(
      (user) =>
        user.role !== "driver" &&
        matchesTextSearch(search, [user.name, user.email, user.phone]),
    );

    if (hasRegionFilter(region) && regionalServices !== undefined) {
      const clientIds = new Set(
        regionalServices.map((service) => service.clientId),
      );
      result = result.filter((user) => clientIds.has(user._id));
    }

    return result;
  }, [users, regionalServices, region, search]);

  async function handleRoleChange(
    userId: Id<"users">,
    role: Doc<"users">["role"],
  ) {
    await setRole({ userId, role });
  }

  return (
    <AdminPage>
      <AdminPageHeader title="Cuentas de usuario" />

      <AdminRegionFilters
        value={region}
        onChange={setRegion}
        allowedScopes={isFullAdmin ? undefined : districtScopes}
      >
        {isFullAdmin ? (
          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value as "" | "client" | "admin" | "superadmin",
              )
            }
            className={selectClass}
          >
            <option value="">Todos los roles</option>
            <option value="client">Clientes</option>
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
                  <th className={`${thClass} hidden sm:table-cell`}>Registro</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className={rowClass}>
                    <td className={`${tdClass} font-medium text-slate-900`}>
                      {user.name ?? "Sin nombre"}
                    </td>
                    <td className={tdClass}>{user.email ?? "—"}</td>
                    <td className={`${tdClass} hidden md:table-cell`}>
                      {user.phone ?? "—"}
                    </td>
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
                    <td className={`${tdClass} hidden text-slate-500 sm:table-cell`}>
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
