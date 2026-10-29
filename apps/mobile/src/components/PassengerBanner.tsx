import { Linking, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../contexts/ThemeContext";
import { POPPINS } from "../constants/theme";

type PassengerBannerProps = {
  forSelf?: boolean;
  passengerName?: string;
  passengerPhone?: string;
};

/** Quién usa el servicio: el titular o la persona indicada al pedirlo. */
export function PassengerBanner({
  forSelf,
  passengerName,
  passengerPhone,
}: PassengerBannerProps) {
  const { colors } = useAppTheme();
  const name = passengerName?.trim() ?? "";
  const phone = passengerPhone?.trim() ?? "";
  if (name === "" && phone === "") {
    return null;
  }

  const forOther = forSelf === false;

  return (
    <View
      style={{
        marginTop: 12,
        marginBottom: 4,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: colors.surfaceSunken,
        gap: 2,
      }}
    >
      <Text style={{ fontFamily: POPPINS.medium, fontSize: 13, color: colors.steel }}>
        {forOther ? "El servicio es para otra persona" : "El servicio es para el cliente"}
      </Text>
      {name !== "" && (
        <Text style={{ fontFamily: POPPINS.bold, fontSize: 17, color: colors.textStrong }}>
          {name}
        </Text>
      )}
      {phone !== "" && (
        <TouchableOpacity
          onPress={() => void Linking.openURL(`tel:${phone}`)}
          accessibilityRole="button"
          accessibilityLabel={`Llamar a ${phone}`}
        >
          <Text style={{ fontFamily: POPPINS.medium, fontSize: 15, color: colors.accent }}>
            {phone}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
