import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import { CorporateQuoteAdminForm } from "../components/CorporateQuoteAdminForm";
import { QuoteOfferView } from "../components/QuoteOfferView";
import { QuoteRequirementView } from "../components/QuoteRequirementView";
import {
  AdminCard,
  AdminEmpty,
  AdminLoading,
  AdminPage,
} from "../components/AdminLayout";
import { btnPrimaryClass, btnSecondaryClass, selectClass } from "../lib/adminUi";
import { QUOTE_STATUS_BADGE, QUOTE_STATUS_LABEL, quoteStatusOf } from "../lib/quoteStatus";

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

function sourceLabel(source: "web" | "manual" | undefined): string {
  if (source === "manual") return "Manual";
  return "Web";
}

type SourceFilter = "" | "web" | "manual";
type Screen =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "requirement"; id: Id<"corporateQuotes">; notice: string | null }
  | { kind: "quote"; id: Id<"corporateQuotes"> };

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

  if (screen.kind === "quote") {
    return (
      <QuoteOfferView
        quoteId={screen.id}
        onBack={() => setScreen({ kind: "list" })}
      />
    );
  }

  if (screen.kind === "requirement") {
    return (
      <QuoteRequirementView
        notice={screen.notice}
        quoteId={screen.id}
        onBack={() => setScreen({ kind: "list" })}
        onQuote={() => setScreen({ kind: "quote", id: screen.id })}
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
                kind: "requirement",
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
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            Lista de requerimientos
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Haz clic en una fila para ver el requerimiento. Usa Cotizar para armar y
            enviar la oferta.
          </p>
        </div>
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
          <div className="w-full overflow-x-hidden">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[9.5rem]" />
                <col className="w-[4.5rem]" />
                <col />
                <col className="w-[22%]" />
                <col className="w-[6.5rem]" />
                <col className="w-[8rem]" />
                <col className="w-[6.75rem]" />
              </colgroup>
              <thead className="text-xs uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-2 py-3 font-medium sm:px-3">Fecha</th>
                  <th className="px-2 py-3 font-medium sm:px-3">Canal</th>
                  <th className="px-2 py-3 font-medium sm:px-3">Contacto</th>
                  <th className="hidden px-2 py-3 font-medium sm:table-cell sm:px-3">
                    Empresa
                  </th>
                  <th className="px-2 py-3 font-medium sm:px-3">Inicio</th>
                  <th className="px-2 py-3 font-medium sm:px-3">Cotización</th>
                  <th className="px-2 py-3 font-medium sm:px-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row._id}
                    className="group cursor-pointer border-t border-zinc-100 align-top hover:bg-zinc-50"
                    title="Ver requerimiento"
                    onClick={() =>
                      setScreen({ kind: "requirement", id: row._id, notice: null })
                    }
                  >
                    <td className="whitespace-nowrap px-2 py-3 text-zinc-500 sm:px-3">
                      {formatWhen(row.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 sm:px-3">
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
                    <td className="truncate px-2 py-3 font-medium text-zinc-900 sm:px-3">
                      <span className="group-hover:text-sky-700 group-hover:underline">
                        {row.contactName}
                      </span>
                    </td>
                    <td className="hidden truncate px-2 py-3 text-zinc-700 sm:table-cell sm:px-3">
                      {row.companyName === "" ? "—" : row.companyName}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 sm:px-3">
                      {formatServiceDate(row.serviceStart)}
                    </td>
                    <td className="px-2 py-3 text-zinc-700 sm:px-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${QUOTE_STATUS_BADGE[quoteStatusOf(row)]}`}
                      >
                        {QUOTE_STATUS_LABEL[quoteStatusOf(row)]}
                      </span>
                      {row.quoteAmount !== undefined && (
                        <span className="mt-1 block truncate text-xs text-zinc-500">
                          S/ {row.quoteAmount.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 sm:px-3">
                      <button
                        type="button"
                        className={`${btnSecondaryClass} px-3 py-1.5 text-xs`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setScreen({ kind: "quote", id: row._id });
                        }}
                      >
                        Cotizar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}