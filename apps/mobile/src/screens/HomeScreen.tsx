import { ActivityIndicator, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { useAppMode } from "../contexts/AppModeContext";
import { ClientDashboard } from "./ClientDashboard";
import { DriverDashboard } from "./DriverDashboard";
import { DriverRegisterScreen } from "./DriverRegisterScreen";

/**
 * Vista según modo activo (pasajero / chofer).
 * Un mismo usuario con perfil de chofer puede alternar sin cerrar sesión.
 */
export function HomeScreen() {
  const driver = useQuery(api.drivers.getMyDriverProfile);
  const {
    mode,
    showDriverRegistration,
    closeDriverRegistration,
    hasDriverProfile,
  } = useAppMode();

  if (driver === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <ActivityIndicator color="#007AFF" />
      </View>
    );
  }

  if (showDriverRegistration) {
    return (
      <DriverRegisterScreen
        onBack={closeDriverRegistration}
        submitAsAuthenticated
        onSubmitSuccess={closeDriverRegistration}
      />
    );
  }

  if (mode === "driver" && hasDriverProfile) {
    return <DriverDashboard />;
  }

  return <ClientDashboard />;
}
