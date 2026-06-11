import { ActivityIndicator, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { ClientDashboard } from "./ClientDashboard";
import { DriverDashboard } from "./DriverDashboard";

/**
 * Vista según perfil:
 * - `driver` → atiende servicios (panel chofer)
 * - `client` → solicita servicios (panel cliente)
 */
export function HomeScreen() {
  const me = useQuery(api.users.getMe);
  const driver = useQuery(api.drivers.getMyDriverProfile);

  if (me === undefined || driver === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <ActivityIndicator color="#007AFF" />
      </View>
    );
  }

  if (me === null) {
    return null;
  }

  const isDriver = me.role === "driver" || driver !== null;

  if (isDriver) {
    return <DriverDashboard />;
  }

  return <ClientDashboard />;
}
