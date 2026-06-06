import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";

export function PayoutsPanel() {
  const pending = useQuery(api.payouts.listPending);
  const markPaid = useMutation(api.payouts.markPaid);

  if (pending === undefined) {
    return <p className="text-sm text-slate-500">Cargando comisiones...</p>;
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        Comisiones de choferes (pendientes)
      </h2>
      {pending.length === 0 ? (
        <p className="text-sm text-slate-500">No hay comisiones pendientes.</p>
      ) : (
        <ul className="space-y-2">
          {pending.map((payout) => (
            <li
              key={payout._id}
              className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
            >
              <span className="text-sm text-slate-800">
                Acumulado: ${payout.accumulatedAmount.toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => void markPaid({ payoutId: payout._id })}
                className="rounded bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-dark"
              >
                Liquidar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
