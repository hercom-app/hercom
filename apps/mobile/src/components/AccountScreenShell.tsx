import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HamburgerButton } from "./HamburgerButton";
import { GridBackdrop, TacticalText, TacticalTitle } from "./tactical";
import { useAppTheme } from "../contexts/ThemeContext";

type AccountScreenShellProps = {
  title: string;
  subtitle?: string;
  onOpenMenu: () => void;
  children: ReactNode;
  /** `tactical` usa el HUD oscuro; `light` es la cabecera institucional previa. */
  variant?: "light" | "tactical";
};

/** Cabecera compartida de las secciones del menú (Ayuda, Seguridad, Mi Información). */
export function AccountScreenShell({
  title,
  subtitle,
  onOpenMenu,
  children,
  variant = "tactical",
}: AccountScreenShellProps) {
  const insets = useSafeAreaInsets();
  const { scheme, colors, border } = useAppTheme();

  if (variant === "tactical") {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.base }}>
        {scheme === "dark" ? <GridBackdrop /> : null}
        <View
          style={{
            paddingTop: insets.top + 8,
            borderBottomWidth: 1,
            borderBottomColor: border,
            backgroundColor: colors.baseElevated,
          }}
          className="flex-row items-center gap-3 px-4 pb-3"
        >
          <HamburgerButton onPress={onOpenMenu} variant="tactical" />
          <View className="min-w-0 flex-1">
            <TacticalTitle size={17}>{title}</TacticalTitle>
            {subtitle !== undefined && subtitle !== "" && (
              <TacticalText className="mt-0.5" size={12}>
                {subtitle}
              </TacticalText>
            )}
          </View>
        </View>
        {children}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-canvas">
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="flex-row items-center gap-3 border-b border-slate-100 bg-white/90 px-4 pb-3"
      >
        <HamburgerButton onPress={onOpenMenu} />
        <View className="min-w-0 flex-1">
          <Text className="font-bold text-lg text-slate-900">{title}</Text>
          {subtitle !== undefined && subtitle !== "" && (
            <Text className="mt-0.5 text-sm leading-5 text-slate-500">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {children}
    </View>
  );
}
