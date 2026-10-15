import { Text, View } from "react-native";
import { HERCOM_COLORS } from "../../constants/theme";
import { WALLET_FONT } from "./walletUiTheme";

const IZIPAY_RED = "#E4002B";

/** Marca simplificada Izipay (rojo + «i») para fila de método de pago. */
export function IzipayMark({ size = 44 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        backgroundColor: IZIPAY_RED,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: WALLET_FONT.bold,
          fontSize: size * 0.55,
          color: HERCOM_COLORS.white,
          marginTop: -2,
        }}
      >
        i
      </Text>
    </View>
  );
}
