import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { SIGN_IN_LAYOUT_FLEX } from "./SignInScreenBackground";

/**
 * Curvas tipo autopista sobre el azul (relieve urbano legible sin oscurecer el fondo).
 */
export function LoginHeroStreetOverlay() {
  const { width, height } = useWindowDimensions();
  const bandHeight = (height * SIGN_IN_LAYOUT_FLEX.hero) / (SIGN_IN_LAYOUT_FLEX.hero + SIGN_IN_LAYOUT_FLEX.lower);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={bandHeight}>
        <Path
          d={`M ${-width * 0.08} ${bandHeight * 0.42} C ${width * 0.22} ${bandHeight * 0.12}, ${width * 0.62} ${bandHeight * 0.58}, ${width * 1.12} ${bandHeight * 0.28}`}
          stroke="rgba(255, 255, 255, 0.28)"
          strokeWidth={20}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M ${-width * 0.08} ${bandHeight * 0.42} C ${width * 0.22} ${bandHeight * 0.12}, ${width * 0.62} ${bandHeight * 0.58}, ${width * 1.12} ${bandHeight * 0.28}`}
          stroke="rgba(7, 89, 190, 0.55)"
          strokeWidth={2.5}
          fill="none"
        />
        <Path
          d={`M ${-width * 0.05} ${bandHeight * 0.72} C ${width * 0.38} ${bandHeight * 0.48}, ${width * 0.7} ${bandHeight * 0.82}, ${width * 1.05} ${bandHeight * 0.55}`}
          stroke="rgba(255, 255, 255, 0.18)"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M ${width * 0.08} ${bandHeight * 0.05} C ${width * 0.35} ${bandHeight * 0.32}, ${width * 0.55} ${bandHeight * 0.08}, ${width * 0.92} ${bandHeight * 0.38}`}
          stroke="rgba(255, 255, 255, 0.14)"
          strokeWidth={10}
          fill="none"
        />
        <Path
          d={`M ${width * 0.55} ${-bandHeight * 0.05} L ${width * 0.55} ${bandHeight * 1.05}`}
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth={8}
        />
        <Path
          d={`M ${width * 0.28} ${-bandHeight * 0.05} L ${width * 0.28} ${bandHeight * 0.95}`}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={6}
        />
      </Svg>
    </View>
  );
}