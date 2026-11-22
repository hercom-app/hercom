import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import { CorporateQuoteAdminForm } from "../components/CorporateQuoteAdminForm";
import { QuoteDetailView } from "../components/QuoteDetailView";
import {
  AdminCard,
  AdminEmpty,
  AdminLoading,
  AdminPage,
  AdminTableWrap,
} from "../components/AdminLayout";
import { btnPrimaryClass, selectClass } from "../lib/adminUi";

function formatWhen(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function formatServiceDate(value: string | undefined): string {
  if (value === undefined || value === "") return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match === null) return value.replace("T", " ");
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(
    new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))),
  );
}

function place(
  department: string | undefined,
  province: string | undefined,
  district: string | undefined,
): string {
  const text = [district, province, department]
    .filter((part) => part !== undefined && part !== "")
    .join(", ");
  return text === "" ? "—" : text;
}

function formatHours(value: number | undefined): string {
  if (value === undefined) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function sourceLabel(source: "web" | "manual" | undefined): string {
  if (source === "manual") return "Manual";
  return "Web";
}

type SourceFilter = "" | "web" | "manual";
type Screen =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "detail"; id: Id<"corporateQuotes">; notice: string | null };

export function QuotesView() {
  const rows = useQuery(api.corporateQuotes.listForAdmin, {});
  const [screen, setScreen] = useState<Screen>({ kind: "list" });
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("");

  const filtered =
    rows === undefined
      ? undefined
      : rows.filter((row) => {
          if (sourceFilter === "") return true;
          const source = row.source ?? "web";
          return source === sourceFilter;
        });

  if (screen.kind === "detail") {
    return (
      <QuoteDetailView
        quoteId={screen.id}
        notice={screen.notice}
        onBack={() => setScreen({ kind: "list" })}
      />
    );
  }

  if (screen.kind === "create") {
    return (
      <AdminPage>
        <div>
          <button
            type="button"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
            onClick={() => setScreen({ kind: "list" })}
          >
            Volver a la lista
          </button>
        </div>
        <AdminCard>
          <CorporateQuoteAdminForm
            onCancel={() => setScreen({ kind: "list" })}
            onDone={(result) => {
              setScreen({
                kind: "detail",
                id: result.id as Id<"corporateQuotes">,
                notice: result.emailSent
                  ? "Requerimiento guardado y correo de confirmación enviado."
                  : "Requerimiento guardado. El correo de confirmación no salió.",
              });
            }}
          />
        </AdminCard>
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
          Lista de requerimientos
        </h2>
        <button
          type="button"
          className={btnPrimaryClass}
          onClick={() => setScreen({ kind: "create" })}
        >
          Generar requerimiento manual
        </button>
      </div>

      <AdminCard>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-zinc-600">
            Canal
            <select
              value={sourceFilter}
              onChange={(event) =>
                setSourceFilter(event.target.value as SourceFilter)
              }
              className={`${selectClass} ml-2 inline-block w-auto min-w-[10rem]`}
            >
              <option value="">Todas</option>
              <option value="web">Solo web</option>
              <option value="manual">Solo manual</option>
            </select>
          </label>
        </div>
        {filtered === undefined ? (
          <AdminLoading message="Cargando cotizaciones…" />
        ) : filtered.length === 0 ? (
          <AdminEmpty message="No hay cotizaciones con este filtro." />
        ) : (
          <AdminTableWrap>
            <table className="min-w-[1480px] w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Canal</th>
                  <th className="px-4 py-3 font-medium">Contacto</th>
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">RUC</th>
                  <th className="px-4 py-3 font-medium">Correo</th>
                  <th className="px-4 py-3 font-medium">Teléfono</th>
                  <th className="px-4 py-3 font-medium">Origen</th>
                  <th className="px-4 py-3 font-medium">Inicio</th>
                  <th className="px-4 py-3 font-medium">Destino</th>
                  <th className="px-4 py-3 font-medium">Fin</th>
                  <th className="px-4 py-3 font-medium">Horas</th>
                  <th className="px-4 py-3 font-medium">Choferes</th>
                  <th className="px-4 py-3 font-medium">Cotización</th>
                  <th className="px-4 py-3 font-medium">Confirmación</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row._id}
                    className="cursor-pointer border-t border-zinc-100 align-top hover:bg-zinc-50"
                    onClick={() =>
                      setScreen({ kind: "detail", id: row._id, notice: null })
                    }
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {formatWhen(row.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={
                          (row.source ?? "web") === "manual"
                            ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900"
                            : "rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-900"
                        }
                      >
                        {sourceLabel(row.source)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {row.contactName}
                    </td>
                    <td className="px-4 py-3">
                      {row.companyName === "" ? "—" : row.companyName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.ruc ?? "—"}
                    </td>
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.phone}</td>
                    <td className="px-4 py-3">
                      {place(
                        row.originDepartment,
                        row.originProvince,
                        row.originDistrict,
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatServiceDate(row.serviceStart)}
                    </td>
                    <td className="px-4 py-3">
                      {place(
                        row.destinationDepartment,
                        row.destinationProvince,
                        row.destinationDistrict,
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatServiceDate(row.serviceEnd)}
                    </td>
                    <td className="px-4 py-3">{formatHours(row.serviceHours)}</td>
                    <td className="px-4 py-3">{row.driverCount ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.quoteAmount === undefined
                        ? "Pendiente"
                        : `S/ ${row.quoteAmount.toFixed(2)}`}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.emailSent ? "Enviado" : "Pendiente"}
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