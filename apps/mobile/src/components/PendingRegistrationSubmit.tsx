import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import {
  clearPendingDriverRegistration,
  loadPendingDriverRegistration,
  submitDriverApplicationFromPending,
} from "../lib/driverRegistration";
import { convexErrorMessage } from "../lib/convexErrorMessage";
import {
  TacticalButton,
  TacticalLabel,
  TacticalPanel,
  TacticalScreen,
  TacticalStatus,
  TacticalText,
} from "./tactical";
import { TACTICAL_COLORS } from "../constants/theme";

function errorDetail(error: unknown): string {
  if (error instanceof Error) {
    return [error.message, error.stack].filter(Boolean).join("\n");
  }
  return String(error);
}

/** Tras Google OAuth, sube archivos y envía la solicitud de chofer pendiente. */
export function PendingRegistrationSubmit({
  children,
}: {
  children: ReactNode;
}) {
  const generateUploadUrl = useMutation(
    api.driverApplications.generateUploadUrl,
  );
  const submitApplication = useMutation(api.driverApplications.submit);
  const recordLog = useMutation(api.adminLogs.record);
  const driver = useQuery(api.drivers.getMyDriverProfile);
  const application = useQuery(api.driverApplications.getMyApplication);
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (driver === undefined || application === undefined) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const pending = await loadPendingDriverRegistration();
      if (cancelled) {
        return;
      }
      if (pending === null) {
        setProcessing(false);
        return;
      }

      if (
        driver !== null ||
        application?.status === "pending" ||
        application?.status === "approved"
      ) {
        await clearPendingDriverRegistration();
        if (!cancelled) {
          setProcessing(false);
        }
        return;
      }

      try {
        await submitDriverApplicationFromPending(
          pending,
          () => generateUploadUrl({}),
          (args) => submitApplication(args),
        );
        await clearPendingDriverRegistration();
      } catch (submitError) {
        const message = convexErrorMessage(
          submitError,
          "No se pudo enviar la solicitud de chofer.",
        );
        void recordLog({
          action: "driverApplications.submit",
          message,
          detail: errorDetail(submitError),
        }).catch((logError) => {
          console.error("[hercom] no se pudo guardar el log", logError);
        });
        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setProcessing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    application,
    driver,
    generateUploadUrl,
    recordLog,
    submitApplication,
  ]);

  if (processing) {
    return (
      <TacticalScreen className="items-center justify-center px-6">
        <ActivityIndicator color={TACTICAL_COLORS.accent} size="large" />
        <TacticalLabel size={11} tone="text" className="mt-5 text-center">
          Enviando solicitud de chofer
        </TacticalLabel>
        <TacticalText size={11} className="mt-2 text-center">
          Hercom validará tu registro antes de habilitar el modo conductor.
        </TacticalText>
      </TacticalScreen>
    );
  }

  if (error !== null) {
    return (
      <TacticalScreen className="items-center justify-center px-6">
        <TacticalPanel corners className="w-full max-w-sm">
          <View className="flex-row">
            <TacticalStatus label="Error al registrar" tone="danger" />
          </View>
          <TacticalText size={12} tone="text" className="mt-3">
            {error}
          </TacticalText>
          <View className="mt-5">
            <TacticalButton
              label="Entrar a la app"
              variant="secondary"
              onPress={() => {
                void clearPendingDriverRegistration();
                setError(null);
              }}
            />
          </View>
        </TacticalPanel>
      </TacticalScreen>
    );
  }

  return <>{children}</>;
}
