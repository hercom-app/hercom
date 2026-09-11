import { View } from "react-native";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  TacticalButton,
  TacticalLabel,
  TacticalPanel,
  TacticalReadout,
  TacticalScreen,
  TacticalStatus,
  TacticalText,
  TacticalTitle,
} from "../components/tactical";

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
    <TacticalScreen className="items-center justify-center px-6">
      <TacticalPanel corners className="w-full max-w-sm">
        <View className="flex-row">
          <TacticalStatus label="Expediente en revisión" tone="warning" />
        </View>

        <TacticalTitle size={19} className="mt-3">
          Solicitud enviada
        </TacticalTitle>
        <TacticalText size={12} className="mt-2">
          Tu registro como chofer está en revisión. Te avisaremos cuando sea
          aprobado.
        </TacticalText>

        {(fullName !== undefined || dni !== undefined) && (
          <TacticalPanel tone="sunken" className="mt-4 px-3 py-1.5">
            <TacticalLabel size={9} tone="accent" className="mt-1.5">
              Datos del postulante
            </TacticalLabel>
            {fullName !== undefined && (
              <TacticalReadout label="Nombre" value={fullName} />
            )}
            {dni !== undefined && (
              <TacticalReadout label="DNI" value={dni} tone="accent" />
            )}
          </TacticalPanel>
        )}

        <View className="mt-6">
          <TacticalButton
            label="Cerrar sesión"
            variant="secondary"
            onPress={() => void signOut()}
          />
        </View>
      </TacticalPanel>
    </TacticalScreen>
  );
}
