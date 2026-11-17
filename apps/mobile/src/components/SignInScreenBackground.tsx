import { useMemo } from "react";
import { Image, StyleSheet, useWindowDimensions, View } from "react-native";
import { HERCOM_COLORS } from "../constants/theme";

/** Gris de la mitad inferior en `apps/landing-page/assets/splash.jpg`. */
export const SIGN_IN_BOTTOM_GRAY = "#E5E5E5";

/** La franja azul termina al 46% del alto, como en el splash. */
export const SIGN_IN_BAND_RATIO = 0.46;

const BAND_RADIUS = 24;

const LOGIN_MAP = require("../../assets/images/login-map-blue.jpg");
const LOGIN_MAP_ASSET = Image.resolveAssetSource(LOGIN_MAP);

/** Encuadre del mapa: esquina superior derecha del JPG (cover centrado mostraba la izquierda). */
export type LoginMapFocal = "top-left" | "top-right" | "center";

const LOGIN_MAP_FOCAL: LoginMapFocal = "top-right";

function coverFocalStyle(
  bandWidth: number,
  bandHeight: number,
  focal: LoginMapFocal,
) {
  const imgW = LOGIN_MAP_ASSET.width;
  const imgH = LOGIN_MAP_ASSET.height;
  const scale = Math.max(bandWidth / imgW, bandHeight / imgH);
  const width = imgW * scale;
  const height = imgH * scale;

  let left: number | undefined;
  let right: number | undefined;
  let top = 0;

  if (focal === "top-right") {
    right = 0;
  } else if (focal === "top-left") {
    left = 0;
  } else {
    left = (bandWidth - width) / 2;
    top = (bandHeight - height) / 2;
  }

  return { position: "absolute" as const, width, height, top, left, right };
}

/** Franja azul con mapa de calles en dos tonos y esquinas inferiores redondeadas. */
export function SignInScreenBackground() {
  const { width: screenWidth, height } = useWindowDimensions();
  const bandHeight = height * SIGN_IN_BAND_RATIO;
  const mapStyle = useMemo(
    () => coverFocalStyle(screenWidth, bandHeight, LOGIN_MAP_FOCAL),
    [bandHeight, screenWidth],
  );

  return (
    <View style={styles.root} pointerEvents="none">
      <View style={[styles.band, { height: bandHeight }]}>
        <Image
          source={LOGIN_MAP}
          style={mapStyle}
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
