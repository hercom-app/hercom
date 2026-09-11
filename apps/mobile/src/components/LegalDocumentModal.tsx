import { Modal, ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TacticalLabel, TacticalText, TacticalTitle } from "./tactical";
import { TACTICAL_BORDER, TACTICAL_COLORS } from "../constants/theme";

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
        className="flex-1"
        style={{
          backgroundColor: TACTICAL_COLORS.base,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 8,
        }}
      >
        <View
          className="mb-2 flex-row items-center justify-between px-5 pb-3"
          style={{
            borderBottomWidth: 1,
            borderBottomColor: TACTICAL_BORDER,
            backgroundColor: TACTICAL_COLORS.baseElevated,
          }}
        >
          <TacticalTitle size={17} className="flex-1 pr-3">
            {title}
          </TacticalTitle>
          <TouchableOpacity onPress={onClose} hitSlop={12} className="px-2 py-1">
            <TacticalLabel tone="accent" size={10}>
              Cerrar
            </TacticalLabel>
          </TouchableOpacity>
        </View>
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <TacticalText size={13} tone="text" className="mt-2">
            {body}
          </TacticalText>
        </ScrollView>
      </View>
    </Modal>
  );
}
