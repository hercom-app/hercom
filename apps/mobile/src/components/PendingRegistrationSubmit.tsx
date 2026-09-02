import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@proyecto/backend";
import {
  clearPendingDriverRegistration,
  loadPendingDriverRegistration,
  submitDriverApplicationFromPending,
} from "../lib/driverRegistration";

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
      <View className="flex-1 items-center justify-center bg-canvas px-6">
        <ActivityIndicator color="#64748B" size="large" />
        <Text className="mt-4 text-center text-sm text-slate-600">
          Enviando tu solicitud de chofer…
        </Text>
        <Text className="mt-2 text-center text-xs text-slate-500">
          Hercom validará tu registro antes de habilitar el modo conductor.
        </Text>
      </View>
    );
  }

  if (error !== null) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-6">
        <Text className="mb-2 text-center text-base font-semibold text-red-600">
          Error al registrar
        </Text>
        <Text className="text-center text-sm text-slate-600">{error}</Text>
      </View>
    );
  }

  return <>{children}</>;
}
