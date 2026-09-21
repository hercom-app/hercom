import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HamburgerButton } from "../HamburgerButton";
import { HERCOM_COLORS, POPPINS, TYPE } from "../../constants/theme";

type UberScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onOpenMenu: () => void;
  trailing?: ReactNode;
  /** En pantallas secundarias sobre canvas blanco. */
  variant?: "map" | "stack";
};

/** Cabecera limpia — FAB menú + título (estilo Uber / app transporte). */
export function UberScreenHeader({
  title,
  subtitle,
  onOpenMenu,
  trailing,
  variant = "stack",
}: UberScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const isMap = variant === "map";

  return (
    <View
      style={{
        paddingTop: isMap ? 0 : insets.top + 4,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: isMap ? "transparent" : HERCOM_COLORS.white,
        borderBottomWidth: isMap ? 0 : 1,
        borderBottomColor: HERCOM_COLORS.border,
      }}
    >
      <View className="flex-row items-center gap-3">
        <HamburgerButton onPress={onOpenMenu} variant="light" />
        <View className="min-w-0 flex-1">
          <Text
            numberOfLines={1}
            style={{
              fontFamily: POPPINS.bold,
              fontSize: TYPE.title,
              color: HERCOM_COLORS.text,
            }}
          >
            {title}
          </Text>
          {subtitle !== undefined && subtitle !== "" && (
            <Text
              numberOfLines={1}
              style={{
                fontFamily: POPPINS.regular,
                fontSize: TYPE.caption,
                color: HERCOM_COLORS.textMuted,
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {trailing}
      </View>
    </View>
  );
}
