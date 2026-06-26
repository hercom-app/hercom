import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  heading_to_pickup: "Chofer en camino al punto",
  arrived_pickup: "Chofer llegó al punto",
  in_progress: "En viaje",
  arrived_destination: "Llegó al destino",
  en_route: "En camino",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  assigned: "bg-blue-100 text-blue-700",
  heading_to_pickup: "bg-sky-100 text-sky-700",
  arrived_pickup: "bg-indigo-100 text-indigo-700",
  in_progress: "bg-violet-100 text-violet-700",
  arrived_destination: "bg-cyan-100 text-cyan-700",
  en_route: "bg-indigo-100 text-indigo-700",
  finished: "bg-green-100 text-green-700",
  cancelled: "bg-slate-200 text-slate-600",
};

export function MyServices() {
  const services = useQuery(api.services.listForClient);
  const acceptOffer = useMutation(api.serviceOffers.acceptOffer);
  const [acceptingOfferId, setAcceptingOfferId] = useState<Id<"serviceOffers"> | null>(
    null,
  );
  const [offerError, setOfferError] = useState<string | null>(null);

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
      <h2 className="text-lg font-bold text-slate-900">Mis servicios</h2>
      <ul className="space-y-2">
        {services.map((service) => (
          <li
            key={service._id}
            className="rounded-3xl bg-white p-4 shadow-lg"
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
              Base: S/{service.basePrice.toFixed(2)} · Propina: S/
              {service.tipAmount.toFixed(2)} · Total: S/{service.totalPrice.toFixed(2)}
            </p>
            {service.securityCode !== undefined &&
              service.status !== "finished" &&
              service.status !== "cancelled" && (
                <p className="mt-2 rounded-xl bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                  Código de seguridad para iniciar viaje:{" "}
                  <span className="font-bold text-indigo-900">
                    {service.securityCode}
                  </span>
                </p>
              )}
            {service.status === "pending" && (
              <ServiceOffersList
                serviceId={service._id}
                onAccept={async (offerId) => {
                  setOfferError(null);
                  setAcceptingOfferId(offerId);
                  try {
                    await acceptOffer({ serviceId: service._id, offerId });
                  } catch (error) {
                    setOfferError(
                      error instanceof Error
                        ? error.message
                        : "No se pudo aceptar la oferta.",
                    );
                  } finally {
                    setAcceptingOfferId(null);
                  }
                }}
                acceptingOfferId={acceptingOfferId}
              />
            )}
            {offerError !== null && (
              <p className="mt-2 text-xs font-medium text-red-600">{offerError}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ServiceOffersList({
  serviceId,
  onAccept,
  acceptingOfferId,
}: {
  serviceId: Id<"services">;
  onAccept: (offerId: Id<"serviceOffers">) => Promise<void>;
  acceptingOfferId: Id<"serviceOffers"> | null;
}) {
  const offers = useQuery(api.serviceOffers.listForServiceAsClient, { serviceId });

  if (offers === undefined) {
    return <p className="mt-2 text-xs text-slate-500">Cargando ofertas...</p>;
  }
  const pendingOffers = offers.filter((offer) => offer.status === "pending");
  if (pendingOffers.length === 0) {
    return <p className="mt-2 text-xs text-slate-500">Sin ofertas aún.</p>;
  }
  return (
    <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold text-slate-600">Ofertas de choferes</p>
      <div className="space-y-2">
        {pendingOffers.map((offer) => (
          <div
            key={offer._id}
            className="flex items-center justify-between rounded-xl bg-white p-2"
          >
            <div>
              <p className="text-xs text-slate-600">
                Placa {offer.driverPlate} · Rating {offer.driverRating.toFixed(1)}★
              </p>
              <p className="text-sm font-semibold text-slate-900">
                S/{offer.offeredPrice.toFixed(2)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void onAccept(offer._id)}
              disabled={acceptingOfferId === offer._id}
              className="rounded-xl bg-hercom px-3 py-1.5 text-xs font-bold uppercase text-white hover:bg-hercom-dark disabled:opacity-60"
            >
              {acceptingOfferId === offer._id ? "Aceptando..." : "Elegir"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
