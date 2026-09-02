import { View } from "react-native";
import { AccountScreenShell } from "../components/AccountScreenShell";

type ClientSecurityScreenProps = {
  onOpenMenu: () => void;
};

/** Sección vacía a la espera del contenido de Seguridad. */
export function ClientSecurityScreen({ onOpenMenu }: ClientSecurityScreenProps) {
  return (
    <AccountScreenShell title="Seguridad" onOpenMenu={onOpenMenu}>
      <View className="flex-1 bg-slate-100" />
    </AccountScreenShell>
  );
}
