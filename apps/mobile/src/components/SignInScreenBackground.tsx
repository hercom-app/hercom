import { Image, StyleSheet, useWindowDimensions, View } from "react-native";
import { HERCOM_COLORS } from "../constants/theme";

/** Gris de la mitad inferior en `apps/landing-page/assets/splash.jpg`. */
export const SIGN_IN_BOTTOM_GRAY = "#E5E5E5";

/** La franja azul termina al 46% del alto, como en el splash. */
export const SIGN_IN_BAND_RATIO = 0.46;

const BAND_RADIUS = 24;

/** Franja azul con mapa de calles en dos tonos y esquinas inferiores redondeadas. */
export function SignInScreenBackground() {
  const { height } = useWindowDimensions();

  return (
    <View style={styles.root} pointerEvents="none">
      <View style={[styles.band, { height: height * SIGN_IN_BAND_RATIO }]}>
        <Image
          source={require("../../assets/images/login-map-blue.jpg")}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SIGN_IN_BOTTOM_GRAY,
  },
  band: {
    backgroundColor: HERCOM_COLORS.primary,
    borderBottomLeftRadius: BAND_RADIUS,
    borderBottomRightRadius: BAND_RADIUS,
    overflow: "hidden",
  },
});
