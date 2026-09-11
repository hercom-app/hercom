import { Modal, Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ReactNode } from "react";
import { TacticalLabel, TacticalTitle } from "./tactical";
import { TACTICAL_COLORS } from "../constants/theme";

type AppModalProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

/** Modal inferior amplio, pensado para lectura fácil (clientes 50+). */
export function AppModal({
  visible,
  title,
  onClose,
  children,
  footer,
}: AppModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(17, 22, 34, 0.72)" }}
      >
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className="max-h-[88%] px-5 pt-4"
          style={{
            paddingBottom: insets.bottom + 16,
            backgroundColor: TACTICAL_COLORS.base,
            borderTopWidth: 1,
            borderTopColor: TACTICAL_COLORS.accent,
          }}
        >
          <View className="mb-3 flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <TacticalTitle size={18}>{title}</TacticalTitle>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12} className="px-2 py-1">
              <TacticalLabel tone="accent" size={10}>
                Cerrar
              </TacticalLabel>
            </TouchableOpacity>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {children}
          </ScrollView>
          {footer}
        </View>
      </View>
    </Modal>
  );
}
