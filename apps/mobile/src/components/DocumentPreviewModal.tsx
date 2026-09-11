import { Modal, View, Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import {
  HudCorners,
  TacticalButton,
  TacticalLabel,
  TacticalText,
  TacticalValue,
} from "./tactical";
import { TACTICAL_BORDER, TACTICAL_RADIUS } from "../constants/theme";

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
          <View className="items-center">
            <TacticalLabel size={9}>Vista previa de documento</TacticalLabel>
            <TacticalValue size={12} tone="accent" className="mt-1 text-center">
              {file?.name ?? "Sin archivo"}
            </TacticalValue>
          </View>

          {file?.kind === "image" ? (
            <View style={styles.imageFrame}>
              <Image
                source={{ uri: file.uri }}
                style={styles.image}
                resizeMode="contain"
              />
              <HudCorners size={12} opacity={0.7} />
            </View>
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <TacticalText size={12} tone="text" className="mb-5 text-center">
                Vista previa del PDF. Ábrelo en el visor del dispositivo para
                revisarlo completo.
              </TacticalText>
              <TacticalButton
                label="Abrir PDF"
                size="md"
                onPress={() => void openPdfExternally()}
                className="px-6"
              />
            </View>
          )}

          <TacticalButton
            label="Cerrar"
            variant="secondary"
            size="md"
            onPress={onClose}
            className="mt-4"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 22, 34, 0.94)",
  },
  sheet: {
    flex: 1,
    paddingHorizontal: 16,
  },
  imageFrame: {
    flex: 1,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: TACTICAL_BORDER,
    borderRadius: TACTICAL_RADIUS.sharp,
  },
  image: {
    flex: 1,
    width: "100%",
  },
});
