import { Text, View } from "react-native";
import { HERCOM_COLORS, POPPINS, TYPE, UBER_RADIUS } from "../../constants/theme";

type TripSecurityPinProps = {
  pin: string;
};

/** Bloque PIN del viaje — fondo azul suave, dígitos grandes. */
export function TripSecurityPin({ pin }: TripSecurityPinProps) {
  const digits = pin.replace(/\D/g, "").split("").slice(0, 4);

  return (
    <View
      className="mx-4 mb-3 flex-row items-center justify-between px-4 py-3"
      style={{
        backgroundColor: HERCOM_COLORS.primarySoft,
        borderRadius: UBER_RADIUS.card,
      }}
    >
      <Text
        style={{
          fontFamily: POPPINS.medium,
          fontSize: TYPE.body,
          color: HERCOM_COLORS.text,
        }}
      >
        PIN de este viaje
      </Text>
      <View className="flex-row gap-2">
        {digits.map((digit, index) => (
          <View
            key={`${digit}-${index}`}
            className="h-12 w-10 items-center justify-center"
            style={{
              backgroundColor: HERCOM_COLORS.white,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                fontFamily: POPPINS.bold,
                fontSize: TYPE.title,
                color: HERCOM_COLORS.primary,
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
