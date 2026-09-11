import { TouchableOpacity, View } from "react-native";
import {
  TACTICAL_BORDER,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";

type HamburgerButtonProps = {
  onPress: () => void;
  /** `tactical` usa el cuadro angular del HUD en lugar del círculo blanco. */
  variant?: "light" | "tactical";
};

/** Botón de menú: círculo blanco (institucional) o cuadro HUD (táctico). */
export function HamburgerButton({
  onPress,
  variant = "tactical",
}: HamburgerButtonProps) {
  if (variant === "tactical") {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityLabel="Abrir menú"
        activeOpacity={0.75}
        className="h-11 w-11 items-center justify-center"
        style={{
          backgroundColor: TACTICAL_COLORS.surface,
          borderRadius: TACTICAL_RADIUS.sharp,
          borderWidth: 1,
          borderColor: TACTICAL_BORDER,
        }}
      >
        <View className="gap-1.5">
          <View
            className="h-0.5 w-5"
            style={{ backgroundColor: TACTICAL_COLORS.accent }}
          />
          <View
            className="h-0.5 w-5"
            style={{ backgroundColor: TACTICAL_COLORS.accent }}
          />
          <View
            className="h-0.5 w-3.5"
            style={{ backgroundColor: TACTICAL_COLORS.steel }}
          />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel="Abrir menú"
      activeOpacity={0.85}
      className="h-12 w-12 items-center justify-center rounded-full bg-white shadow-md"
      style={{
        shadowColor: "#0F172A",
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
      }}
    >
      <View className="gap-1.5">
        <View className="h-0.5 w-5 rounded-full bg-slate-900" />
        <View className="h-0.5 w-5 rounded-full bg-slate-900" />
        <View className="h-0.5 w-5 rounded-full bg-slate-900" />
      </View>
    </TouchableOpacity>
  );
}
