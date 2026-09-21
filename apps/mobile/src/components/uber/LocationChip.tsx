import { Text, TouchableOpacity, View } from "react-native";
import { HERCOM_COLORS, POPPINS, TYPE, UBER_RADIUS } from "../../constants/theme";

type LocationChipProps = {
  label: string;
  address: string;
  onPress?: () => void;
};

/** Chip flotante sobre el mapa — origen / destino. */
export function LocationChip({ label, address, onPress }: LocationChipProps) {
  const body = (
    <View
      className="flex-1 px-4 py-3"
      style={{
        backgroundColor: HERCOM_COLORS.white,
        borderRadius: UBER_RADIUS.pill,
        shadowColor: "#0F172A",
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      }}
    >
      <Text
        style={{
          fontFamily: POPPINS.semibold,
          fontSize: TYPE.caption,
          color: HERCOM_COLORS.textMuted,
        }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: POPPINS.medium,
          fontSize: TYPE.body,
          color: HERCOM_COLORS.text,
          marginTop: 2,
        }}
      >
        {address}
      </Text>
    </View>
  );

  if (onPress === undefined) {
    return body;
  }

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} className="flex-1">
      {body}
    </TouchableOpacity>
  );
}
