import { View } from "react-native";
import { useAppTheme } from "../contexts/ThemeContext";
import { TacticalLabel } from "./tactical";
import { UiChip } from "./ui";

/** Interruptor de apariencia: el HUD actual es oscuro; el claro usa fondo blanco. */
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
