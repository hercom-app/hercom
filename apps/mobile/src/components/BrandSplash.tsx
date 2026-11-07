import { Image, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { HERCOM_COLORS } from "../constants/theme";

/** Misma pieza que expo-splash-screen para que no haya salto de color al cargar. */
export function BrandSplash() {
  return (
    <View style={{ flex: 1, backgroundColor: HERCOM_COLORS.primary }}>
      <StatusBar style="light" />
      <Image
        source={require("../../assets/images/splash-solid.png")}
        accessibilityLabel="Hercom"
        resizeMode="cover"
        style={{ flex: 1, width: "100%", height: "100%" }}
      />
    </View>
  );
}
