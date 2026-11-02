import { Image, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { HERCOM_COLORS } from "../constants/theme";

/** Pantalla de marca mientras la app recupera la sesión. */
export function BrandSplash() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: HERCOM_COLORS.primary,
      }}
    >
      <StatusBar style="light" />
      <Image
        source={require("../../assets/images/icon.png")}
        accessibilityLabel="Hercom"
        resizeMode="contain"
        style={{ width: 168, height: 168 }}
      />
    </View>
  );
}
