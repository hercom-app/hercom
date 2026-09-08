import { Dimensions, Image, View } from "react-native";

const CHOFER_ILLUSTRATION = require("../../assets/images/chofer.png");
const ILLUSTRATION_WIDTH = Dimensions.get("window").width - 72;

/** Ilustración chofer — dentro de UiCard (fondo blanco). */
export function ChauffeurIllustration() {
  return (
    <View className="items-center bg-white py-1" pointerEvents="none">
      <Image
        source={CHOFER_ILLUSTRATION}
        accessibilityLabel="Ilustración de chofer profesional"
        style={{ width: ILLUSTRATION_WIDTH, height: 220 }}
        resizeMode="contain"
      />
    </View>
  );
}
