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
  DISPLAY,
  MONO,
  POPPINS,
  TABULAR,
  TACTICAL_BORDER,
  TACTICAL_BORDER_SOFT,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
  TYPE,
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
  const { colors, scheme, borderSoft } = useAppTheme();

  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 14,
        paddingHorizontal: 16,
        backgroundColor: colors.headerBg,
        borderBottomWidth: 1,
        borderBottomColor:
          scheme === "light" ? borderSoft : "rgba(255,255,255,0.12)",
      }}
    >
      <View className="flex-row items-center gap-3">
        <HamburgerButton
          onPress={onOpenMenu}
          variant={scheme === "light" ? "light" : "navy"}
        />
        <View className="min-w-0 flex-1">
          <Text
            style={{
              fontFamily: DISPLAY.bold,
              fontSize: TYPE.title,
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
                fontSize: TYPE.caption,
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

/** Tarifa / saldo destacado — card clara, cifra grande sans. */
export function FieldDataBand({
  label,
  value,
  footer,
}: {
  label?: string;
  value: string;
  footer?: string;
}) {
  const { colors, borderSoft } = useAppTheme();
  return (
    <View
      className="px-5 py-4"
      style={{
        backgroundColor: colors.dataBandBg,
        borderRadius: TACTICAL_RADIUS.panel,
        borderWidth: 1,
        borderColor: borderSoft,
      }}
    >
      {label !== undefined && label !== "" && (
        <Text
          style={{
            fontFamily: POPPINS.medium,
            fontSize: TYPE.caption,
            color: colors.dataBandLabel,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      )}
      <Text
        style={{
          fontFamily: MONO.bold,
          fontSize: TYPE.amount,
          color: colors.dataBandText,
          ...TABULAR,
        }}
      >
        {value}
      </Text>
      {footer !== undefined && footer !== "" && (
        <Text
          style={{
            fontFamily: POPPINS.regular,
            fontSize: TYPE.caption,
            color: colors.dataBandLabel,
            marginTop: 8,
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
      className={`p-5 ${className}`.trim()}
      style={[
        {
          backgroundColor: background,
          borderRadius: TACTICAL_RADIUS.panel,
          borderWidth: scheme === "light" ? 0 : 1,
          borderColor: active ? colors.accent : border,
        },
        scheme === "light" && tone === "surface"
          ? {
              shadowColor: "#0F172A",
              shadowOpacity: 0.08,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
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
  size = TYPE.caption,
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

/** Montos y cifras — sans bold con números tabulares. */
export function TacticalValue({
  children,
  size = TYPE.bodyLg,
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
        { fontFamily: MONO.bold, fontSize: size, color, ...TABULAR },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** Título de sección — Arvo (display), estilo institucional. */
export function TacticalTitle({
  children,
  size = TYPE.title,
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
          fontFamily: DISPLAY.bold,
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
  size = TYPE.body,
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
      className={`items-center justify-center px-5 ${
        size === "lg" ? "h-16" : "h-14"
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
            fontSize: size === "lg" ? TYPE.bodyLg : TYPE.body,
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
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: mono ? TYPE.bodyLg : TYPE.bodyLg,
            fontFamily: mono ? MONO.bold : POPPINS.regular,
            color: colors.textStrong,
            ...(mono ? TABULAR : null),
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
      className="flex-row items-center px-3 py-1.5"
      style={{
        borderRadius: 999,
        backgroundColor: `${color}18`,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
          marginRight: 8,
        }}
      />
      <Text
        style={{
          fontFamily: POPPINS.semibold,
          fontSize: TYPE.caption,
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
      <TacticalLabel className="mx-3" size={TYPE.caption}>
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
      <TacticalLabel size={TYPE.body} tone="text" className="text-center">
        {title}
      </TacticalLabel>
      {subtitle !== undefined && subtitle !== "" && (
        <TacticalText size={TYPE.caption} className="mt-1.5 text-center">
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
      <TacticalLabel size={TYPE.caption}>{label}</TacticalLabel>
      <TacticalValue size={TYPE.body} tone={tone}>
        {value}
      </TacticalValue>
    </View>
  );
}
