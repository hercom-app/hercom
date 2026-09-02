import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ActivityIndicator, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc } from "@proyecto/backend/dataModel";
import { loadAppMode, saveAppMode, type AppMode } from "../lib/appMode";

type DriverApplicationStatus = Doc<"driverApplications">["status"] | null;

type AppModeContextValue = {
  mode: AppMode;
  setMode: (mode: AppMode) => Promise<void>;
  hasDriverProfile: boolean;
  canUseDriverMode: boolean;
  canUseClientMode: boolean;
  driverApplicationStatus: DriverApplicationStatus;
  hasPendingDriverApplication: boolean;
  showDriverRegistration: boolean;
  openDriverRegistration: () => void;
  closeDriverRegistration: () => void;
  userName: string;
};

const AppModeContext = createContext<AppModeContextValue | null>(null);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const me = useQuery(api.users.getMe);
  const driver = useQuery(api.drivers.getMyDriverProfile);
  const application = useQuery(api.driverApplications.getMyApplication);
  const [mode, setModeState] = useState<AppMode>("client");
  const [ready, setReady] = useState(false);
  const [showDriverRegistration, setShowDriverRegistration] = useState(false);

  const hasDriverProfile = driver !== null;
  const canUseDriverMode = hasDriverProfile;
  const canUseClientMode =
    me != null && me.role !== "admin" && me.role !== "superadmin";
  const driverApplicationStatus = application?.status ?? null;
  const hasPendingDriverApplication = application?.status === "pending";

  useEffect(() => {
    if (me === undefined || driver === undefined || application === undefined) {
      return;
    }

    void (async () => {
      const stored = await loadAppMode();
      if (stored === "driver" && hasDriverProfile) {
        setModeState("driver");
      } else if (stored === "client" && canUseClientMode) {
        setModeState("client");
      } else if (hasDriverProfile && !canUseClientMode) {
        setModeState("driver");
      } else {
        setModeState("client");
      }
      setReady(true);
    })();
  }, [application, canUseClientMode, driver, hasDriverProfile, me]);

  const setMode = useCallback(
    async (nextMode: AppMode) => {
      if (nextMode === "driver" && !canUseDriverMode) {
        return;
      }
      if (nextMode === "client" && !canUseClientMode) {
        return;
      }
      setModeState(nextMode);
      await saveAppMode(nextMode);
    },
    [canUseClientMode, canUseDriverMode],
  );

  const value = useMemo(
    (): AppModeContextValue => ({
      mode,
      setMode,
      hasDriverProfile,
      canUseDriverMode,
      canUseClientMode,
      driverApplicationStatus,
      hasPendingDriverApplication,
      showDriverRegistration,
      openDriverRegistration: () => setShowDriverRegistration(true),
      closeDriverRegistration: () => setShowDriverRegistration(false),
      userName: me?.name ?? me?.email ?? "",
    }),
    [
      canUseClientMode,
      canUseDriverMode,
      driverApplicationStatus,
      hasDriverProfile,
      hasPendingDriverApplication,
      me?.email,
      me?.name,
      mode,
      setMode,
      showDriverRegistration,
    ],
  );

  if (
    me === undefined ||
    driver === undefined ||
    application === undefined ||
    !ready
  ) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color="#64748B" />
      </View>
    );
  }

  return (
    <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>
  );
}

export function useAppMode(): AppModeContextValue {
  const context = useContext(AppModeContext);
  if (context === null) {
    throw new Error("useAppMode debe usarse dentro de AppModeProvider.");
  }
  return context;
}
