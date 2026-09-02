import { Linking, Text, TouchableOpacity, View } from "react-native";

type OfficialDocumentHintProps = {
  title: string;
  description: string;
  linkLabel: string;
  url: string;
};

export function OfficialDocumentHint({
  title,
  description,
  linkLabel,
  url,
}: OfficialDocumentHintProps) {
  return (
    <View className="mb-2">
      <Text className="mb-1 text-sm font-semibold text-slate-700">{title}</Text>
      <Text className="mb-2 text-xs leading-5 text-slate-500">{description}</Text>
      <TouchableOpacity
        onPress={() => void Linking.openURL(url)}
        accessibilityRole="link"
        className="mb-2 self-start"
      >
        <Text className="text-sm font-semibold text-hercom underline">
          {linkLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
