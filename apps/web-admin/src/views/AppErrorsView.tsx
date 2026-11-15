import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import {
  AdminCard,
  AdminEmpty,
  AdminLoading,
  AdminPage,
} from "../components/AdminLayout";
import { AdminPagination, usePagedItems } from "../components/AdminPagination";
import { inputClass, rowClass } from "../lib/adminUi";

const KIND_LABEL: Record<string, string> = {
  js_error: "Error JS",
  boundary: "Pantalla",
  native_suspect: "Cierre inesperado",
};

const ROLE_LABEL: Record<string, string> = {
  client: "Cliente",
  driver: "Chofer",
  admin: "Admin",
  superadmin: "Superadmin",
  hr: "RR.HH.",
};

function formatWhen(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(timestamp));
}

function kindClass(kind: string): string {
  if (kind === "native_suspect") {
    return "bg-red-100 text-red-800";
  }
  if (kind === "boundary") {
    return "bg-amber-100 text-amber-800";
  }
  return "bg-slate-100 text-slate-700";
}

export function AppErrorsView() {
  const rows = useQuery(api.appErrors.listForAdmin, { limit: 200 });
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (rows === undefined) {
      return undefined;
    }
    const needle = search.trim().toLowerCase();
    if (needle === "") {
      return rows;
    }
    return rows.filter((row) => {
      const live = row.liveUser;
      const haystack = [
        row.message,
        row.userName,
        row.userEmail,
        row.userPhone,
        row.userDni,
        row.deviceId,
        row.deviceModel,
        row.screen,
        live?.name,
        live?.email,
        live?.phone,
        live?.dni,
        row.userId,
      ]
        .filter((value) => value !== undefined && value !== null)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [rows, search]);

  const { page, setPage, pageCount, total, paged } = usePagedItems(
    filtered,
    `${search}:${filtered?.length ?? "loading"}`,
  );

  return (
    <AdminPage>
      <AdminCard>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">
              Errores reportados por la app
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Cada fila identifica al usuario (nombre, correo, celular, DNI) y
              al celular.
            </p>
          </div>
          <input
            className={`${inputClass} sm:max-w-xs`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar usuario, DNI, dispositivo…"
          />
        </div>

        {paged === undefined ? (
          <AdminLoading message="Cargando errores…" />
        ) : paged.length === 0 ? (
          <AdminEmpty message="Todavía no hay errores reportados desde la app." />
        ) : (
          <ul className="divide-y divide-zinc-100">
            {paged.map((row) => {
              const live = row.liveUser;
              const name = live?.name ?? row.userName ?? "Sin sesión";
              const email = live?.email ?? row.userEmail ?? null;
              const phone = live?.phone ?? row.userPhone ?? null;
              const dni = live?.dni ?? row.userDni ?? null;
              const role = live?.role ?? row.userRole ?? null;
              const open = openId === row._id;
              const device = [row.deviceBrand, row.deviceModel]
                .filter(Boolean)
                .join(" ");
              return (
                <li key={row._id} className={rowClass}>
                  <button
                    type="button"
                    className="w-full px-0 py-3 text-left"
                    onClick={() =>
                      setOpenId(open ? null : row._id)
                    }
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {[
                            role !== null
                              ? (ROLE_LABEL[role] ?? role)
                              : null,
                            email,
                            phone,
                            dni !== null ? `DNI ${dni}` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Usuario no identificado"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${kindClass(row.kind)}`}
                        >
                          {KIND_LABEL[row.kind] ?? row.kind}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatWhen(row.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-700">
                      {row.message}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {[
                        device !== "" ? device : null,
                        row.osVersion,
                        row.appVersion !== undefined
                          ? `v${row.appVersion}`
                          : null,
                        row.screen,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </button>
                  {open ? (
                    <div className="mb-3 rounded-lg bg-zinc-50 px-3 py-3 text-xs text-slate-600">
                      <dl className="grid gap-1 sm:grid-cols-2">
                        <div>
                          <dt className="text-[11px] uppercase tracking-wide text-slate-400">
                            User ID
                          </dt>
                          <dd className="break-all font-mono">
                            {row.userId ?? "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[11px] uppercase tracking-wide text-slate-400">
                            Device ID
                          </dt>
                          <dd className="break-all font-mono">{row.deviceId}</dd>
                        </div>
                      </dl>
                      {row.stack !== undefined ? (
                        <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-white p-3 font-mono text-[11px] text-slate-700">
                          {row.stack}
                        </pre>
                      ) : (
                        <p className="mt-3 text-slate-500">
                          Sin stack. Si es un cierre inesperado, el crash fue
                          nativo (mapa / sistema) y no dejó traza JS.
                        </p>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        <AdminPagination
          page={page}
          pageCount={pageCount}
          total={total}
          onPageChange={setPage}
        />
      </AdminCard>
    </AdminPage>
  );
}
