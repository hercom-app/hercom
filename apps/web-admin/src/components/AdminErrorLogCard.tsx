import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { AdminCard, AdminLoading } from "./AdminLayout";

function formatWhen(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

/**
 * Errores persistidos del panel. Complementa la consola del navegador
 * (F12) y Convex Dashboard → Logs.
 */
export function AdminErrorLogCard() {
  const logs = useQuery(api.adminLogs.listRecent, { limit: 20 });

  return (
    <AdminCard>
      <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">
        Registro de errores
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Los fallos salen en la consola del navegador (F12), en Convex Dashboard
        → Logs, y aquí si el servidor o el cliente los registró.
      </p>
      {logs === undefined ? (
        <div className="mt-3">
          <AdminLoading message="Cargando registro…" />
        </div>
      ) : logs.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Sin errores recientes.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {logs.map((log) => (
            <li key={log._id} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm font-medium text-slate-900">{log.message}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {log.action} · {formatWhen(log.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}
