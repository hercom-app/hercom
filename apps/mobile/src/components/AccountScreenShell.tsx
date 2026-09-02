import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HamburgerButton } from "./HamburgerButton";

type AccountScreenShellProps = {
  title: string;
  subtitle?: string;
  onOpenMenu: () => void;
  children: ReactNode;
};

/** Cabecera compartida de las secciones del menú (Ayuda, Seguridad, Mi Información). */
export function AccountScreenShell({
  title,
  subtitle,
  onOpenMenu,
  children,
}: AccountScreenShellProps) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-slate-100">
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="flex-row items-center gap-3 border-b border-slate-200 bg-white px-4 pb-3"
      >
        <HamburgerButton onPress={onOpenMenu} />
        <View className="min-w-0 flex-1">
          <Text className="text-lg font-bold text-slate-900">{title}</Text>
          {subtitle !== undefined && subtitle !== "" && (
            <Text className="mt-0.5 text-xs leading-4 text-slate-500">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {children}
    </View>
  );
}
