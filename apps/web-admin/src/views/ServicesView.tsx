import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc, Id } from "@proyecto/backend/dataModel";
import { AdminRegionFilters } from "../components/AdminRegionFilters";
import {
  AdminCard,
  AdminLoading,
  AdminPage,
  AdminPageHeader,
} from "../components/AdminLayout";
import { PaymentsPanel } from "../components/PaymentsPanel";
import { PayoutsPanel } from "../components/PayoutsPanel";
import { ServicesBoard } from "../components/ServicesBoard";
import { ServiceLivePanel } from "../components/ServiceLivePanel";
import { liveStatusLabel } from "../lib/liveTrip";
import {
  EMPTY_REGION_FILTER,
  regionToQueryArgs,
  selectClass,
  type RegionFilter,
} from "../lib/adminFilters";

type StatusFilter = "" | Doc<"services">["status"];
type TypeFilter = "all" | NonNullable<Doc<"services">["serviceType"]>;
type ChannelFilter = "" | NonNullable<Doc<"services">["requestChannel"]>;

export function ServicesView({
  isFullAdmin = true,
  districtScopes = [],
}: {
  isFullAdmin?: boolean;
  districtScopes?: Array<{
    countryCode: string;
    department: string;
    province: string;
    district: string;
  }>;
}) {
  const [region, setRegion] = useState<RegionFilter>(EMPTY_REGION_FILTER);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("");
  const [selectedServiceId, setSelectedServiceId] = useState<
    Id<"services"> | null
  >(null);

  const queryArgs = {
    ...regionToQueryArgs(region),
    ...(statusFilter !== "" ? { status: statusFilter } : {}),
    ...(typeFilter !== "all" ? { serviceType: typeFilter } : {}),
    ...(channelFilter !== "" ? { requestChannel: channelFilter } : {}),
  };

  const services = useQuery(api.services.listAllForAdmin, queryArgs);
  const liveTrips = useQuery(api.serviceTracking.listLiveForAdmin);

  return (
    <AdminPage>
      <AdminPageHeader
        title="Servicios"
        description="Monitoreo de viajes, ubicación en vivo y cierre de pagos."
      />

      <AdminCard>
        <h2 className="mb-3 font-display text-lg font-bold tracking-tight text-slate-900">
          En ruta ahora
        </h2>
        {liveTrips === undefined ? (
          <AdminLoading message="Cargando viajes en vivo…" />
        ) : liveTrips.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hay choferes en recojo o en viaje en este momento.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {liveTrips.map((trip) => (
              <li key={trip.serviceId} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {liveStatusLabel(trip.status)}
                      {trip.hasGps ? " · GPS activo" : " · sin GPS aún"}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                      {trip.originAddress} → {trip.destinationAddress}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedServiceId(trip.serviceId)}
                    className="shrink-0 text-sm font-semibold text-hercom hover:underline"
                  >
                    Ver mapa
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      {selectedServiceId !== null && (
        <ServiceLivePanel
          serviceId={selectedServiceId}
          onClose={() => setSelectedServiceId(null)}
        />
      )}

      <AdminRegionFilters
        value={region}
        onChange={setRegion}
        allowedScopes={isFullAdmin ? undefined : districtScopes}
      >
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as StatusFilter)
          }
          className={selectClass}
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="assigned">Asignado</option>
          <option value="heading_to_pickup">Yendo a recoger</option>
          <option value="arrived_pickup">Llegó al punto</option>
          <option value="in_progress">En viaje</option>
          <option value="arrived_destination">Llegó al destino</option>
          <option value="finished">Finalizado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
          className={selectClass}
        >
          <option value="all">Tipo: todos</option>
          <option value="app">App</option>
          <option value="premium">Premium</option>
        </select>
        <select
          value={channelFilter}
          onChange={(event) =>
            setChannelFilter(event.target.value as ChannelFilter)
          }
          className={selectClass}
        >
          <option value="">Canal: todos</option>
          <option value="mobile_app">App móvil</option>
          <option value="web_comercial">Web comercial</option>
          <option value="phone">Teléfono</option>
        </select>
      </AdminRegionFilters>

      <ServicesBoard
        services={services}
        selectedId={selectedServiceId}
        onSelect={setSelectedServiceId}
      />

      {isFullAdmin ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <PaymentsPanel />
          <PayoutsPanel />
        </div>
      ) : null}
    </AdminPage>
  );
}
