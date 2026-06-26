import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  heading_to_pickup: "Chofer yendo a recoger",
  arrived_pickup: "Chofer llegó al punto",
  in_progress: "Chofer salió con cliente",
  arrived_destination: "Chofer llegó al destino",
  en_route: "En camino",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

export function ServicesBoard() {
  const services = useQuery(api.services.listAllForAdmin, {});
  const [showLegacyHelp, setShowLegacyHelp] = useState(false);

  if (services === undefined) {
    return <p className="text-sm text-slate-500">Cargando servicios...</p>;
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">Servicios</h2>
        <button
          type="button"
          onClick={() => setShowLegacyHelp((prev) => !prev)}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700"
        >
          {showLegacyHelp ? "Ocultar nota" : "Ver nota"}
        </button>
      </div>
      {showLegacyHelp && (
        <p className="mb-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          Flujo actual: el cliente elige ofertas de chofer. Este tablero es de
          monitoreo (no asignación manual).
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Ruta</th>
              <th className="py-2 pr-4">Total</th>
              <th className="py-2 pr-4">Comisión app (25%)</th>
              <th className="py-2 pr-4">Estado</th>
              <th className="py-2 pr-4">Código inicio</th>
              <th className="py-2">Chofer</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service._id} className="border-b border-slate-100">
                <td className="py-2 pr-4 text-slate-800">
                  {service.origin.address} → {service.destination.address}
                </td>
                <td className="py-2 pr-4">S/{service.totalPrice.toFixed(2)}</td>
                <td className="py-2 pr-4">
                  S/{service.driverCommission.toFixed(2)}
                </td>
                <td className="py-2 pr-4">
                  {STATUS_LABELS[service.status] ?? service.status}
                </td>
                <td className="py-2 pr-4">
                  {service.securityCode ?? <span className="text-slate-400">-</span>}
                </td>
                <td className="py-2">
                  {service.driverId !== undefined ? (
                    <span className="text-xs text-slate-600">{service.driverId}</span>
                  ) : (
                    <span className="text-xs text-slate-400">Sin asignar</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
