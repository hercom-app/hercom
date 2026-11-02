import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc, Id } from "@proyecto/backend/dataModel";
import { SupportChatScreen } from "../../screens/SupportChatScreen";
import { TripChatSheet } from "../TripChatSheet";
import { UberScreenHeader } from "../uber/UberScreenHeader";
import { TacticalEmpty } from "../tactical";
import { SegmentedTabs } from "./SegmentedTabs";
import { useAppTheme } from "../../contexts/ThemeContext";
import { HERCOM_COLORS, POPPINS } from "../../constants/theme";
import { toPeopleAddress } from "../../lib/googleGeocoding";

export type ChatsSection = "viajes" | "soporte" | "notificaciones";

type DriverChatsTabProps = {
  section: ChatsSection;
  onSectionChange: (section: ChatsSection) => void;
  notifications: Doc<"notifications">[] | undefined;
  unreadNotifications: number;
  services: Doc<"services">[] | undefined;
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
  services,
}: DriverChatsTabProps) {
  const { colors } = useAppTheme();
  const supportUnread = useQuery(api.support.getMyUnreadCount) ?? 0;
  const markAllNotificationsAsRead = useMutation(api.notifications.markAllAsRead);
  const [openServiceId, setOpenServiceId] = useState<Id<"services"> | null>(null);
  const list = notifications ?? [];
  const tripChats = (services ?? []).filter((service) => service.driverId !== undefined);

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <UberScreenHeader title="Chats" />
      <SegmentedTabs
        options={[
          { key: "viajes", label: "Viajes" },
          { key: "soporte", label: "Soporte", badge: supportUnread },
          { key: "notificaciones", label: "Avisos", badge: unreadNotifications },
        ]}
        value={section}
        onChange={onSectionChange}
      />
      {openServiceId !== null && (
        <TripChatSheet
          visible
          serviceId={openServiceId}
          onClose={() => setOpenServiceId(null)}
        />
      )}
      {section === "viajes" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        >
          {services === undefined ? null : tripChats.length === 0 ? (
            <TacticalEmpty title="Sin conversaciones de viajes" />
          ) : (
            tripChats.map((service) => (
              <TouchableOpacity
                key={service._id}
                onPress={() => setOpenServiceId(service._id)}
                style={{
                  marginBottom: 10,
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: colors.surfaceSunken,
                }}
              >
                <Text style={{ fontFamily: POPPINS.semibold, fontSize: 15, color: colors.textStrong }}>
                  {toPeopleAddress(service.origin.address)}
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontFamily: POPPINS.regular,
                    fontSize: 14,
                    color: colors.text,
                  }}
                >
                  {`→ ${toPeopleAddress(service.destination.address)}`}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : section === "soporte" ? (
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
