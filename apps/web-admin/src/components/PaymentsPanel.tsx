import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";

export function PaymentsPanel() {
  const pending = useQuery(api.payments.listPending);
  const markPaid = useMutation(api.payments.markPaid);

  if (pending === undefined) {
    return <p className="text-sm text-slate-500">Cargando pagos...</p>;
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg">
      <h2 className="mb-4 text-lg font-bold text-slate-900">
        Pagos pendientes
      </h2>
      {pending.length === 0 ? (
        <p className="text-sm text-slate-500">No hay pagos pendientes.</p>
      ) : (
        <ul className="space-y-2">
          {pending.map((payment) => (
            <li
              key={payment._id}
              className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
            >
              <span className="text-sm text-slate-800">
                ${payment.amount.toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() =>
                  void markPaid({ paymentId: payment._id, method: "cash" })
                }
                className="rounded-lg bg-hercom px-3 py-1.5 text-xs font-bold uppercase text-white hover:bg-hercom-dark"
              >
                Marcar pagado
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
