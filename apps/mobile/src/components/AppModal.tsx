import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ReactNode } from "react";

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
      <View className="flex-1 justify-end bg-black/40">
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className="max-h-[88%] rounded-t-3xl bg-white px-5 pt-4"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <View className="mb-3 flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-xl font-bold text-slate-900">{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} className="px-2 py-1">
              <Text className="text-base font-semibold text-hercom">Cerrar</Text>
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
