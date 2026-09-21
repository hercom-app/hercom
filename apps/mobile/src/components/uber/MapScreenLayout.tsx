import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HERCOM_COLORS } from "../../constants/theme";

type MapScreenLayoutProps = {
  map: ReactNode;
  topOverlay?: ReactNode;
  bottomSheet?: ReactNode;
  /** FABs flotantes sobre el mapa (HelpFab, recenter, etc.) */
  mapOverlay?: ReactNode;
};

/** Layout mapa fullscreen + overlays — patrón Uber. */
export function MapScreenLayout({
  map,
  topOverlay,
  bottomSheet,
  mapOverlay,
}: MapScreenLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1" style={{ backgroundColor: HERCOM_COLORS.mapFallback }}>
      {map}
      {mapOverlay !== undefined && (
        <View pointerEvents="box-none" className="absolute inset-0">
          {mapOverlay}
        </View>
      )}
      {topOverlay !== undefined && (
        <View
          pointerEvents="box-none"
          className="absolute left-0 right-0 top-0 z-10 px-4"
          style={{ paddingTop: insets.top + 8 }}
        >
          {topOverlay}
        </View>
      )}
      {bottomSheet !== undefined && (
        <View className="absolute bottom-0 left-0 right-0 z-20">
          {bottomSheet}
        </View>
      )}
    </View>
  );
}
