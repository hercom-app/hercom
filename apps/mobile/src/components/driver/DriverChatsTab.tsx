import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc } from "@proyecto/backend/dataModel";
import { SupportChatScreen } from "../../screens/SupportChatScreen";
import { UberScreenHeader } from "../uber/UberScreenHeader";
import { TacticalEmpty } from "../tactical";
import { SegmentedTabs } from "./SegmentedTabs";
import { useAppTheme } from "../../contexts/ThemeContext";
import { HERCOM_COLORS, POPPINS } from "../../constants/theme";

export type ChatsSection = "soporte" | "notificaciones";

type DriverChatsTabProps = {
  section: ChatsSection;
  onSectionChange: (section: ChatsSection) => void;
  notifications: Doc<"notifications">[] | undefined;
  unreadNotifications: number;
};

function formatWhen(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

/** Pestaña Chats: soporte Hercom y notificaciones. */
export function DriverChatsTab({
  section,
  onSectionChange,
  notifications,
  unreadNotifications,
}: DriverChatsTabProps) {
  const { colors } = useAppTheme();
  const supportUnread = useQuery(api.support.getMyUnreadCount) ?? 0;
  const markAllNotificationsAsRead = useMutation(api.notifications.markAllAsRead);
  const list = notifications ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <UberScreenHeader title="Chats" />
      <SegmentedTabs
        options={[
          { key: "soporte", label: "Soporte", badge: supportUnread },
          { key: "notificaciones", label: "Avisos", badge: unreadNotifications },
        ]}
        value={section}
        onChange={onSectionChange}
      />
      {section === "soporte" ? (
        <SupportChatScreen embedded />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        >
          {unreadNotifications > 0 && (
            <TouchableOpacity
              onPress={() => void markAllNotificationsAsRead()}
              style={{ alignSelf: "flex-end", marginBottom: 8, paddingVertical: 4 }}
            >
              <Text style={{ fontFamily: POPPINS.semibold, fontSize: 15, color: colors.accent }}>
                Marcar todo leído
              </Text>
            </TouchableOpacity>
          )}
          {list.length === 0 ? (
            <TacticalEmpty title="Sin avisos" />
          ) : (
            list.map((notification) => {
              const unread = notification.readAt === undefined;
              return (
                <View
                  key={notification._id}
                  style={{
                    marginBottom: 10,
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: unread ? colors.dataBandBg : colors.surfaceSunken,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {unread && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: HERCOM_COLORS.primary,
                        }}
                      />
                    )}
                    <Text
                      style={{
                        flex: 1,
                        fontFamily: POPPINS.semibold,
                        fontSize: 16,
                        color: colors.textStrong,
                      }}
                    >
                      {notification.title}
                    </Text>
                  </View>
                  <Text
                    style={{
                      marginTop: 4,
                      fontFamily: POPPINS.regular,
                      fontSize: 15,
                      lineHeight: 21,
                      color: colors.text,
                    }}
                  >
                    {notification.message}
                  </Text>
                  <Text
                    style={{
                      marginTop: 6,
                      fontFamily: POPPINS.regular,
                      fontSize: 13,
                      color: colors.steel,
                    }}
                  >
                    {formatWhen(notification.createdAt)}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
