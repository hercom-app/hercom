import type { ReactNode } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DrawerIcon } from "../DrawerIcons";
import { useAppTheme } from "../../contexts/ThemeContext";
import { POPPINS, UBER_RADIUS } from "../../constants/theme";

type DriverSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/** Hoja inferior sobre el mapa con título y botón de cierre (estilo Yango). */
export function DriverSheet({ visible, title, onClose, children }: DriverSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15, 23, 42, 0.35)" }}
        onPress={onClose}
      >
        <View style={{ alignItems: "flex-end", paddingHorizontal: 16, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={onClose}
            accessibilityLabel="Cerrar"
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DrawerIcon name="close" color={colors.textStrong} size={20} />
          </TouchableOpacity>
        </View>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: UBER_RADIUS.sheet,
            borderTopRightRadius: UBER_RADIUS.sheet,
            paddingTop: 24,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 16,
            maxHeight: "85%",
          }}
        >
          <Text
            style={{
              fontFamily: POPPINS.bold,
              fontSize: 24,
              lineHeight: 30,
              color: colors.textStrong,
              marginBottom: 12,
            }}
          >
            {title}
          </Text>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Fila de menú: icono, título, subtítulo y chevron. */
export function DriverSheetRow({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  disabled = false,
}: {
  icon: Parameters<typeof DrawerIcon>[0]["name"];
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        paddingVertical: 14,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <DrawerIcon name={icon} color={iconColor ?? colors.textStrong} size={24} />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: POPPINS.medium,
            fontSize: 17,
            color: colors.textStrong,
          }}
        >
          {title}
        </Text>
        {subtitle !== undefined && (
          <Text
            style={{
              marginTop: 2,
              fontFamily: POPPINS.regular,
              fontSize: 14,
              color: colors.steel,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      <DrawerIcon name="chevron" color={colors.textStrong} />
    </TouchableOpacity>
  );
}
