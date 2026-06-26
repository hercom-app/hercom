import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";

function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function TopUpsTodayPanel() {
  const timezoneOffsetMinutes = new Date().getTimezoneOffset();
  const topUps = useQuery(api.driverWallets.listTopUpsTodayForAdmin, {
    timezoneOffsetMinutes,
  });

  if (topUps === undefined) {
    return <p className="text-sm text-slate-500">Cargando recargas del día...</p>;
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">Recargas del día</h2>
        <span className="text-xs text-slate-500">
          {topUps.count} {topUps.count === 1 ? "movimiento" : "movimientos"}
        </span>
      </div>

      <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs text-slate-500">Total recargado hoy</p>
        <p className="text-xl font-bold text-slate-900">S/{topUps.totalAmount.toFixed(2)}</p>
      </div>

      {topUps.items.length === 0 ? (
        <p className="text-sm text-slate-500">No hay recargas registradas hoy.</p>
      ) : (
        <ul className="space-y-2">
          {topUps.items.map((tx) => (
            <li
              key={tx._id}
              className="rounded-xl border border-slate-100 p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-800">{tx.userName}</span>
                <span className="font-bold text-slate-900">+ S/{tx.amount.toFixed(2)}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>{tx.userEmail}</span>
                <span>Placa: {tx.plate}</span>
                <span>Estado: {tx.driverStatus}</span>
                <span>{formatDateTime(tx.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
