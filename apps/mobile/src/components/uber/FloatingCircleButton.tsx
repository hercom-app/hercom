import type { ReactNode } from "react";
import { TouchableOpacity, type StyleProp, type ViewStyle } from "react-native";

const FAB_SHADOW = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.14,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 5,
} as const;

type FloatingCircleButtonProps = {
  onPress: () => void;
  children: ReactNode;
  accessibilityLabel: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** FAB circular blanco sobre el mapa (menú, volver, ubicación). */
export function FloatingCircleButton({
  onPress,
  children,
  accessibilityLabel,
  size = 48,
  style,
}: FloatingCircleButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.85}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
        },
        FAB_SHADOW,
        style,
      ]}
    >
      {children}
    </TouchableOpacity>
  );
}
