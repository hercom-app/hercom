import { View } from "react-native";
import { AccountScreenShell } from "../components/AccountScreenShell";
import { TacticalEmpty } from "../components/tactical";

type ClientSecurityScreenProps = {
  onOpenMenu: () => void;
};

/** Sección vacía a la espera del contenido de Seguridad. */
export function ClientSecurityScreen({ onOpenMenu }: ClientSecurityScreenProps) {
  return (
    <AccountScreenShell
      variant="tactical"
      title="Seguridad"
      onOpenMenu={onOpenMenu}
    >
      <View className="flex-1 px-5 pt-8">
        <TacticalEmpty title="Pendiente" />
      </View>
    </AccountScreenShell>
  );
}
