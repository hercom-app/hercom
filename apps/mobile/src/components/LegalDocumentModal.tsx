import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type LegalDocumentModalProps = {
  visible: boolean;
  title: string;
  body: string;
  onClose: () => void;
};

/** Modal de lectura para Términos de Uso o Política de Privacidad. */
export function LegalDocumentModal({
  visible,
  title,
  body,
  onClose,
}: LegalDocumentModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 bg-white"
        style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }}
      >
        <View className="mb-2 flex-row items-center justify-between border-b border-slate-100 px-5 pb-3">
          <Text className="flex-1 text-lg font-bold text-slate-900">{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12} className="px-2 py-1">
            <Text className="text-sm font-semibold text-hercom">Cerrar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <Text className="mt-2 text-[15px] leading-6 text-slate-700">{body}</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}
