import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  en_route: "En camino",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  assigned: "bg-blue-100 text-blue-700",
  en_route: "bg-indigo-100 text-indigo-700",
  finished: "bg-green-100 text-green-700",
  cancelled: "bg-slate-200 text-slate-600",
};

export function MyServices() {
  const services = useQuery(api.services.listForClient);

  if (services === undefined) {
    return <p className="text-sm text-slate-500">Cargando servicios...</p>;
  }

  if (services.length === 0) {
    return (
      <p className="text-sm text-slate-500">Aún no tienes solicitudes.</p>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Mis servicios</h2>
      <ul className="space-y-2">
        {services.map((service) => (
          <li
            key={service._id}
            className="rounded-xl bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">
                {service.origin.address} → {service.destination.address}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  STATUS_STYLES[service.status] ?? ""
                }`}
              >
                {STATUS_LABELS[service.status] ?? service.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Total: ${service.totalPrice.toFixed(2)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
