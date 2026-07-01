import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc } from "@proyecto/backend/dataModel";
import { AdminRegionFilters } from "../components/AdminRegionFilters";
import { PaymentsPanel } from "../components/PaymentsPanel";
import { PayoutsPanel } from "../components/PayoutsPanel";
import { ServicesBoard } from "../components/ServicesBoard";
import {
  EMPTY_REGION_FILTER,
  regionToQueryArgs,
  selectClass,
  type RegionFilter,
} from "../lib/adminFilters";

type StatusFilter = "" | Doc<"services">["status"];
type TypeFilter = "all" | NonNullable<Doc<"services">["serviceType"]>;
type ChannelFilter = "" | NonNullable<Doc<"services">["requestChannel"]>;

export function ServicesView() {
  const [region, setRegion] = useState<RegionFilter>(EMPTY_REGION_FILTER);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("");

  const queryArgs = {
    ...regionToQueryArgs(region),
    ...(statusFilter !== "" ? { status: statusFilter } : {}),
    ...(typeFilter !== "all" ? { serviceType: typeFilter } : {}),
    ...(channelFilter !== "" ? { requestChannel: channelFilter } : {}),
  };

  const services = useQuery(api.services.listAllForAdmin, queryArgs);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Servicios</h1>
        <p className="text-sm text-slate-500">
          Monitoreo de viajes y cierre de pagos/comisiones.
        </p>
      </div>

      <AdminRegionFilters value={region} onChange={setRegion}>
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

      <ServicesBoard services={services} />

      <div className="grid gap-6 md:grid-cols-2">
        <PaymentsPanel />
        <PayoutsPanel />
      </div>
    </div>
  );
}
