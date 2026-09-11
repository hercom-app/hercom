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
import { useAppTheme } from "../contexts/ThemeContext";
import {
  MONO,
  POPPINS,
  TACTICAL_BORDER,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";

/**
 * Primitivos base de la app, ya en estética táctica (HUD oscuro).
 * Para piezas nuevas preferí los componentes de `tactical.tsx`, que exponen
 * corchetes de mira, telemetría y etiquetas monoespaciadas.
 */

export const CARD_SHADOW = {
  shadowColor: "#000000",
  shadowOpacity: 0.35,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
} as const;

export const SHEET_SHADOW = {
  shadowColor: "#000000",
  shadowOpacity: 0.5,
  shadowRadius: 22,
  shadowOffset: { width: 0, height: -6 },
  elevation: 18,
} as const;

/** Campo relleno del HUD (fondo hundido + borde acero). */
export const FILLED_INPUT_CLASS = "px-4 py-3.5 text-base";

export function getFilledInputStyle() {
  return {
    backgroundColor: TACTICAL_COLORS.surfaceSunken,
    borderRadius: TACTICAL_RADIUS.sharp,
    borderWidth: 1,
    borderColor: TACTICAL_BORDER,
    color: TACTICAL_COLORS.textStrong,
    fontFamily: POPPINS.regular,
  };
}

/** @deprecated Usa getFilledInputStyle() — el valor estático no sigue el tema. */
export const FILLED_INPUT_STYLE = getFilledInputStyle();

type UiButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  size?: "lg" | "md";
};

/** CTA de una sola jerarquía: el primario es el único lleno. */
export function UiButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "lg",
}: UiButtonProps) {
  const { colors, border, glow } = useAppTheme();
  const isPrimary = variant === "primary";
  const background = isPrimary
    ? colors.accent
    : variant === "secondary"
      ? `${colors.steel}1F`
      : "transparent";
  const borderColor = isPrimary ? colors.accent : border;
  const labelColor = isPrimary ? colors.base : colors.accent;
  const height = size === "lg" ? "h-14" : "h-12";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      className={`${height} items-center justify-center px-4 ${
        disabled || loading ? "opacity-45" : ""
      }`}
      style={[
        {
          backgroundColor: background,
          borderRadius: TACTICAL_RADIUS.sharp,
          borderWidth: 1,
          borderColor,
        },
        isPrimary && !disabled && !loading ? glow : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <Text
          style={{
            fontFamily: MONO.bold,
            fontSize: size === "lg" ? 13 : 12,
            letterSpacing: 2,
            color: labelColor,
          }}
        >
          {label.toUpperCase()}
        </Text>
      )}
    </TouchableOpacity>
  );
}

type UiCardProps = {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function UiCard({ children, className = "", style }: UiCardProps) {
  const { colors, border, scheme } = useAppTheme();
  return (
    <View
      className={`p-5 ${className}`.trim()}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: TACTICAL_RADIUS.panel,
          borderWidth: 1,
          borderColor: border,
        },
        scheme === "light"
          ? {
              shadowColor: "#0F172A",
              shadowOpacity: 0.08,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            }
          : CARD_SHADOW,
        style,
      ]}
    >
      {children}
    </View>
  );
}

type UiChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function UiChip({ label, selected = false, onPress }: UiChipProps) {
  const { colors, border } = useAppTheme();
  const body = (
    <View
      className="px-3 py-1.5"
      style={{
        borderRadius: TACTICAL_RADIUS.sharp,
        borderWidth: 1,
        borderColor: selected ? colors.accent : border,
        backgroundColor: selected ? `${colors.accent}24` : "transparent",
      }}
    >
      <Text
        style={{
          fontFamily: MONO.medium,
          fontSize: 10,
          letterSpacing: 1.3,
          color: selected ? colors.accent : colors.steel,
        }}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
  if (onPress === undefined) {
    return body;
  }
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      {body}
    </TouchableOpacity>
  );
}

type UiBadgeProps = {
  count: number;
};

export function UiBadge({ count }: UiBadgeProps) {
  const { colors } = useAppTheme();
  if (count <= 0) {
    return null;
  }
  return (
    <View
      className="min-w-[20px] items-center px-1.5 py-0.5"
      style={{
        backgroundColor: colors.accent,
        borderRadius: TACTICAL_RADIUS.sharp,
      }}
    >
      <Text
        style={{
          fontFamily: MONO.bold,
          fontSize: 10,
          color: colors.base,
        }}
      >
        {count > 99 ? "99+" : String(count)}
      </Text>
    </View>
  );
}

type UiInputProps = TextInputProps & {
  className?: string;
};

export function UiInput({ className = "", style, ...props }: UiInputProps) {
  const { colors, border } = useAppTheme();
  return (
    <TextInput
      placeholderTextColor={`${colors.steel}B3`}
      {...props}
      className={`${FILLED_INPUT_CLASS} ${className}`.trim()}
      style={[
        {
          backgroundColor: colors.surfaceSunken,
          borderRadius: TACTICAL_RADIUS.sharp,
          borderWidth: 1,
          borderColor: border,
          color: colors.textStrong,
          fontFamily: POPPINS.regular,
        },
        style,
      ]}
    />
  );
}

export function UiEmpty({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { colors, borderSoft } = useAppTheme();
  return (
    <View
      className="items-center px-4 py-8"
      style={{
        borderWidth: 1,
        borderColor: borderSoft,
        borderStyle: "dashed",
        borderRadius: TACTICAL_RADIUS.sharp,
      }}
    >
      <Text
        className="text-center"
        style={{
          fontFamily: MONO.medium,
          fontSize: 11,
          letterSpacing: 1.4,
          color: colors.text,
        }}
      >
        {title.toUpperCase()}
      </Text>
      {subtitle !== undefined && subtitle !== "" && (
        <Text
          className="mt-1.5 text-center"
          style={{
            fontFamily: POPPINS.regular,
            fontSize: 11,
            lineHeight: 17,
            color: colors.steel,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}
