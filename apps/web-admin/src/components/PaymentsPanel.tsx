import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { AdminCard, AdminEmpty, AdminLoading } from "./AdminLayout";
import { AdminPagination, usePagedItems } from "./AdminPagination";
import { btnPrimaryClass } from "../lib/adminUi";

export function PaymentsPanel() {
  const pending = useQuery(api.payments.listPending);
  const markPaid = useMutation(api.payments.markPaid);
  const { page, setPage, pageCount, total, paged } = usePagedItems(pending);

  if (pending === undefined || paged === undefined) {
    return (
      <AdminCard>
        <AdminLoading message="Cargando pagos…" />
      </AdminCard>
    );
  }

  return (
    <AdminCard>
      <h2 className="mb-4 font-display text-lg font-bold tracking-tight text-slate-900">
        Pagos pendientes
      </h2>
      {total === 0 ? (
        <AdminEmpty message="No hay pagos pendientes." />
      ) : (
        <>
          <ul className="divide-y divide-slate-100">
            {paged.map((payment) => (
              <li
                key={payment._id}
                className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-semibold text-slate-900">
                  S/{payment.amount.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    void markPaid({ paymentId: payment._id, method: "cash" })
                  }
                  className={`${btnPrimaryClass} w-full sm:w-auto`}
                >
                  Marcar pagado
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
