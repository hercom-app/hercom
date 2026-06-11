import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";

const ROLE_LABELS: Record<string, string> = {
  client: "Cliente",
  driver: "Chofer",
  admin: "Administrador",
};

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function UsersPanel() {
  const users = useQuery(api.users.listAll, {});
  const setRole = useMutation(api.users.setRole);

  if (users === undefined) {
    return <p className="text-sm text-slate-500">Cargando usuarios...</p>;
  }

  async function handleRoleChange(
    userId: Id<"users">,
    role: "client" | "driver" | "admin",
  ) {
    await setRole({ userId, role });
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-900">
          Cuentas registradas
        </h2>
        <span className="text-sm text-slate-500">
          {users.length} {users.length === 1 ? "persona" : "personas"}
        </span>
      </div>

      {users.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aún no hay cuentas registradas.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Usuario</th>
                <th className="py-2 pr-4">Correo</th>
                <th className="py-2 pr-4">Teléfono</th>
                <th className="py-2 pr-4">Rol</th>
                <th className="py-2">Registro</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-slate-100">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      {user.image !== undefined ? (
                        <img
                          src={user.image}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                          {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-slate-800">
                        {user.name ?? "Sin nombre"}
                      </span>
                    </div>
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
                      onChange={(e) =>
                        void handleRoleChange(
                          user._id,
                          e.target.value as "client" | "driver" | "admin",
                        )
                      }
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                    >
                      <option value="client">{ROLE_LABELS.client}</option>
                      <option value="driver">{ROLE_LABELS.driver}</option>
                      <option value="admin">{ROLE_LABELS.admin}</option>
                    </select>
                  </td>
                  <td className="py-3 text-slate-500">
                    {formatDate(user._creationTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
