import { Image, View } from "react-native";

type HercomLogoProps = {
  /** Ancho del logo en píxeles */
  width?: number;
};

/**
 * Logo institucional Hercom (incluye texto de marca en la imagen).
 * Archivo: apps/mobile/assets/images/hercom-logo.png
 */
export function HercomLogo({ width = 240 }: HercomLogoProps) {
  const height = width * 1.15;

  return (
    <View className="items-center">
      <Image
        source={require("../../assets/images/hercom-logo.png")}
        style={{ width, height }}
        resizeMode="contain"
        accessibilityLabel="Hercom, choferes para remplazo"
      />
    </View>
  );
}
