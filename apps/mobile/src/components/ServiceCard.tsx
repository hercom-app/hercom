import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc } from "@proyecto/backend/dataModel";

const STATUS_LABELS: Record<Doc<"services">["status"], string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  heading_to_pickup: "Yendo a recoger",
  arrived_pickup: "Llegó al punto",
  in_progress: "En viaje",
  arrived_destination: "Llegó al destino",
  en_route: "En camino",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

export function ServiceCard({ service }: { service: Doc<"services"> }) {
  const [securityCodeInput, setSecurityCodeInput] = useState("");
  const updateStatus = useMutation(api.services.updateStatus);
  const startTripWithCode = useMutation(api.services.startTripWithCode);
  const canStartTrip = securityCodeInput.trim().length > 0;

  return (
    <View className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase text-brand">
          {STATUS_LABELS[service.status]}
        </Text>
        <Text className="text-sm font-bold text-slate-900">
          Comisión app S/{service.driverCommission.toFixed(2)}
        </Text>
      </View>

      <Text className="text-sm text-slate-700">
        Origen: {service.origin.address}
      </Text>
      <Text className="mb-3 text-sm text-slate-700">
        Destino: {service.destination.address}
      </Text>

      {service.securityCode !== undefined && service.status !== "finished" && (
        <View className="mb-3 rounded-xl bg-indigo-50 p-3">
          <Text className="text-xs text-indigo-700">
            Código de seguridad:{" "}
            <Text className="font-bold text-indigo-900">{service.securityCode}</Text>
          </Text>
        </View>
      )}

      {service.status === "assigned" && (
        <TouchableOpacity
          onPress={() =>
            void updateStatus({
              serviceId: service._id,
              status: "heading_to_pickup",
            })
          }
          className="rounded-xl bg-brand py-2 active:bg-brand-dark"
        >
          <Text className="text-center text-sm font-semibold text-white">
            Salir a recoger
          </Text>
        </TouchableOpacity>
      )}

      {service.status === "heading_to_pickup" && (
        <TouchableOpacity
          onPress={() =>
            void updateStatus({
              serviceId: service._id,
              status: "arrived_pickup",
            })
          }
          className="rounded-xl bg-amber-600 py-2 active:bg-amber-700"
        >
          <Text className="text-center text-sm font-semibold text-white">
            Llegué al punto de partida
          </Text>
        </TouchableOpacity>
      )}

      {service.status === "arrived_pickup" && (
        <View className="gap-2">
          <TextInput
            value={securityCodeInput}
            onChangeText={setSecurityCodeInput}
            keyboardType="number-pad"
            placeholder="Ingresa código del cliente"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            maxLength={6}
          />
          <TouchableOpacity
            onPress={() =>
              void startTripWithCode({
                serviceId: service._id,
                code: securityCodeInput,
              })
            }
            disabled={!canStartTrip}
            className="rounded-xl bg-brand py-2 active:bg-brand-dark disabled:opacity-60"
          >
            <Text className="text-center text-sm font-semibold text-white">
              Validar código e iniciar viaje
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {(service.status === "in_progress" || service.status === "en_route") && (
        <TouchableOpacity
          onPress={() =>
            void updateStatus({
              serviceId: service._id,
              status: "arrived_destination",
            })
          }
          className="rounded-xl bg-blue-600 py-2 active:bg-blue-700"
        >
          <Text className="text-center text-sm font-semibold text-white">
            Llegué al destino
          </Text>
        </TouchableOpacity>
      )}

      {service.status === "arrived_destination" && (
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
