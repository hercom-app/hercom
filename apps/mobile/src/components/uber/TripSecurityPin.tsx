import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useAppTheme } from "../../contexts/ThemeContext";
import { HERCOM_COLORS, POPPINS, UBER_RADIUS } from "../../constants/theme";

type TripSecurityPinProps = {
  pin: string;
  title?: string;
  /**
   * Margen lateral. En una tarjeta que ya tiene padding (chofer, historial)
   * debe ir en false para no empujar el bloque fuera de la pantalla.
   */
  inset?: boolean;
  style?: StyleProp<ViewStyle>;
};

const BOX = 46;
const GAP = 8;

/** Código de 4 dígitos, centrado y contenido en el ancho del padre. */
export function TripSecurityPin({
  pin,
  title = "Código del viaje",
  inset = true,
  style,
}: TripSecurityPinProps) {
  const { scheme, colors } = useAppTheme();
  const digits = pin.replace(/\D/g, "").split("").slice(0, 4);
  const band =
    scheme === "dark" ? colors.surfaceSunken : HERCOM_COLORS.primarySoft;
  const boxBg = scheme === "dark" ? colors.surface : HERCOM_COLORS.white;

  return (
    <View
      style={[
        {
          alignSelf: "stretch",
          marginHorizontal: inset ? 16 : 0,
          marginBottom: 12,
          paddingHorizontal: 12,
          paddingVertical: 12,
          backgroundColor: band,
          borderRadius: UBER_RADIUS.card,
          alignItems: "center",
        },
        style,
      ]}
    >
      <Text
        numberOfLines={2}
        style={{
          fontFamily: POPPINS.medium,
          fontSize: 14,
          lineHeight: 18,
          color: colors.textStrong,
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          alignSelf: "center",
          gap: GAP,
          width: "100%",
          maxWidth: digits.length * BOX + Math.max(digits.length - 1, 0) * GAP,
        }}
      >
        {digits.map((digit, index) => (
          <View
            key={`${digit}-${index}`}
            style={{
              flex: 1,
              height: BOX,
              maxWidth: BOX,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: boxBg,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                fontFamily: POPPINS.bold,
                fontSize: 22,
                lineHeight: 26,
                color: colors.accent,
                textAlign: "center",
                textAlignVertical: "center",
                fontVariant: ["tabular-nums"],
                includeFontPadding: false,
              }}
            >
              {digit}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
