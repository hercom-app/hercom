import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@proyecto/backend";
import { useAppMode } from "../contexts/AppModeContext";

const DRAWER_WIDTH = Math.min(Dimensions.get("window").width * 0.82, 340);

type MenuItem = {
  key: string;
  label: string;
  icon: string;
  active?: boolean;
};

type SideDrawerProps = {
  visible: boolean;
  onClose: () => void;
  userName: string;
  unreadCount?: number;
  activeItem?: string;
  onSelectItem?: (key: string) => void;
};

const CLIENT_ITEMS: MenuItem[] = [
  { key: "ciudad", label: "Ciudad", icon: "🚗", active: true },
  { key: "historial", label: "Mis servicios", icon: "🕐" },
  { key: "notificaciones", label: "Notificaciones", icon: "🔔" },
  { key: "seguridad", label: "Seguridad", icon: "🛡️" },
  { key: "configuracion", label: "Configuración", icon: "⚙️" },
  { key: "ayuda", label: "Ayuda", icon: "ℹ️" },
];

const DRIVER_ITEMS: MenuItem[] = [
  { key: "servicios", label: "Servicios", icon: "🚗", active: true },
  { key: "ofertas", label: "Solicitudes abiertas", icon: "📋" },
  { key: "saldo", label: "Recargar saldo", icon: "💳" },
  { key: "ganancias", label: "Ganancias", icon: "📈" },
  { key: "notificaciones", label: "Notificaciones", icon: "🔔" },
  { key: "configuracion", label: "Datos de cobro", icon: "⚙️" },
  { key: "ayuda", label: "Ayuda", icon: "ℹ️" },
];

/** Menú lateral izquierdo (estilo inDrive) con cambio de modo abajo. */
export function SideDrawer({
  visible,
  onClose,
  userName,
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
  } = useAppMode();
  const ensureDemoDriver = useMutation(api.drivers.ensureDemoDriverProfile);
  const [modeSwitching, setModeSwitching] = useState(false);
  const slide = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

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

  const items = mode === "driver" ? DRIVER_ITEMS : CLIENT_ITEMS;
  const modeButtonLabel =
    mode === "client" ? "Modo conductor" : "Modo cliente";

  async function handleModeSwitch() {
    if (modeSwitching) {
      return;
    }
    onClose();
    if (mode === "client") {
      if (canUseDriverMode) {
        await setMode("driver");
        return;
      }
      // DEMO: sin RENIEC ni documentos — crea perfil mínimo y entra a modo chofer.
      setModeSwitching(true);
      try {
        await ensureDemoDriver({});
        await setMode("driver");
      } catch (error) {
        console.warn(
          "No se pudo activar perfil demo de chofer:",
          error instanceof Error ? error.message : error,
        );
      } finally {
        setModeSwitching(false);
      }
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
            <View className="mb-2 flex-row items-center gap-2 px-4 py-3">
              <TouchableOpacity
                activeOpacity={0.8}
                className="flex-1 flex-row items-center gap-3 py-1"
              >
                <View className="h-14 w-14 items-center justify-center rounded-full bg-hercom">
                  <Text className="text-2xl text-white">
                    {(userName.trim()[0] ?? "H").toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-slate-900">
                    {userName.trim() !== "" ? userName : "Usuario Hercom"}
                  </Text>
                  <Text className="mt-0.5 text-xs text-slate-500">
                    {mode === "driver" ? "Chofer" : "Pasajero"} · Hercom
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                accessibilityLabel="Cerrar menú"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
              >
                <Text className="text-xl font-medium text-slate-600">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {items.map((item) => {
                const selected =
                  item.key === activeItem || (item.active === true && activeItem === item.key);
                const label =
                  item.key === "notificaciones" && unreadCount > 0
                    ? `${item.label} (${unreadCount})`
                    : item.label;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => {
                      onSelectItem?.(item.key);
                      onClose();
                    }}
                    className={`mx-3 mb-1 flex-row items-center gap-3 rounded-2xl px-4 py-3.5 ${
                      selected ? "bg-slate-100" : ""
                    }`}
                  >
                    <Text className="text-base">{item.icon}</Text>
                    <Text
                      className={`flex-1 text-[15px] ${
                        selected
                          ? "font-semibold text-slate-900"
                          : "font-medium text-slate-800"
                      }`}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                onPress={() => {
                  onClose();
                  void signOut();
                }}
                className="mx-3 mt-2 flex-row items-center gap-3 rounded-2xl px-4 py-3.5"
              >
                <Text className="text-base">🚪</Text>
                <Text className="flex-1 text-[15px] font-medium text-slate-800">
                  Cerrar sesión
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View className="border-t border-slate-100 px-5 pt-4">
              <TouchableOpacity
                onPress={() => void handleModeSwitch()}
                activeOpacity={0.9}
                className="items-center rounded-2xl bg-hercom py-4"
              >
                <Text className="text-base font-bold text-white">
                  {modeButtonLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <Pressable className="flex-1 bg-black/35" onPress={onClose} />
      </View>
    </Modal>
  );
}
