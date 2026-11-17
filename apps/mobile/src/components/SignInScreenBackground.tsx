import { Image, StyleSheet, View } from "react-native";
import { HERCOM_COLORS } from "../constants/theme";

/** Gris inferior como en splash / hero de la web comercial. */
export const SIGN_IN_BOTTOM_GRAY = "#E5E5E5";

const HERO_FLEX = 11;
const LOWER_FLEX = 14;

/**
 * Mitad superior azul con textura de mapa (autopistas), mitad inferior gris.
 * Misma base visual que `apps/landing-page/assets/splash.jpg`.
 */
export function SignInScreenBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.heroBand}>
        <Image
          source={require("../../assets/images/login-map-light.webp")}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <View style={styles.heroBlueWash} />
        <View style={styles.heroSeamFade} />
      </View>
      <View style={styles.lowerBand} />
    </View>
  );
}

export const SIGN_IN_LAYOUT_FLEX = {
  hero: HERO_FLEX,
  lower: LOWER_FLEX,
} as const;

const styles = StyleSheet.create({
  heroBand: {
    flex: HERO_FLEX,
    backgroundColor: HERCOM_COLORS.primary,
    overflow: "hidden",
  },
  heroBlueWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(11, 112, 254, 0.58)",
  },
  heroSeamFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
    backgroundColor: SIGN_IN_BOTTOM_GRAY,
    opacity: 0.35,
  },
  lowerBand: {
    flex: LOWER_FLEX,
    backgroundColor: SIGN_IN_BOTTOM_GRAY,
  },
});