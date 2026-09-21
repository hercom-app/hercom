import { View } from "react-native";
import { useAuthActions } from "@convex-dev/auth/react";
import { UiButton, UiCard } from "../components/ui";
import {
  TacticalLabel,
  TacticalReadout,
  TacticalText,
  TacticalTitle,
} from "../components/tactical";
import { HERCOM_COLORS } from "../constants/theme";

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
    <View
      className="flex-1 items-center justify-center px-6"
      style={{ backgroundColor: HERCOM_COLORS.canvas }}
    >
      <UiCard className="w-full max-w-sm">
        <TacticalTitle size={19}>Solicitud enviada</TacticalTitle>
        <TacticalText size={13} className="mt-2">
          Tu registro como chofer está en revisión. Te avisaremos cuando sea
          aprobado.
        </TacticalText>

        {(fullName !== undefined || dni !== undefined) && (
          <View
            className="mt-4 rounded-2xl px-3 py-2"
            style={{ backgroundColor: HERCOM_COLORS.primarySoft }}
          >
            <TacticalLabel tone="accent" className="mt-1.5">
              Datos del postulante
            </TacticalLabel>
            {fullName !== undefined && (
              <TacticalReadout label="Nombre" value={fullName} />
            )}
            {dni !== undefined && (
              <TacticalReadout label="DNI" value={dni} tone="accent" />
            )}
          </View>
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
