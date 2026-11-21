import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { CorporateQuoteAdminForm } from "../components/CorporateQuoteAdminForm";
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

function formatServiceMoment(value: string | undefined): string {
  if (value === undefined || value === "") return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.replace("T", " ");
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
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

export function QuotesView() {
  const rows = useQuery(api.corporateQuotes.listForAdmin, {});
  const [showForm, setShowForm] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("");
  const [message, setMessage] = useState<string | null>(null);

  const filtered =
    rows === undefined
      ? undefined
      : rows.filter((row) => {
          if (sourceFilter === "") return true;
          const source = row.source ?? "web";
          return source === sourceFilter;
        });

  return (
    <AdminPage>
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className={btnPrimaryClass}
          onClick={() => {
            setShowForm((current) => !current);
            setMessage(null);
          }}
        >
          {showForm ? "Cerrar formulario" : "Generar requerimiento manual"}
        </button>
      </div>

      {showForm && (
        <AdminCard>
          <CorporateQuoteAdminForm
            onCancel={() => setShowForm(false)}
            onDone={(emailSent) => {
              setShowForm(false);
              setMessage(
                emailSent
                  ? "Cotización guardada y correo de confirmación enviado."
                  : "Cotización guardada. El correo no salió (revisa Resend en Convex).",
              );
            }}
          />
        </AdminCard>
      )}

      {message !== null && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </p>
      )}

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
                  <th className="px-4 py-3 font-medium">Detalle</th>
                  <th className="px-4 py-3 font-medium">Confirmación</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row._id} className="border-t border-zinc-100 align-top">
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
                      {formatServiceMoment(row.serviceStart)}
                    </td>
                    <td className="px-4 py-3">
                      {place(
                        row.destinationDepartment,
                        row.destinationProvince,
                        row.destinationDistrict,
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatServiceMoment(row.serviceEnd)}
                    </td>
                    <td className="px-4 py-3">{formatHours(row.serviceHours)}</td>
                    <td className="px-4 py-3">{row.driverCount ?? "—"}</td>
                    <td className="max-w-xs px-4 py-3 text-zinc-600">
                      {row.detail}
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