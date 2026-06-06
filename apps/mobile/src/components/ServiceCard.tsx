import { Text, TouchableOpacity, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc } from "@proyecto/backend/dataModel";

const STATUS_LABELS: Record<Doc<"services">["status"], string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  en_route: "En camino",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

export function ServiceCard({ service }: { service: Doc<"services"> }) {
  const updateStatus = useMutation(api.services.updateStatus);

  return (
    <View className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase text-brand">
          {STATUS_LABELS[service.status]}
        </Text>
        <Text className="text-sm font-bold text-slate-900">
          Comisión ${service.driverCommission.toFixed(2)}
        </Text>
      </View>

      <Text className="text-sm text-slate-700">
        Origen: {service.origin.address}
      </Text>
      <Text className="mb-3 text-sm text-slate-700">
        Destino: {service.destination.address}
      </Text>

      {service.status === "assigned" && (
        <TouchableOpacity
          onPress={() =>
            void updateStatus({ serviceId: service._id, status: "en_route" })
          }
          className="rounded-xl bg-brand py-2 active:bg-brand-dark"
        >
          <Text className="text-center text-sm font-semibold text-white">
            Iniciar viaje
          </Text>
        </TouchableOpacity>
      )}

      {service.status === "en_route" && (
        <TouchableOpacity
          onPress={() =>
            void updateStatus({ serviceId: service._id, status: "finished" })
          }
          className="rounded-xl bg-green-600 py-2 active:bg-green-700"
        >
          <Text className="text-center text-sm font-semibold text-white">
            Finalizar viaje
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
