import { Text, TouchableOpacity, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@proyecto/backend";

type DriverStatus = "available" | "busy" | "offline";

const STATUS_LABELS: Record<DriverStatus, string> = {
  available: "Disponible",
  busy: "Ocupado",
  offline: "Desconectado",
};

export function AvailabilityToggle({ status }: { status: DriverStatus }) {
  const setStatus = useMutation(api.drivers.setStatus);

  const isAvailable = status === "available";
  const next: DriverStatus = isAvailable ? "offline" : "available";

  return (
    <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-slate-800">
          Estado
        </Text>
        <View
          className={`rounded-full px-3 py-1 ${
            isAvailable ? "bg-green-100" : "bg-slate-200"
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              isAvailable ? "text-green-700" : "text-slate-600"
            }`}
          >
            {STATUS_LABELS[status]}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => void setStatus({ status: next })}
        disabled={status === "busy"}
        className={`rounded-xl py-3 ${
          status === "busy" ? "bg-slate-300" : "bg-brand active:bg-brand-dark"
        }`}
      >
        <Text className="text-center text-base font-semibold text-white">
          {status === "busy"
            ? "En servicio"
            : isAvailable
              ? "Ponerme desconectado"
              : "Ponerme disponible"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
