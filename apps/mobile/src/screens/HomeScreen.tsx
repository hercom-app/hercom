import { useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc } from "@proyecto/backend/dataModel";
import { useAppMode } from "../contexts/AppModeContext";
import { BrandSplash } from "../components/BrandSplash";
import { ClientPendingRating } from "../components/ClientPendingRating";
import { ClientDashboard } from "./ClientDashboard";
import { DriverDashboard } from "./DriverDashboard";
import { DriverRegisterScreen } from "./DriverRegisterScreen";

/**
 * Vista según modo activo (pasajero / chofer).
 * Un mismo usuario con perfil de chofer puede alternar sin cerrar sesión.
 */
export function HomeScreen() {
  const driverQuery = useQuery(api.drivers.getMyDriverProfile);
  const driverCache = useRef<Doc<"drivers"> | null | undefined>(undefined);
  if (driverQuery !== undefined) {
    driverCache.current = driverQuery;
  }
  const driver = driverQuery !== undefined ? driverQuery : driverCache.current;
  const {
    mode,
    showDriverRegistration,
    closeDriverRegistration,
    hasDriverProfile,
  } = useAppMode();

  if (driver === undefined) {
    return <BrandSplash />;
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

  return (
    <>
      <ClientDashboard />
      <ClientPendingRating />
    </>
  );
}
