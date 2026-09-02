import { useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppMode } from "../contexts/AppModeContext";
import { DrawerIcon, type DrawerIconName } from "./DrawerIcons";
import { UiBadge, UiButton, UiChip } from "./ui";

const DRAWER_WIDTH = Math.min(Dimensions.get("window").width * 0.82, 340);

type MenuItem = {
  key: string;
  label: string;
  icon: DrawerIconName;
};

type SideDrawerProps = {
  visible: boolean;
  onClose: () => void;
  userName: string;
  avatarUrl?: string | null;
  unreadCount?: number;
  activeItem?: string;
  onSelectItem?: (key: string) => void;
};

const CLIENT_PRIMARY: MenuItem[] = [
  { key: "ciudad", label: "Pedir un servicio", icon: "mapPin" },
  { key: "historial", label: "Mis servicios", icon: "clock" },
  { key: "notificaciones", label: "Notificaciones", icon: "bell" },
];

const CLIENT_ACCOUNT: MenuItem[] = [
  { key: "ayuda", label: "Ayuda", icon: "chat" },
  { key: "seguridad", label: "Seguridad", icon: "shield" },
  { key: "configuracion", label: "Mi Información", icon: "gear" },
];

const DRIVER_PRIMARY: MenuItem[] = [
  { key: "servicios", label: "Servicios", icon: "car" },
  { key: "ofertas", label: "Solicitudes abiertas", icon: "clipboard" },
  { key: "saldo", label: "Recargar saldo", icon: "wallet" },
  { key: "ganancias", label: "Ganancias", icon: "trend" },
  { key: "notificaciones", label: "Notificaciones", icon: "bell" },
];

const DRIVER_ACCOUNT: MenuItem[] = [
  { key: "ayuda", label: "Ayuda", icon: "chat" },
  { key: "configuracion", label: "Datos de cobro", icon: "card" },
];

function MenuRow({
  item,
  selected,
  badge,
  onPress,
}: {
  item: MenuItem;
  selected: boolean;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`mx-3 mb-1 flex-row items-center gap-3 rounded-2xl px-3 py-2.5 ${
        selected ? "bg-hercom-soft" : ""
      }`}
    >
      <View
        className={`h-9 w-9 items-center justify-center rounded-xl ${
          selected ? "bg-white" : "bg-slate-50"
        }`}
      >
        <DrawerIcon name={item.icon} selected={selected} />
      </View>
      <Text
        className={`flex-1 text-[15px] ${
          selected ? "font-semibold text-hercom-dark" : "font-medium text-slate-600"
        }`}
      >
        {item.label}
      </Text>
      <UiBadge count={badge ?? 0} />
    </TouchableOpacity>
  );
}

/** Menú lateral izquierdo con iconos de trazo gris y bloque de cuenta al final. */
export function SideDrawer({
  visible,
  onClose,
  userName,
  avatarUrl,
  unreadCount = 0,
  activeItem = "ciudad",
  onSelectItem,
}: SideDrawerProps) {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuthActions();
  const {
    mode,
    setMode,
    canUseDriverMode,
    driverApplicationStatus,
    openDriverRegistration,
  } = useAppMode();
  const slide = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const supportUnread = useQuery(api.support.getMyUnreadCount) ?? 0;

  useEffect(() => {
    if (visible) {
      Animated.timing(slide, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start();
    } else {
      slide.setValue(-DRAWER_WIDTH);
    }
  }, [slide, visible]);

  const primary = mode === "driver" ? DRIVER_PRIMARY : CLIENT_PRIMARY;
  const account = mode === "driver" ? DRIVER_ACCOUNT : CLIENT_ACCOUNT;
  const modeButtonLabel =
    mode === "client" ? "Modo conductor" : "Modo cliente";

  function handleSelect(key: string) {
    onSelectItem?.(key);
    onClose();
  }

  async function handleModeSwitch() {
    onClose();
    if (mode === "client") {
      if (canUseDriverMode) {
        await setMode("driver");
        return;
      }
      if (driverApplicationStatus === "pending") {
        Alert.alert(
          "Solicitud en revisión",
          "Tu registro de chofer está siendo validado por Hercom. Te avisaremos cuando esté habilitado.",
        );
        return;
      }
      if (driverApplicationStatus === "rejected") {
        Alert.alert(
          "Solicitud no aprobada",
          "Tu solicitud anterior no fue aprobada. Puedes enviar una nueva con datos actualizados.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Reintentar", onPress: () => openDriverRegistration() },
          ],
        );
        return;
      }
      openDriverRegistration();
      return;
    }
    await setMode("client");
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 flex-row">
        <Animated.View
          style={{
            width: DRAWER_WIDTH,
            transform: [{ translateX: slide }],
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 12,
          }}
          className="h-full bg-white"
        >
          <View className="flex-1">
            <View className="mb-3 flex-row items-center gap-2 px-4 py-3">
              <View className="flex-1 flex-row items-center gap-3 py-1">
                {avatarUrl !== undefined &&
                avatarUrl !== null &&
                avatarUrl !== "" ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    className="bg-slate-200"
                    style={{ width: 56, height: 56, borderRadius: 28 }}
                  />
                ) : (
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-hercom">
                    <Text className="text-xl font-semibold text-white">
                      {(userName.trim()[0] ?? "H").toUpperCase()}
                    </Text>
                  </View>
                )}
                <View className="min-w-0 flex-1">
                  <Text
                    className="text-base font-semibold text-slate-900"
                    numberOfLines={1}
                  >
                    {userName.trim() !== "" ? userName : "Usuario Hercom"}
                  </Text>
                  <View className="mt-1.5">
                    <UiChip
                      label={mode === "driver" ? "Chofer" : "Pasajero"}
                      selected={false}
                    />
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                accessibilityLabel="Cerrar menú"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
              >
                <DrawerIcon name="close" />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {primary.map((item) => (
                <MenuRow
                  key={item.key}
                  item={item}
                  selected={item.key === activeItem}
                  badge={item.key === "notificaciones" ? unreadCount : undefined}
                  onPress={() => handleSelect(item.key)}
                />
              ))}

              <View className="mx-6 my-3 h-px bg-slate-100" />

              {account.map((item) => (
                <MenuRow
                  key={item.key}
                  item={item}
                  selected={item.key === activeItem}
                  badge={item.key === "ayuda" ? supportUnread : undefined}
                  onPress={() => handleSelect(item.key)}
                />
              ))}

              <TouchableOpacity
                onPress={() => {
                  onClose();
                  void signOut();
                }}
                className="mx-3 mt-1 flex-row items-center gap-3 rounded-2xl px-3 py-2.5"
              >
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
                  <DrawerIcon name="logout" />
                </View>
                <Text className="flex-1 text-[15px] font-medium text-slate-600">
                  Cerrar sesión
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View className="border-t border-slate-100 px-4 pt-4">
              <UiButton
                label={modeButtonLabel}
                onPress={() => void handleModeSwitch()}
              />
            </View>
          </View>
        </Animated.View>

        <Pressable className="flex-1 bg-black/35" onPress={onClose} />
      </View>
    </Modal>
  );
}
