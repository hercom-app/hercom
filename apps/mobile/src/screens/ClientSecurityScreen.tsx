import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AccountScreenShell } from "../components/AccountScreenShell";
import { SecurityCenterActions } from "../components/HelpFab";
import { TacticalText } from "../components/tactical";

type ClientSecurityScreenProps = {
  onOpenMenu: () => void;
  fallbackCenter?: { lat: number; lng: number };
};

/** Mismas acciones que el botón del escudo. */
export function ClientSecurityScreen({
  onOpenMenu,
  fallbackCenter,
}: ClientSecurityScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <AccountScreenShell title="Seguridad" onOpenMenu={onOpenMenu}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <TacticalText size={15} className="mb-5">
          Contacta a emergencias o encuentra atención médica cerca.
        </TacticalText>
        <SecurityCenterActions fallbackCenter={fallbackCenter} />
        <View style={{ height: 8 }} />
      </ScrollView>
    </AccountScreenShell>
  );
}
