import { TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../contexts/ThemeContext";
import {
  TACTICAL_BORDER,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";

type HamburgerButtonProps = {
  onPress: () => void;
  /** `navy` = icono blanco sobre cabecera; `tactical` = sobre canvas; `light` = círculo blanco. */
  variant?: "light" | "tactical" | "navy";
};

export function HamburgerButton({
  onPress,
  variant = "tactical",
}: HamburgerButtonProps) {
  const { colors } = useAppTheme();

  if (variant === "navy") {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityLabel="Abrir menú"
        activeOpacity={0.75}
        className="h-11 w-11 items-center justify-center"
      >
        <View className="gap-1.5">
          <View className="h-0.5 w-5 rounded-sm bg-white" />
          <View className="h-0.5 w-5 rounded-sm bg-white" />
          <View className="h-0.5 w-5 rounded-sm bg-white opacity-80" />
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === "tactical") {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityLabel="Abrir menú"
        activeOpacity={0.75}
        className="h-11 w-11 items-center justify-center"
        style={{
          backgroundColor: colors.surface,
          borderRadius: TACTICAL_RADIUS.sharp,
          borderWidth: 1,
          borderColor: TACTICAL_BORDER,
        }}
      >
        <View className="gap-1.5">
          <View
            className="h-0.5 w-5"
            style={{ backgroundColor: colors.accent }}
          />
          <View
            className="h-0.5 w-5"
            style={{ backgroundColor: colors.accent }}
          />
          <View
            className="h-0.5 w-3.5"
            style={{ backgroundColor: colors.steel }}
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
