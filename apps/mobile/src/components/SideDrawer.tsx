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
import { ThemeToggle } from "./ThemeToggle";
import { UiBadge, UiButton, UiChip } from "./ui";
import { GridBackdrop, TacticalLabel } from "./tactical";
import { useAppTheme } from "../contexts/ThemeContext";
import {
  MONO,
  POPPINS,
  TACTICAL_RADIUS,
} from "../constants/theme";

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
  const { colors, borderSoft } = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="mx-3 mb-1 flex-row items-center gap-3 px-3 py-2.5"
      style={{
        borderRadius: TACTICAL_RADIUS.sharp,
        backgroundColor: selected ? `${colors.accent}1F` : "transparent",
        borderLeftWidth: 2,
        borderLeftColor: selected ? colors.accent : "transparent",
      }}
    >
      <View
        className="h-9 w-9 items-center justify-center"
        style={{
          borderRadius: TACTICAL_RADIUS.sharp,
          borderWidth: 1,
          borderColor: selected ? colors.accent : borderSoft,
          backgroundColor: selected
            ? `${colors.accent}1A`
            : colors.surfaceSunken,
        }}
      >
        <DrawerIcon name={item.icon} selected={selected} />
      </View>
      <Text
        className="flex-1"
        style={{
          fontFamily: selected ? MONO.bold : MONO.regular,
          fontSize: 12,
          letterSpacing: 1.2,
          color: selected ? colors.accent : colors.text,
        }}
      >
        {item.label.toUpperCase()}
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
  const { scheme, colors, border, borderSoft } = useAppTheme();
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
          className="h-full"
          style={{
            width: DRAWER_WIDTH,
            transform: [{ translateX: slide }],
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 12,
            backgroundColor: colors.base,
            borderRightWidth: 1,
            borderRightColor: border,
          }}
        >
          {scheme === "dark" ? <GridBackdrop /> : null}
          <View className="flex-1">
            <View
              className="mb-3 flex-row items-center gap-2 px-4 py-3"
              style={{
                backgroundColor: colors.baseElevated,
                borderBottomWidth: 1,
                borderBottomColor: border,
              }}
            >
              <View className="flex-1 flex-row items-center gap-3 py-1">
                {avatarUrl !== undefined &&
                avatarUrl !== null &&
                avatarUrl !== "" ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: TACTICAL_RADIUS.sharp,
                      borderWidth: 1,
                      borderColor: colors.accent,
                      backgroundColor: colors.surface,
                    }}
                  />
                ) : (
                  <View
                    className="h-[52px] w-[52px] items-center justify-center"
                    style={{
                      borderRadius: TACTICAL_RADIUS.sharp,
                      borderWidth: 1,
                      borderColor: colors.accent,
                      backgroundColor: `${colors.accent}1F`,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: MONO.bold,
                        fontSize: 20,
                        color: colors.accent,
                      }}
                    >
                      {(userName.trim()[0] ?? "H").toUpperCase()}
                    </Text>
                  </View>
                )}
                <View className="min-w-0 flex-1">
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: POPPINS.semibold,
                      fontSize: 15,
                      color: colors.textStrong,
                    }}
                  >
                    {userName.trim() !== "" ? userName : "Usuario Hercom"}
                  </Text>
                  <View className="mt-1.5 flex-row">
                    <UiChip
                      label={mode === "driver" ? "Chofer" : "Pasajero"}
                      selected
                    />
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                accessibilityLabel="Cerrar menú"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                className="h-10 w-10 items-center justify-center"
                style={{
                  borderRadius: TACTICAL_RADIUS.sharp,
                  borderWidth: 1,
                  borderColor: border,
                  backgroundColor: colors.surfaceSunken,
                }}
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

              <View className="mx-6 my-3 flex-row items-center">
                <View
                  className="flex-1"
                  style={{ height: 1, backgroundColor: borderSoft }}
                />
                <TacticalLabel className="mx-2" size={9}>
                  Cuenta
                </TacticalLabel>
                <View
                  className="flex-1"
                  style={{ height: 1, backgroundColor: borderSoft }}
                />
              </View>

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
                className="mx-3 mt-1 flex-row items-center gap-3 px-3 py-2.5"
                style={{ borderRadius: TACTICAL_RADIUS.sharp }}
              >
                <View
                  className="h-9 w-9 items-center justify-center"
                  style={{
                    borderRadius: TACTICAL_RADIUS.sharp,
                    borderWidth: 1,
                    borderColor: borderSoft,
                    backgroundColor: colors.surfaceSunken,
                  }}
                >
                  <DrawerIcon name="logout" />
                </View>
                <Text
                  className="flex-1"
                  style={{
                    fontFamily: MONO.regular,
                    fontSize: 12,
                    letterSpacing: 1.2,
                    color: colors.steel,
                  }}
                >
                  CERRAR SESIÓN
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View
              className="px-4 pt-4"
              style={{
                borderTopWidth: 1,
                borderTopColor: border,
                backgroundColor: colors.baseElevated,
              }}
            >
              <View className="mb-3">
                <ThemeToggle />
              </View>
              <TacticalLabel className="mb-2" size={9}>
                Cambiar de modo
              </TacticalLabel>
              <UiButton
                label={modeButtonLabel}
                onPress={() => void handleModeSwitch()}
              />
            </View>
          </View>
        </Animated.View>

        <Pressable
          className="flex-1"
          style={{ backgroundColor: "rgba(17, 22, 34, 0.72)" }}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
}
