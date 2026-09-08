import { Linking, Text, TouchableOpacity, View } from "react-native";

type OfficialDocumentHintProps = {
  title: string;
  description: string;
  linkLabel: string;
  url: string;
};

/** Bloque informativo con enlace oficial — estilo tarjeta, sin subrayado suelto. */
export function OfficialDocumentHint({
  title,
  description,
  linkLabel,
  url,
}: OfficialDocumentHintProps) {
  return (
    <View className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <View className="px-4 pb-2 pt-3">
        <Text className="text-sm font-semibold text-slate-900">{title}</Text>
        <Text className="mt-1 text-xs leading-5 text-slate-500">{description}</Text>
      </View>
      <TouchableOpacity
        onPress={() => void Linking.openURL(url)}
        accessibilityRole="link"
        activeOpacity={0.75}
        className="flex-row items-center justify-between border-t border-slate-100 bg-hercom-soft/40 px-4 py-3"
      >
        <Text className="flex-1 pr-3 text-sm font-semibold text-hercom-dark">
          {linkLabel}
        </Text>
        <View className="h-8 w-8 items-center justify-center rounded-full bg-white">
          <Text className="text-base font-semibold text-hercom">↗</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
