import { Linking, Text, TouchableOpacity, View } from "react-native";
import { TacticalLabel } from "./tactical";
import {
  MONO,
  TACTICAL_BORDER,
  TACTICAL_BORDER_SOFT,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";

type OfficialDocumentHintProps = {
  title: string;
  linkLabel: string;
  url: string;
};

/** Enlace al portal oficial. Hercom no tramita el documento. */
export function OfficialDocumentHint({
  title,
  linkLabel,
  url,
}: OfficialDocumentHintProps) {
  return (
    <View
      className="mb-3 overflow-hidden"
      style={{
        backgroundColor: TACTICAL_COLORS.surfaceSunken,
        borderRadius: TACTICAL_RADIUS.panel,
        borderWidth: 1,
        borderColor: TACTICAL_BORDER,
      }}
    >
      <View className="px-4 pb-2.5 pt-3">
        <TacticalLabel size={10} tone="text">
          {title}
        </TacticalLabel>
      </View>
      <TouchableOpacity
        onPress={() => void Linking.openURL(url)}
        accessibilityRole="link"
        activeOpacity={0.75}
        className="flex-row items-center justify-between px-4 py-3"
        style={{
          borderTopWidth: 1,
          borderTopColor: TACTICAL_BORDER_SOFT,
          backgroundColor: "rgba(161, 196, 253, 0.08)",
        }}
      >
        <TacticalLabel size={10} tone="accent" className="flex-1 pr-3">
          {linkLabel}
        </TacticalLabel>
        <View
          className="h-7 w-7 items-center justify-center"
          style={{
            borderRadius: TACTICAL_RADIUS.sharp,
            borderWidth: 1,
            borderColor: TACTICAL_COLORS.accent,
          }}
        >
          <Text
            style={{
              fontFamily: MONO.bold,
              fontSize: 13,
              color: TACTICAL_COLORS.accent,
            }}
          >
            ↗
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
