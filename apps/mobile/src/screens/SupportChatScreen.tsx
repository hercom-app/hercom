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
import { convexErrorMessage } from "../lib/convexErrorMessage";

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
        title="Mensajería a Soporte Técnico"
        subtitle="Escribe tu consulta, en breve un asesor se contactará contigo"
        onOpenMenu={onOpenMenu}
      >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {messages === undefined ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#64748B" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            className="flex-1"
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
                  className={`mb-2 max-w-[82%] rounded-2xl px-3.5 py-2.5 ${
                    mine
                      ? "self-end bg-hercom"
                      : "self-start border border-slate-100 bg-white"
                  }`}
                >
                  {!mine && (
                    <Text className="mb-0.5 text-[11px] font-semibold text-slate-400">
                      Hercom
                    </Text>
                  )}
                  <Text
                    className={`text-[15px] leading-5 ${
                      mine ? "text-white" : "text-slate-800"
                    }`}
                  >
                    {item.body}
                  </Text>
                  <Text
                    className={`mt-1 text-[10px] ${
                      mine ? "text-white/70" : "text-slate-400"
                    }`}
                  >
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              );
            }}
          />
        )}

        {error !== null && (
          <Text className="px-4 pb-1 text-xs text-red-600">{error}</Text>
        )}

        <View
          className="flex-row items-end gap-2 border-t border-slate-200 bg-white px-3 pt-2"
          style={{ paddingBottom: Math.max(insets.bottom, 10) }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Escribe tu consulta…"
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={1500}
            className="max-h-28 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[15px] text-slate-900"
          />
          <TouchableOpacity
            onPress={() => void handleSend()}
            disabled={sending || draft.trim() === ""}
            className="mb-0.5 h-11 items-center justify-center rounded-2xl bg-hercom px-4 disabled:opacity-40"
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-sm font-bold text-white">Enviar</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </AccountScreenShell>
  );
}
