import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SHEET_SHADOW } from "../ui";
import { HERCOM_COLORS, UBER_RADIUS } from "../../constants/theme";

type UberBottomSheetProps = {
  children: ReactNode;
  /** Altura fija del sheet (px). Si no se pasa, crece con el contenido. */
  height?: number;
  showHandle?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Bottom sheet blanco estilo Uber — mapa visible arriba. */
export function UberBottomSheet({
  children,
  height,
  showHandle = true,
  style,
  contentStyle,
}: UberBottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="overflow-hidden"
      style={[
        {
          backgroundColor: HERCOM_COLORS.white,
          borderTopLeftRadius: UBER_RADIUS.sheet,
          borderTopRightRadius: UBER_RADIUS.sheet,
          paddingBottom: insets.bottom + 8,
          ...(height !== undefined ? { height } : {}),
        },
        SHEET_SHADOW,
        style,
      ]}
    >
      {showHandle && (
        <View className="items-center pb-2 pt-3">
          <View
            className="h-1 w-10"
            style={{
              backgroundColor: HERCOM_COLORS.border,
              borderRadius: 4,
            }}
          />
        </View>
      )}
      <View style={[{ flex: height !== undefined ? 1 : undefined }, contentStyle]}>
        {children}
      </View>
    </View>
  );
}
