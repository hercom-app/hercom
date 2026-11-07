import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import { convexErrorMessage } from "../lib/convexErrorMessage";
import { HERCOM_COLORS, POPPINS } from "../constants/theme";
import { TacticalLabel } from "./tactical";

type TripChatSheetProps = {
  visible: boolean;
  serviceId: Id<"services">;
  onClose: () => void;
};

/** Conversación del viaje entre cliente y chofer. */
export function TripChatSheet({ visible, serviceId, onClose }: TripChatSheetProps) {
  const insets = useSafeAreaInsets();
  const messages = useQuery(
    api.serviceMessages.listForService,
    visible ? { serviceId } : "skip",
  );
  const send = useMutation(api.serviceMessages.send);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return;
    }
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [visible, messages, keyboardHeight]);

  async function handleSend() {
    const text = body.trim();
    if (text === "" || sending) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      await send({ serviceId, body: text });
      setBody("");
    } catch (sendError) {
      setError(convexErrorMessage(sendError, "No se pudo enviar el mensaje."));
    } finally {
      setSending(false);
    }
  }

  const topInset = Math.max(insets.top, Platform.OS === "android" ? 36 : 12);
  const bottomInset =
    keyboardHeight > 0 ? keyboardHeight + 8 : Math.max(insets.bottom, 12);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: topInset }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: HERCOM_COLORS.border,
          }}
        >
          <Text style={{ fontFamily: POPPINS.bold, fontSize: 18, color: HERCOM_COLORS.text }}>
            Chat del viaje
          </Text>
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar chat"
            hitSlop={12}
            className="px-2 py-1"
          >
            <TacticalLabel tone="accent" size={10}>
              Cerrar
            </TacticalLabel>
          </TouchableOpacity>
        </View>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages === undefined ? (
            <ActivityIndicator color={HERCOM_COLORS.primary} />
          ) : messages.length === 0 ? (
            <Text style={{ fontFamily: POPPINS.regular, fontSize: 14, color: HERCOM_COLORS.textMuted }}>
              Aún no hay mensajes. Escribe para coordinar el viaje.
            </Text>
          ) : (
            messages.map((message) => (
              <View
                key={message._id}
                style={{
                  alignSelf: message.authorRole === "client" ? "flex-end" : "flex-start",
                  maxWidth: "84%",
                  backgroundColor:
                    message.authorRole === "client" ? "#E8F2FF" : "#F3F4F6",
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ fontFamily: POPPINS.semibold, fontSize: 11, color: HERCOM_COLORS.textMuted }}>
                  {message.authorRole === "client" ? "Cliente" : "Chofer"}
                </Text>
                <Text style={{ fontFamily: POPPINS.regular, fontSize: 15, color: HERCOM_COLORS.text }}>
                  {message.body}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
        {error !== null && (
          <Text
            style={{
              paddingHorizontal: 16,
              paddingTop: 6,
              fontFamily: POPPINS.medium,
              fontSize: 13,
              color: HERCOM_COLORS.danger,
            }}
          >
            {error}
          </Text>
        )}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 8,
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: bottomInset,
            borderTopWidth: 1,
            borderTopColor: HERCOM_COLORS.border,
            backgroundColor: "#FFFFFF",
          }}
        >
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Escribe un mensaje"
            placeholderTextColor={HERCOM_COLORS.textMuted}
            multiline
            style={{
              flex: 1,
              maxHeight: 110,
              borderWidth: 1,
              borderColor: HERCOM_COLORS.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontFamily: POPPINS.regular,
              fontSize: 15,
              color: HERCOM_COLORS.text,
            }}
          />
          <TouchableOpacity
            onPress={() => void handleSend()}
            disabled={sending}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
            style={{
              height: 44,
              justifyContent: "center",
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: HERCOM_COLORS.primary,
              opacity: sending ? 0.6 : 1,
            }}
          >
            <Text style={{ fontFamily: POPPINS.semibold, fontSize: 15, color: "#FFFFFF" }}>
              Enviar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
