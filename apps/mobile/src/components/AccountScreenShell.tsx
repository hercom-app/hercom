import type { ReactNode } from "react";
import { View } from "react-native";
import { HERCOM_COLORS } from "../constants/theme";
import { UberScreenHeader } from "./uber/UberScreenHeader";

type AccountScreenShellProps = {
  title: string;
  subtitle?: string;
  onOpenMenu: () => void;
  children: ReactNode;
  /** Mantenido por compatibilidad. */
  variant?: "light" | "tactical";
};

/** Cabecera limpia + contenido — Ayuda, Seguridad, Mi Información. */
export function AccountScreenShell({
  title,
  subtitle,
  onOpenMenu,
  children,
}: AccountScreenShellProps) {
  return (
    <View className="flex-1" style={{ backgroundColor: HERCOM_COLORS.canvas }}>
      <UberScreenHeader
        title={title}
        subtitle={subtitle}
        onOpenMenu={onOpenMenu}
        variant="stack"
      />
      <View className="flex-1">{children}</View>
    </View>
  );
}
