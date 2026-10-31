import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import { getAdminServiceStatusLabel } from "@proyecto/backend/serviceClosure";
import { AdminPagination, usePagedItems } from "./AdminPagination";
import { AdminEmpty, AdminLoading, AdminTableWrap } from "./AdminLayout";
import { formatDateTime } from "../lib/formatDateTime";
import {
  rowClass,
  tableClass,
  tableHeadClass,
  tdClass,
  thClass,
} from "../lib/adminUi";

type DriverServicesHistoryProps = {
  driverId: Id<"drivers"> | null;
};

function formatMoney(amount: number): string {
  return `S/${amount.toFixed(2)}`;
}

function formatRequestedHours(hours: number | null): string {
  if (hours === null) {
    return "—";
  }
  const rounded = Math.round(hours * 10) / 10;
  const label = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1);
  return `${label} h`;
}

function formatExecutedDuration(ms: number | null, started: boolean): string {
  if (ms === null) {
    return started ? "En curso" : "No iniciado";
  }
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes} min`;
  }
  if (minutes === 0) {
    return hours === 1 ? "1 h" : `${hours} h`;
  }
  return `${hours} h ${minutes} min`;
}

function formatScore(score: number | null): string {
  if (score === null) {
    return "Sin calificar";
  }
  return `${score} ★`;
}

export function DriverServicesHistory({ driverId }: DriverServicesHistoryProps) {
  const services = useQuery(
    api.services.listHistoryForDriverAdmin,
    driverId === null ? "skip" : { driverId },
  );

  const summary = useMemo(() => {
    if (services === undefined) {
      return null;
    }
    const finished = services.filter((service) => service.status === "finished");
    const scored = services.filter((service) => service.score !== null);
    const charged = finished.reduce(
      (sum, service) => sum + service.chargedAmount,
      0,
    );
    const average =
      scored.length === 0
        ? null
        : Math.round(
            (scored.reduce((sum, service) => sum + (service.score ?? 0), 0) /
              scored.length) *
              10,
          ) / 10;
    return {
      total: services.length,
      finished: finished.length,
      charged,
      average,
      scored: scored.length,
    };
  }, [services]);

  const { page, setPage, pageCount, total, paged } = usePagedItems(
    services,
    driverId ?? "none",
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <p className="font-display text-base font-bold text-slate-900">
        Servicios realizados
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Tarifa aceptada, horas pedidas (incluidas extensiones), duración real
        desde que salió con el cliente, y la calificación con comentario.
      </p>

      {driverId === null ? (
        <p className="mt-4 text-sm text-slate-500">
          Aún no hay perfil de chofer, así que no hay servicios asignados.
        </p>
      ) : services === undefined || summary === null ? (
        <div className="mt-4">
          <AdminLoading message="Cargando servicios…" />
        </div>
      ) : services.length === 0 ? (
        <div className="mt-4">
          <AdminEmpty message="Este chofer todavía no tiene servicios asignados." />
        </div>
      ) : (
        <>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryStat label="Servicios" value={String(summary.total)} />
            <SummaryStat label="Finalizados" value={String(summary.finished)} />
            <SummaryStat
              label="Cobrado (finalizados)"
              value={formatMoney(summary.charged)}
            />
            <SummaryStat
              label="Calificación"
              value={
                summary.average === null
                  ? "Sin calificaciones"
                  : `${summary.average.toFixed(1)} ★ (${summary.scored})`
              }
            />
          </dl>

          <div className="mt-4">
            <AdminTableWrap>
              <table className={tableClass}>
                <thead className={tableHeadClass}>
                  <tr>
                    <th className={thClass}>Fecha</th>
                    <th className={thClass}>Cliente</th>
                    <th className={thClass}>Ruta</th>
                    <th className={thClass}>Estado</th>
                    <th className={thClass}>Cobró</th>
                    <th className={thClass}>Tiempo pedido</th>
                    <th className={thClass}>Tiempo ejecutado</th>
                    <th className={thClass}>Calificación</th>
                    <th className={thClass}>Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  {(paged ?? []).map((service) => {
                    const who =
                      service.passengerName !== null &&
                      service.passengerName !== service.clientName
                        ? [service.clientName, service.passengerName]
                            .filter((part) => part !== null && part !== "")
                            .join(" · ")
                        : service.clientName ?? "—";
                    return (
                      <tr key={service._id} className={rowClass}>
                        <td className={`${tdClass} text-slate-500`}>
                          {formatDateTime(service.requestedAt)}
                        </td>
                        <td className={`${tdClass} max-w-[10rem]`}>
                          <span className="block truncate" title={who}>
                            {who || "—"}
                          </span>
                        </td>
                        <td className={`${tdClass} max-w-[16rem]`}>
                          <span
                            className="block truncate"
                            title={`${service.originAddress} → ${service.destinationAddress}`}
                          >
                            {service.originAddress} → {service.destinationAddress}
                          </span>
                        </td>
                        <td className={tdClass}>
                          {getAdminServiceStatusLabel({
                            status: service.status,
                            ...(service.closureReason !== undefined
                              ? { closureReason: service.closureReason }
                              : {}),
                            ...(service.driverId !== undefined
                              ? { driverId: service.driverId }
                              : {}),
                            ...(service.assignedAt !== undefined
                              ? { assignedAt: service.assignedAt }
                              : {}),
                          })}
                        </td>
                        <td className={`${tdClass} font-medium text-slate-900`}>
                          {formatMoney(service.chargedAmount)}
                        </td>
                        <td className={tdClass}>
                          {formatRequestedHours(service.requestedHours)}
                        </td>
                        <td className={tdClass}>
                          {formatExecutedDuration(
                            service.executedDurationMs,
                            service.departedWithClientAt !== null,
                          )}
                        </td>
                        <td className={tdClass}>{formatScore(service.score)}</td>
                        <td className="max-w-[18rem] whitespace-normal px-3 py-3 align-top text-zinc-700 sm:px-4">
                          {service.comment !== null && service.comment !== ""
                            ? service.comment
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </AdminTableWrap>
            <AdminPagination
              page={page}
              pageCount={pageCount}
              total={total}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </section>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
