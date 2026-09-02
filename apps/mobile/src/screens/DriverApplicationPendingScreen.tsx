import { Text, View } from "react-native";
import { useAuthActions } from "@convex-dev/auth/react";
import { UiButton, UiCard } from "../components/ui";

type DriverApplicationPendingScreenProps = {
  dni?: string;
  fullName?: string;
};

/** Pantalla mientras la solicitud de chofer está en revisión. */
export function DriverApplicationPendingScreen({
  dni,
  fullName,
}: DriverApplicationPendingScreenProps) {
  const { signOut } = useAuthActions();

  return (
    <View className="flex-1 items-center justify-center bg-canvas px-6">
      <UiCard className="w-full max-w-sm">
        <Text className="mb-2 text-center text-xl font-bold text-slate-900">
          Solicitud enviada
        </Text>
        <Text className="mb-4 text-center text-sm leading-5 text-slate-500">
          Tu registro como chofer está en revisión. Te avisaremos cuando sea
          aprobado.
        </Text>
        {fullName !== undefined && (
          <Text className="text-center text-sm font-medium text-slate-800">
            {fullName}
          </Text>
        )}
        {dni !== undefined && (
          <Text className="mt-1 text-center text-sm text-slate-500">
            DNI: {dni}
          </Text>
        )}
        <View className="mt-6">
          <UiButton
            label="Cerrar sesión"
            variant="secondary"
            onPress={() => void signOut()}
          />
        </View>
      </UiCard>
    </View>
  );
}
