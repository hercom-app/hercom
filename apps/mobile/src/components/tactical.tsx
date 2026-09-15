import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HamburgerButton } from "./HamburgerButton";
import { useAppTheme } from "../contexts/ThemeContext";
import {
  MONO,
  POPPINS,
  TACTICAL_BORDER,
  TACTICAL_BORDER_SOFT,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";

/**
 * Primitivos Field Service — navy camo + azul Hercom.
 * Sobrio, legible, sin cuadrícula ni HUD de videojuego.
 */

/** @deprecated Sin efecto visual; se mantiene por compatibilidad. */
export function HudCorners(_props: {
  color?: string;
  size?: number;
  thickness?: number;
  opacity?: number;
}) {
  return null;
}

/** @deprecated Sin efecto visual; se mantiene por compatibilidad. */
export function GridBackdrop(_props?: {
  spacing?: number;
  rows?: number;
  columns?: number;
}) {
  return null;
}

/** Lienzo de pantalla: fondo canvas / navy camo, sin grilla. */
export function TacticalScreen({
  children,
  grid: _grid = false,
  className = "",
  style,
}: {
  children: ReactNode;
  grid?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      className={`flex-1 ${className}`.trim()}
      style={[{ backgroundColor: colors.base }, style]}
    >
      {children}
    </View>
  );
}

/** Barra superior navy con título (estilo Military Pay). */
export function FieldScreenHeader({
  title,
  subtitle,
  onOpenMenu,
  trailing,
}: {
  title: string;
  subtitle?: string;
  onOpenMenu: () => void;
  trailing?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: colors.headerBg,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.12)",
      }}
    >
      <View className="flex-row items-center gap-3">
        <HamburgerButton onPress={onOpenMenu} variant="navy" />
        <View className="min-w-0 flex-1">
          <Text
            style={{
              fontFamily: POPPINS.bold,
              fontSize: 18,
              color: colors.headerText,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle !== undefined && subtitle !== "" && (
            <Text
              style={{
                fontFamily: POPPINS.regular,
                fontSize: 13,
                color: colors.headerMuted,
                marginTop: 2,
              }}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {trailing}
      </View>
    </View>
  );
}

/** Banda negra para cifra destacada (tarifa, saldo). */
export function FieldDataBand({
  label,
  value,
  footer,
}: {
  label?: string;
  value: string;
  footer?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      className="px-4 py-4"
      style={{
        backgroundColor: colors.dataBandBg,
        borderRadius: TACTICAL_RADIUS.panel,
      }}
    >
      {label !== undefined && label !== "" && (
        <Text
          style={{
            fontFamily: POPPINS.medium,
            fontSize: 12,
            color: colors.headerMuted,
            marginBottom: 4,
          }}
        >
          {label}
        </Text>
      )}
      <Text
        style={{
          fontFamily: MONO.regular,
          fontSize: 28,
          color: colors.dataBandText,
          letterSpacing: 0.5,
        }}
      >
        {value}
      </Text>
      {footer !== undefined && footer !== "" && (
        <Text
          style={{
            fontFamily: POPPINS.regular,
            fontSize: 12,
            color: colors.headerMuted,
            marginTop: 6,
          }}
        >
          {footer}
        </Text>
      )}
    </View>
  );
}

type TacticalPanelProps = {
  children: ReactNode;
  corners?: boolean;
  active?: boolean;
  tone?: "surface" | "sunken" | "transparent";
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/** Card blanca / navy con borde gris. */
export function TacticalPanel({
  children,
  corners: _corners = false,
  active = false,
  tone = "surface",
  className = "",
  style,
}: TacticalPanelProps) {
  const { colors, border, scheme } = useAppTheme();
  const background =
    tone === "surface"
      ? colors.surface
      : tone === "sunken"
        ? colors.surfaceSunken
        : "transparent";
  return (
    <View
      className={`p-4 ${className}`.trim()}
      style={[
        {
          backgroundColor: background,
          borderRadius: TACTICAL_RADIUS.panel,
          borderWidth: 1,
          borderColor: active ? colors.accent : border,
        },
        scheme === "light" && tone === "surface"
          ? {
              shadowColor: "#0F172A",
              shadowOpacity: 0.06,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 1,
            }
          : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Etiqueta de formulario — sentence case, sans. */
export function TacticalLabel({
  children,
  tone = "steel",
  size = 12,
  className = "",
  style,
}: {
  children: ReactNode;
  tone?: "steel" | "accent" | "text";
  size?: number;
  className?: string;
  style?: StyleProp<TextStyle>;
}) {
  const { colors } = useAppTheme();
  const color =
    tone === "accent"
      ? colors.accent
      : tone === "text"
        ? colors.text
        : colors.steel;
  return (
    <Text
      className={className}
      style={[
        {
          fontFamily: POPPINS.semibold,
          fontSize: size,
          color,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** Montos y códigos — mono. */
export function TacticalValue({
  children,
  size = 18,
  tone = "text",
  className = "",
  style,
}: {
  children: ReactNode;
  size?: number;
  tone?: "text" | "accent" | "steel";
  className?: string;
  style?: StyleProp<TextStyle>;
}) {
  const { colors } = useAppTheme();
  const color =
    tone === "accent"
      ? colors.accent
      : tone === "steel"
        ? colors.steel
        : colors.textStrong;
  return (
    <Text
      className={className}
      style={[
        { fontFamily: MONO.regular, fontSize: size, color },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** Título de sección — Rajdhani bold, sin mayúsculas forzadas. */
export function TacticalTitle({
  children,
  size = 18,
  className = "",
  style,
  onHeader = false,
}: {
  children: ReactNode;
  size?: number;
  className?: string;
  style?: StyleProp<TextStyle>;
  /** Texto sobre barra navy. */
  onHeader?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <Text
      className={className}
      style={[
        {
          fontFamily: POPPINS.bold,
          fontSize: size,
          color: onHeader ? colors.headerText : colors.textStrong,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function TacticalText({
  children,
  size = 14,
  tone = "steel",
  className = "",
  style,
  numberOfLines,
}: {
  children: ReactNode;
  size?: number;
  tone?: "steel" | "text";
  className?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const { colors } = useAppTheme();
  return (
    <Text
      className={className}
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: POPPINS.regular,
          fontSize: size,
          lineHeight: size * 1.45,
          color: tone === "text" ? colors.text : colors.steel,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

type TacticalButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "lg" | "md";
  className?: string;
};

/** CTA — azul Hercom sólido, sin glow. */
export function TacticalButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "lg",
  className = "",
}: TacticalButtonProps) {
  const { colors, border } = useAppTheme();
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const background = isPrimary
    ? colors.accent
    : isDanger
      ? `${colors.danger}14`
      : variant === "secondary"
        ? colors.surface
        : "transparent";
  const borderColor = isPrimary
    ? colors.accent
    : isDanger
      ? colors.danger
      : border;
  const labelColor = isPrimary
    ? colors.onAccent
    : isDanger
      ? colors.danger
      : colors.accent;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      className={`items-center justify-center px-4 ${
        size === "lg" ? "h-14" : "h-12"
      } ${disabled || loading ? "opacity-45" : ""} ${className}`.trim()}
      style={{
        backgroundColor: background,
        borderRadius: TACTICAL_RADIUS.panel,
        borderWidth: isPrimary ? 0 : 1,
        borderColor,
      }}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <Text
          style={{
            fontFamily: POPPINS.bold,
            fontSize: size === "lg" ? 16 : 15,
            color: labelColor,
          }}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

type TacticalInputProps = TextInputProps & {
  label?: string;
  mono?: boolean;
  containerClassName?: string;
};

export function TacticalInput({
  label,
  mono = false,
  containerClassName = "",
  style,
  ...props
}: TacticalInputProps) {
  const { colors, border } = useAppTheme();
  return (
    <View className={containerClassName}>
      {label !== undefined && (
        <TacticalLabel className="mb-1.5">{label}</TacticalLabel>
      )}
      <TextInput
        placeholderTextColor={colors.steel}
        {...props}
        style={[
          {
            backgroundColor: colors.surface,
            borderRadius: TACTICAL_RADIUS.sharp,
            borderWidth: 1,
            borderColor: border,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: mono ? 16 : 15,
            fontFamily: mono ? MONO.regular : POPPINS.regular,
            color: colors.textStrong,
          },
          style,
        ]}
      />
    </View>
  );
}

type TacticalStatusProps = {
  label: string;
  tone?: "idle" | "active" | "success" | "warning" | "danger";
};

export function TacticalStatus({ label, tone = "idle" }: TacticalStatusProps) {
  const { colors } = useAppTheme();
  const color =
    tone === "active"
      ? colors.accent
      : tone === "success"
        ? colors.success
        : tone === "warning"
          ? colors.warning
          : tone === "danger"
            ? colors.danger
            : colors.steel;
  return (
    <View
      className="flex-row items-center px-2.5 py-1"
      style={{
        borderRadius: TACTICAL_RADIUS.sharp,
        borderWidth: 1,
        borderColor: `${color}55`,
        backgroundColor: `${color}12`,
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: color,
          marginRight: 7,
        }}
      />
      <Text
        style={{
          fontFamily: POPPINS.medium,
          fontSize: 12,
          color,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function TacticalDivider({ label }: { label?: string }) {
  if (label === undefined) {
    return (
      <View
        style={{ height: 1, backgroundColor: TACTICAL_BORDER_SOFT }}
        className="my-4"
      />
    );
  }
  return (
    <View className="my-4 flex-row items-center">
      <View
        className="flex-1"
        style={{ height: 1, backgroundColor: TACTICAL_BORDER_SOFT }}
      />
      <TacticalLabel className="mx-3" size={11}>
        {label}
      </TacticalLabel>
      <View
        className="flex-1"
        style={{ height: 1, backgroundColor: TACTICAL_BORDER_SOFT }}
      />
    </View>
  );
}

export function TacticalEmpty({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { borderSoft } = useAppTheme();
  return (
    <View
      className="items-center px-4 py-8"
      style={{
        borderWidth: 1,
        borderColor: borderSoft,
        borderStyle: "dashed",
        borderRadius: TACTICAL_RADIUS.panel,
      }}
    >
      <TacticalLabel size={13} tone="text" className="text-center">
        {title}
      </TacticalLabel>
      {subtitle !== undefined && subtitle !== "" && (
        <TacticalText size={13} className="mt-1.5 text-center">
          {subtitle}
        </TacticalText>
      )}
    </View>
  );
}

export function TacticalReadout({
  label,
  value,
  tone = "text",
}: {
  label: string;
  value: string;
  tone?: "text" | "accent" | "steel";
}) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <TacticalLabel size={12}>{label}</TacticalLabel>
      <TacticalValue size={14} tone={tone}>
        {value}
      </TacticalValue>
    </View>
  );
}
