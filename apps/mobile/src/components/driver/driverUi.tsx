import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { DrawerIcon, type DrawerIconName } from "../DrawerIcons";
import { useAppTheme } from "../../contexts/ThemeContext";
import { HERCOM_COLORS, POPPINS, UBER_RADIUS } from "../../constants/theme";

/** Primitivos del flujo chofer (lenguaje Yango: píldoras, grises suaves, títulos grandes). */

type PillTone = "primary" | "success" | "secondary";

export function PillButton({
  label,
  onPress,
  tone = "primary",
  disabled = false,
  loading = false,
  icon,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  tone?: PillTone;
  disabled?: boolean;
  loading?: boolean;
  icon?: DrawerIconName;
  accessibilityLabel?: string;
}) {
  const { colors } = useAppTheme();
  const background =
    tone === "primary"
      ? HERCOM_COLORS.primary
      : tone === "success"
        ? HERCOM_COLORS.success
        : colors.surfaceSunken;
  const foreground = tone === "secondary" ? colors.textStrong : HERCOM_COLORS.white;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: disabled || loading }}
      style={{
        height: 56,
        borderRadius: 999,
        backgroundColor: background,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        paddingHorizontal: 20,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon !== undefined && <DrawerIcon name={icon} color={foreground} size={20} />}
          <Text
            numberOfLines={1}
            style={{ fontFamily: POPPINS.bold, fontSize: 17, color: foreground }}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

/** Acción circular con etiqueta (Waze, compartir…). */
export function RoundAction({
  icon,
  label,
  onPress,
}: {
  icon: DrawerIconName;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ alignItems: "center", width: 84 }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: colors.surfaceSunken,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <DrawerIcon name={icon} color={colors.textStrong} size={22} />
      </View>
      <Text
        numberOfLines={1}
        style={{ marginTop: 6, fontFamily: POPPINS.medium, fontSize: 13, color: colors.text }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <Text
      style={{
        fontFamily: POPPINS.bold,
        fontSize: 19,
        color: colors.textStrong,
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
  );
}

/** Contenedor gris redondeado para agrupar filas. */
export function SoftGroup({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surfaceSunken,
          borderRadius: UBER_RADIUS.card,
          paddingHorizontal: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function GroupDivider() {
  const { border } = useAppTheme();
  return <View style={{ height: 1, backgroundColor: border }} />;
}

/** Fila con casilla circular (documentos verificados, seguro…). */
export function CheckRow({
  label,
  subtitle,
  checked,
  onPress,
}: {
  label: string;
  subtitle?: string;
  checked: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 15 }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          borderWidth: checked ? 0 : 2,
          borderColor: colors.steel,
          backgroundColor: checked ? HERCOM_COLORS.primary : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked && (
          <Text style={{ fontFamily: POPPINS.bold, fontSize: 15, color: HERCOM_COLORS.white }}>
            ✓
          </Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: POPPINS.medium, fontSize: 17, color: colors.textStrong }}>
          {label}
        </Text>
        {subtitle !== undefined && (
          <Text style={{ fontFamily: POPPINS.regular, fontSize: 14, color: colors.steel }}>
            {subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

/** Campo relleno gris, sin borde. */
export function FilledInput({ style, ...props }: TextInputProps) {
  const { colors } = useAppTheme();
  return (
    <TextInput
      placeholderTextColor={colors.steel}
      {...props}
      style={[
        {
          backgroundColor: colors.surfaceSunken,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontFamily: POPPINS.regular,
          fontSize: 17,
          color: colors.textStrong,
        },
        style,
      ]}
    />
  );
}

/** Etiqueta pequeña de estado (Listo / Pendiente). */
export function StatusPill({ label, tone }: { label: string; tone: "success" | "warning" }) {
  const background = tone === "success" ? HERCOM_COLORS.successSoft : HERCOM_COLORS.warningSoft;
  const foreground = tone === "success" ? HERCOM_COLORS.success : HERCOM_COLORS.warning;
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: background,
      }}
    >
      <Text style={{ fontFamily: POPPINS.semibold, fontSize: 13, color: foreground }}>
        {label}
      </Text>
    </View>
  );
}

export function ErrorText({ message }: { message: string | null }) {
  const { colors } = useAppTheme();
  if (message === null) {
    return null;
  }
  return (
    <Text
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{ marginTop: 10, fontFamily: POPPINS.medium, fontSize: 15, color: colors.danger }}
    >
      {message}
    </Text>
  );
}
