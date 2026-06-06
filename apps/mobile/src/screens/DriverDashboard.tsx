import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@proyecto/backend";
import { AvailabilityToggle } from "../components/AvailabilityToggle";
import { ServiceCard } from "../components/ServiceCard";

export function DriverDashboard() {
  const { signOut } = useAuthActions();
  const driver = useQuery(api.drivers.getMyDriverProfile);
  const services = useQuery(api.services.listForDriver, {});

  if (driver === undefined) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  if (driver === null) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="mb-2 text-center text-base text-slate-700">
          Tu cuenta no tiene un perfil de chofer asignado.
        </Text>
        <Text className="text-center text-sm text-slate-500">
          Contacta al administrador para activar tu cuenta.
        </Text>
        <TouchableOpacity onPress={() => void signOut()} className="mt-6">
          <Text className="text-sm font-semibold text-brand">
            Cerrar sesión
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const activeServices = (services ?? []).filter(
    (s) => s.status === "assigned" || s.status === "en_route",
  );

  return (
    <View className="flex-1 px-4 pt-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-slate-900">Mis viajes</Text>
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
