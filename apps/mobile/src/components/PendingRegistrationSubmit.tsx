import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@proyecto/backend";
import {
  clearPendingDriverRegistration,
  loadPendingDriverRegistration,
  submitDriverApplicationFromPending,
} from "../lib/driverRegistration";
import {
  TacticalLabel,
  TacticalPanel,
  TacticalScreen,
  TacticalStatus,
  TacticalText,
} from "./tactical";
import { TACTICAL_COLORS } from "../constants/theme";

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
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const pending = await loadPendingDriverRegistration();
      if (pending === null) {
        setProcessing(false);
        return;
      }

      try {
        await submitDriverApplicationFromPending(
          pending,
          () => generateUploadUrl({}),
          (args) => submitApplication(args),
        );

        await clearPendingDriverRegistration();
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : "No se pudo enviar la solicitud de chofer.";
        setError(message);
      } finally {
        setProcessing(false);
      }
    })();
  }, [generateUploadUrl, submitApplication]);

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
        </TacticalPanel>
      </TacticalScreen>
    );
  }

  return <>{children}</>;
}
