import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@proyecto/backend";
import { AvailabilityToggle } from "../components/AvailabilityToggle";
import { ServiceCard } from "../components/ServiceCard";

export function DriverDashboard() {
  const { signOut } = useAuthActions();
  const driver = useQuery(api.drivers.getMyDriverProfile);
  const services = useQuery(
    api.services.listForDriver,
    driver === undefined || driver === null ? "skip" : {},
  );

  if (driver === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <ActivityIndicator color="#007AFF" />
      </View>
    );
  }

  if (driver === null) {
    return null;
  }

  const activeServices = (services ?? []).filter(
    (s) => s.status === "assigned" || s.status === "en_route",
  );

  return (
    <View className="flex-1 bg-slate-100 px-4 pt-4">
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-slate-900">Mis viajes</Text>
          <Text className="text-sm text-slate-500">Chofer · atiende servicios</Text>
        </View>
        <TouchableOpacity onPress={() => void signOut()}>
          <Text className="text-sm font-semibold text-slate-500">Salir</Text>
        </TouchableOpacity>
      </View>

      <AvailabilityToggle status={driver.status} />

      <FlatList
        data={activeServices}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ServiceCard service={item} />}
        ListEmptyComponent={
          <Text className="mt-8 text-center text-sm text-slate-500">
            No tienes viajes activos por ahora.
          </Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
