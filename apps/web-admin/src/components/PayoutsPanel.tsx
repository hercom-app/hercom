import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { AdminCard, AdminEmpty, AdminLoading } from "./AdminLayout";
import { AdminPagination, usePagedItems } from "./AdminPagination";
import { btnPrimaryClass } from "../lib/adminUi";

export function PayoutsPanel() {
  const pending = useQuery(api.payouts.listPending);
  const markPaid = useMutation(api.payouts.markPaid);
  const { page, setPage, pageCount, total, paged } = usePagedItems(pending);

  if (pending === undefined || paged === undefined) {
    return (
      <AdminCard>
        <AdminLoading message="Cargando comisiones…" />
      </AdminCard>
    );
  }

  return (
    <AdminCard>
      <h2 className="mb-4 font-display text-lg font-bold tracking-tight text-slate-900">
        Comisiones pendientes
      </h2>
      {total === 0 ? (
        <AdminEmpty message="No hay comisiones pendientes." />
      ) : (
        <>
          <ul className="divide-y divide-slate-100">
            {paged.map((payout) => (
              <li
                key={payout._id}
                className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm text-slate-700">
                  Acumulado:{" "}
                  <strong className="text-slate-900">
                    S/{payout.accumulatedAmount.toFixed(2)}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => void markPaid({ payoutId: payout._id })}
                  className={`${btnPrimaryClass} w-full sm:w-auto`}
                >
                  Liquidar
                </button>
              </li>
            ))}
          </ul>
          <AdminPagination
            page={page}
            pageCount={pageCount}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}
    </AdminCard>
  );
}
