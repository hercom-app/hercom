import { Modal, Text, TouchableOpacity, View, Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";

export type PreviewFile = {
  uri: string;
  name: string;
  kind: "image" | "pdf";
};

type DocumentPreviewModalProps = {
  file: PreviewFile | null;
  onClose: () => void;
};

/** Vista previa local: imagen en modal; PDF abre el visor del sistema/navegador. */
export function DocumentPreviewModal({
  file,
  onClose,
}: DocumentPreviewModalProps) {
  const insets = useSafeAreaInsets();

  async function openPdfExternally() {
    if (file === null) {
      return;
    }
    await WebBrowser.openBrowserAsync(file.uri);
  }

  return (
    <Modal
      visible={file !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16), paddingTop: insets.top + 12 },
          ]}
        >
          <Text className="mb-1 text-center text-base font-bold text-white">
            {file?.name ?? "Vista previa"}
          </Text>
          {file?.kind === "image" ? (
            <Image
              source={{ uri: file.uri }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="mb-4 text-center text-sm leading-6 text-slate-200">
                Vista previa del PDF. Ábrelo en el visor del dispositivo para
                revisarlo completo.
              </Text>
              <TouchableOpacity
                onPress={() => void openPdfExternally()}
                className="rounded-2xl bg-hercom px-5 py-3"
              >
                <Text className="font-bold text-white">Abrir PDF</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            onPress={onClose}
            className="mt-4 items-center rounded-2xl bg-white/15 py-3"
          >
            <Text className="font-semibold text-white">Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
  },
  sheet: {
    flex: 1,
    paddingHorizontal: 16,
  },
  image: {
    flex: 1,
    width: "100%",
    marginVertical: 12,
  },
});
