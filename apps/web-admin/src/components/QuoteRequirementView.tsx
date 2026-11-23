import type { Id } from "@proyecto/backend/dataModel";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { AdminCard, AdminEmpty, AdminLoading, AdminPage } from "./AdminLayout";
import { btnPrimaryClass, btnSecondaryClass } from "../lib/adminUi";
import { QuoteRequirementSummary } from "./QuoteRequirementSummary";

export function QuoteRequirementView({
  quoteId,
  notice,
  onBack,
  onQuote,
}: {
  quoteId: Id<"corporateQuotes">;
  notice: string | null;
  onBack: () => void;
  onQuote: () => void;
}) {
  const quote = useQuery(api.corporateQuotes.getForAdmin, { id: quoteId });

  return (
    <AdminPage>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className={btnSecondaryClass} onClick={onBack}>
          Volver a la lista
        </button>
        {quote !== undefined && quote !== null && (
          <button type="button" className={btnPrimaryClass} onClick={onQuote}>
            Cotizar
          </button>
        )}
      </div>

      {notice !== null && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {notice}
        </p>
      )}

      {quote === undefined ? (
        <AdminLoading message="Cargando requerimiento…" />
      ) : quote === null ? (
        <AdminEmpty message="No encontramos este requerimiento." />
      ) : (
        <AdminCard>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
            Solicitud
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">
            Requerimiento
          </h3>
          <div className="mt-6">
            <QuoteRequirementSummary quote={quote} />
          </div>
        </AdminCard>
      )}
    </AdminPage>
  );
}