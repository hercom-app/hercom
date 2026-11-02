import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import { convexErrorMessage } from "../lib/convexErrorMessage";
import { HERCOM_COLORS, POPPINS } from "../constants/theme";

type TripChatSheetProps = {
  visible: boolean;
  serviceId: Id<"services">;
  onClose: () => void;
};

/** Conversación del viaje entre cliente y chofer. */
export function TripChatSheet({ visible, serviceId, onClose }: TripChatSheetProps) {
  const messages = useQuery(
    api.serviceMessages.listForService,
    visible ? { serviceId } : "skip",
  );
  const send = useMutation(api.serviceMessages.send);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#FFFFFF" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: HERCOM_COLORS.border,
          }}
        >
          <Text style={{ fontFamily: POPPINS.bold, fontSize: 18, color: HERCOM_COLORS.text }}>
            Chat del viaje
          </Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Cerrar chat">
            <Text style={{ fontFamily: POPPINS.semibold, fontSize: 15, color: HERCOM_COLORS.primary }}>
              Cerrar
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          keyboardShouldPersistTaps="handled"
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
            gap: 8,
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 20,
          }}
        >
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Escribe un mensaje"
            placeholderTextColor={HERCOM_COLORS.textMuted}
            style={{
              flex: 1,
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
            style={{
              justifyContent: "center",
              paddingHorizontal: 14,
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
      </KeyboardAvoidingView>
    </Modal>
  );
}
