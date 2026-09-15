import type { ReactNode } from "react";
import { View } from "react-native";
import { FieldScreenHeader, TacticalScreen } from "./tactical";

type AccountScreenShellProps = {
  title: string;
  subtitle?: string;
  onOpenMenu: () => void;
  children: ReactNode;
  /** Mantenido por compatibilidad; ambos usan el shell institucional. */
  variant?: "light" | "tactical";
};

/** Cabecera navy + contenido sobre canvas (Ayuda, Seguridad, Mi Información). */
export function AccountScreenShell({
  title,
  subtitle,
  onOpenMenu,
  children,
}: AccountScreenShellProps) {
  return (
    <TacticalScreen>
      <FieldScreenHeader
        title={title}
        subtitle={subtitle}
        onOpenMenu={onOpenMenu}
      />
      <View className="flex-1">{children}</View>
    </TacticalScreen>
  );
}
