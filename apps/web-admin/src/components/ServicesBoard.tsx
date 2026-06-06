import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  en_route: "En camino",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

export function ServicesBoard() {
  const services = useQuery(api.services.listAllForAdmin, {});
  const availableDrivers = useQuery(api.drivers.listAvailable);
  const assignDriver = useMutation(api.services.assignDriver);
  const [selection, setSelection] = useState<Record<string, string>>({});

  if (services === undefined) {
    return <p className="text-sm text-slate-500">Cargando servicios...</p>;
  }

  async function handleAssign(serviceId: Id<"services">) {
    const driverId = selection[serviceId];
    if (driverId === undefined) {
      return;
    }
    await assignDriver({
      serviceId,
      driverId: driverId as Id<"drivers">,
    });
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Servicios</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Ruta</th>
              <th className="py-2 pr-4">Total</th>
              <th className="py-2 pr-4">Comisión</th>
              <th className="py-2 pr-4">Estado</th>
              <th className="py-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service._id} className="border-b border-slate-100">
                <td className="py-2 pr-4 text-slate-800">
                  {service.origin.address} → {service.destination.address}
                </td>
                <td className="py-2 pr-4">${service.totalPrice.toFixed(2)}</td>
                <td className="py-2 pr-4">
                  ${service.driverCommission.toFixed(2)}
                </td>
                <td className="py-2 pr-4">
                  {STATUS_LABELS[service.status] ?? service.status}
                </td>
                <td className="py-2">
                  {service.status === "pending" ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={selection[service._id] ?? ""}
                        onChange={(e) =>
                          setSelection((prev) => ({
                            ...prev,
                            [service._id]: e.target.value,
                          }))
                        }
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="">Elegir chofer</option>
                        {(availableDrivers ?? []).map((driver) => (
                          <option key={driver._id} value={driver._id}>
                            {driver.vehicle.plate} ({driver.rating}★)
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void handleAssign(service._id)}
                        className="rounded bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-dark"
                      >
                        Asignar
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
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
