import { Text, View } from "react-native";
import { HERCOM_COLORS, POPPINS, TYPE } from "../../constants/theme";

type TripEtaHeaderProps = {
  label: string;
  highlight: string;
};

/** “Encuentro en **6 min**” — centrado sobre el sheet. */
export function TripEtaHeader({ label, highlight }: TripEtaHeaderProps) {
  return (
    <View className="items-center px-4 pb-3 pt-1">
      <Text
        style={{
          fontFamily: label !== "" ? POPPINS.regular : POPPINS.bold,
          fontSize: TYPE.bodyLg,
          color: HERCOM_COLORS.text,
        }}
      >
        {label !== "" ? (
          <>
            {label}{" "}
            <Text style={{ fontFamily: POPPINS.bold }}>{highlight}</Text>
          </>
        ) : (
          highlight
        )}
      </Text>
    </View>
  );
}
