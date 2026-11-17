import { Image, StyleSheet, View } from "react-native";
import { HERCOM_COLORS } from "../constants/theme";
import { LoginHeroStreetOverlay } from "./LoginHeroStreetOverlay";

/** Gris inferior como en splash / hero de la web comercial. */
export const SIGN_IN_BOTTOM_GRAY = "#E5E5E5";

const HERO_FLEX = 11;
const LOWER_FLEX = 14;

/**
 * Mitad superior azul con textura de mapa (autopistas), mitad inferior gris.
 * La capa azul es liviana para que se lean las calles del mapa y el overlay SVG.
 */
export function SignInScreenBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.heroBand}>
        <Image
          source={require("../../assets/images/login-map-light.webp")}
          style={styles.mapLight}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <Image
          source={require("../../assets/images/login-map-dark.webp")}
          style={styles.mapDark}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <View style={styles.heroBlueWash} />
        <LoginHeroStreetOverlay />
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
    backgroundColor: HERCOM_COLORS.primarySoft,
    overflow: "hidden",
  },
  mapLight: {
    ...StyleSheet.absoluteFill,
    opacity: 0.92,
  },
  mapDark: {
    ...StyleSheet.absoluteFill,
    opacity: 0.22,
  },
  heroBlueWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(11, 112, 254, 0.2)",
  },
  heroSeamFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
    backgroundColor: SIGN_IN_BOTTOM_GRAY,
    opacity: 0.22,
  },
  lowerBand: {
    flex: LOWER_FLEX,
    backgroundColor: SIGN_IN_BOTTOM_GRAY,
  },
});