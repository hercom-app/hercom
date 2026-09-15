import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { ANA } from "../constants/theme";
import { useAppTheme } from "../contexts/ThemeContext";

type OpsHudBackdropProps = {
  /** Login: forzar navy aunque el tema sea claro. */
  forceScheme?: "dark" | "light";
};

/**
 * Fondo navy camo sin cuadrícula: capas mate de insignia / sea / strata.
 * Inspirado en apps institucionales militares (sobrio, no HUD de videojuego).
 */
export function OpsHudBackdrop({ forceScheme }: OpsHudBackdropProps) {
  const { scheme } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const isDark = (forceScheme ?? scheme) === "dark";

  const top = isDark ? ANA.insigniaBlue : ANA.insigniaBlue;
  const mid = isDark ? ANA.aircraftSeaBlue : ANA.blue;
  const bottom = isDark ? ANA.strataBlue : ANA.insigniaBlue;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="navyField" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top} stopOpacity="1" />
            <Stop offset="0.45" stopColor={mid} stopOpacity="1" />
            <Stop offset="1" stopColor={bottom} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#navyField)" />
        <Rect
          x={width * 0.08}
          y={height * 0.12}
          width={width * 0.55}
          height={height * 0.28}
          fill={ANA.strataBlue}
          opacity={0.22}
        />
        <Rect
          x={width * 0.42}
          y={height * 0.38}
          width={width * 0.48}
          height={height * 0.22}
          fill={ANA.navyBlue}
          opacity={0.18}
        />
        <Rect
          x={width * 0.05}
          y={height * 0.62}
          width={width * 0.38}
          height={height * 0.18}
          fill={ANA.aircraftInsigniaBlue}
          opacity={0.2}
        />
      </Svg>
    </View>
  );
}
