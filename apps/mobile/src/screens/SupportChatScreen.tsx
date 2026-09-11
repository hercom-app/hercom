import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AccountScreenShell } from "../components/AccountScreenShell";
import { TacticalLabel } from "../components/tactical";
import { convexErrorMessage } from "../lib/convexErrorMessage";
import {
  MONO,
  POPPINS,
  TACTICAL_BORDER,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";

type SupportChatScreenProps = {
  onOpenMenu: () => void;
};

type ChatMessage = {
  _id: string;
  body: string;
  createdAt: number;
  authorRole: "user" | "staff";
  isMine: boolean;
};

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

/** Chat de operaciones: el mensaje llega al panel interno de Hercom. */
export function SupportChatScreen({ onOpenMenu }: SupportChatScreenProps) {
  const insets = useSafeAreaInsets();
  const messages = useQuery(api.support.listMyMessages);
  const sendMine = useMutation(api.support.sendMine);
  const markMineRead = useMutation(api.support.markMineRead);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    void markMineRead();
  }, [markMineRead, messages?.length]);

  async function handleSend() {
    const body = draft.trim();
    if (body === "" || sending) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      await sendMine({ body });
      setDraft("");
    } catch (sendError) {
      setError(convexErrorMessage(sendError));
    } finally {
      setSending(false);
    }
  }

  const rows = (messages ?? []) as ChatMessage[];

  return (
    <AccountScreenShell
      variant="tactical"
      title="Soporte"
      onOpenMenu={onOpenMenu}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {messages === undefined ? (
          <View
            className="flex-1 items-center justify-center"
            style={{ backgroundColor: TACTICAL_COLORS.base }}
          >
            <ActivityIndicator color={TACTICAL_COLORS.accent} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            className="flex-1"
            style={{ backgroundColor: TACTICAL_COLORS.base }}
            data={rows}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 12,
              flexGrow: 1,
            }}
            onContentSizeChange={() => {
              if (rows.length > 0) {
                listRef.current?.scrollToEnd({ animated: true });
              }
            }}
            ListEmptyComponent={<View className="flex-1" />}
            renderItem={({ item }) => {
              const mine = item.isMine;
              return (
                <View
                  className={`mb-2 max-w-[82%] px-3.5 py-2.5 ${
                    mine ? "self-end" : "self-start"
                  }`}
                  style={{
                    borderRadius: TACTICAL_RADIUS.sharp,
                    borderWidth: 1,
                    borderColor: mine
                      ? TACTICAL_COLORS.accent
                      : TACTICAL_BORDER,
                    backgroundColor: mine
                      ? "rgba(161, 196, 253, 0.16)"
                      : TACTICAL_COLORS.surface,
                  }}
                >
                  {!mine && (
                    <TacticalLabel size={9} className="mb-0.5">
                      Hercom
                    </TacticalLabel>
                  )}
                  <Text
                    style={{
                      fontFamily: POPPINS.regular,
                      fontSize: 14,
                      lineHeight: 20,
                      color: TACTICAL_COLORS.text,
                    }}
                  >
                    {item.body}
                  </Text>
                  <Text
                    className="mt-1"
                    style={{
                      fontFamily: MONO.regular,
                      fontSize: 10,
                      letterSpacing: 0.8,
                      color: TACTICAL_COLORS.steel,
                    }}
                  >
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              );
            }}
          />
        )}

        {error !== null && (
          <Text
            className="px-4 pb-1 text-xs"
            style={{ fontFamily: MONO.medium, color: TACTICAL_COLORS.danger }}
          >
            {error}
          </Text>
        )}

        <View
          className="flex-row items-end gap-2 px-3 pt-2"
          style={{
            paddingBottom: Math.max(insets.bottom, 10),
            borderTopWidth: 1,
            borderTopColor: TACTICAL_BORDER,
            backgroundColor: TACTICAL_COLORS.baseElevated,
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Escribe tu consulta…"
            placeholderTextColor="rgba(91, 132, 177, 0.7)"
            multiline
            maxLength={1500}
            className="max-h-28 flex-1 px-3.5 py-2.5"
            style={{
              backgroundColor: TACTICAL_COLORS.surfaceSunken,
              borderRadius: TACTICAL_RADIUS.sharp,
              borderWidth: 1,
              borderColor: TACTICAL_BORDER,
              fontFamily: POPPINS.regular,
              fontSize: 15,
              color: TACTICAL_COLORS.textStrong,
            }}
          />
          <TouchableOpacity
            onPress={() => void handleSend()}
            disabled={sending || draft.trim() === ""}
            className="mb-0.5 h-11 items-center justify-center px-4"
            style={{
              backgroundColor: TACTICAL_COLORS.accent,
              borderRadius: TACTICAL_RADIUS.sharp,
              opacity: sending || draft.trim() === "" ? 0.4 : 1,
            }}
          >
            {sending ? (
              <ActivityIndicator color={TACTICAL_COLORS.base} />
            ) : (
              <Text
                style={{
                  fontFamily: MONO.bold,
                  fontSize: 11,
                  letterSpacing: 1.6,
                  color: TACTICAL_COLORS.base,
                }}
              >
                ENVIAR
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </AccountScreenShell>
  );
}
