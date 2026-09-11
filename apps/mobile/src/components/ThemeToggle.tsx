import { View } from "react-native";
import { useAppTheme } from "../contexts/ThemeContext";
import { TacticalLabel } from "./tactical";
import { UiChip } from "./ui";

/** Interruptor de apariencia. El default de la app es claro (navy ANA). */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { scheme, setScheme } = useAppTheme();

  return (
    <View>
      {compact ? null : (
        <TacticalLabel className="mb-2" size={9}>
          Apariencia
        </TacticalLabel>
      )}
      <View className="flex-row gap-2">
        <UiChip
          label="Oscuro"
          selected={scheme === "dark"}
          onPress={() => void setScheme("dark")}
        />
        <UiChip
          label="Claro"
          selected={scheme === "light"}
          onPress={() => void setScheme("light")}
        />
      </View>
    </View>
  );
}
