import { Text, TouchableOpacity, View } from "react-native";
import { HERCOM_COLORS, POPPINS, TYPE, UBER_RADIUS } from "../../constants/theme";

type CommunicationRowProps = {
  onMessage?: () => void;
  onCall?: () => void;
  messagePlaceholder?: string;
};

/** Fila mensaje + llamada al chofer. */
export function CommunicationRow({
  onMessage,
  onCall,
  messagePlaceholder = "¿Alguna indicación?",
}: CommunicationRowProps) {
  return (
    <View className="mx-4 mb-3 flex-row items-center gap-2">
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onMessage}
        className="h-12 flex-1 flex-row items-center px-4"
        style={{
          backgroundColor: HERCOM_COLORS.surfaceMuted,
          borderRadius: UBER_RADIUS.card,
        }}
      >
        <Text style={{ marginRight: 8 }}>💬</Text>
        <Text
          style={{
            fontFamily: POPPINS.regular,
            fontSize: TYPE.body,
            color: HERCOM_COLORS.textMuted,
          }}
        >
          {messagePlaceholder}
        </Text>
      </TouchableOpacity>
      {onCall !== undefined && (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onCall}
          className="h-12 w-12 items-center justify-center"
          style={{
            backgroundColor: HERCOM_COLORS.surfaceMuted,
            borderRadius: UBER_RADIUS.card,
          }}
          accessibilityLabel="Llamar al chofer"
        >
          <Text style={{ fontSize: 20 }}>📞</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
