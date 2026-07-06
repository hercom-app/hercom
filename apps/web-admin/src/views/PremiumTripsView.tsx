import { useMemo, useState } from "react";
import { PremiumServiceForm } from "../components/PremiumServiceForm";
import { ServicesBoard } from "../components/ServicesBoard";
import { AdminRegionFilters } from "../components/AdminRegionFilters";
import { AdminPage, AdminPageHeader } from "../components/AdminLayout";
import {
  EMPTY_REGION_FILTER,
  regionToQueryArgs,
  selectClass,
  type RegionFilter,
} from "../lib/adminFilters";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc } from "@proyecto/backend/dataModel";

type ChannelFilter = "" | "phone" | "web_comercial";
type StatusFilter = "" | Doc<"services">["status"];

export function PremiumTripsView() {
  const [region, setRegion] = useState<RegionFilter>(EMPTY_REGION_FILTER);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

  const queryArgs = useMemo(
    () => ({
      serviceType: "premium" as const,
      ...regionToQueryArgs(region),
      ...(channelFilter !== "" ? { requestChannel: channelFilter } : {}),
      ...(statusFilter !== "" ? { status: statusFilter } : {}),
    }),
    [region, channelFilter, statusFilter],
  );

  const services = useQuery(api.services.listAllForAdmin, queryArgs);

  return (
    <AdminPage>
      <AdminPageHeader
        title="Viajes premium"
        description="Registro manual por teléfono o web comercial y seguimiento de viajes premium."
      />

      <AdminRegionFilters value={region} onChange={setRegion}>
        <select
          value={channelFilter}
          onChange={(event) =>
            setChannelFilter(event.target.value as ChannelFilter)
          }
          className={selectClass}
        >
          <option value="">Canal: todos</option>
          <option value="phone">Teléfono</option>
          <option value="web_comercial">Web comercial</option>
        </select>
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
          <option value="in_progress">En viaje</option>
          <option value="finished">Finalizado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </AdminRegionFilters>

      <PremiumServiceForm />

      <ServicesBoard services={services} title="Viajes premium registrados" />
    </AdminPage>
  );
}
