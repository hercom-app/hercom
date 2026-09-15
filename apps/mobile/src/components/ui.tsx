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
  POPPINS,
  TACTICAL_BORDER,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
  TYPE,
} from "../constants/theme";

/**
 * Primitivos base — navy camo + azul Hercom, estilo Field Service.
 */

export const CARD_SHADOW = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
} as const;

export const SHEET_SHADOW = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.12,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: -4 },
  elevation: 8,
} as const;

export const FILLED_INPUT_CLASS = "px-4 py-4 text-lg";

export function getFilledInputStyle() {
  return {
    backgroundColor: TACTICAL_COLORS.surface,
    borderRadius: TACTICAL_RADIUS.sharp,
    borderWidth: 1,
    borderColor: TACTICAL_BORDER,
    color: TACTICAL_COLORS.textStrong,
    fontFamily: POPPINS.regular,
  };
}

/** @deprecated Usa getFilledInputStyle() — el valor estático no sigue el tema. */
export const FILLED_INPUT_STYLE = {
  backgroundColor: "#FFFFFF",
  borderRadius: TACTICAL_RADIUS.sharp,
  borderWidth: 1,
  borderColor: "rgba(27, 44, 74, 0.14)",
  color: "#0F172A",
  fontFamily: POPPINS.regular,
};

type UiButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  size?: "lg" | "md";
};

export function UiButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "lg",
}: UiButtonProps) {
  const { colors, border } = useAppTheme();
  const isPrimary = variant === "primary";
  const background = isPrimary
    ? colors.accent
    : variant === "secondary"
      ? colors.surface
      : "transparent";
  const borderColor = isPrimary ? colors.accent : border;
  const labelColor = isPrimary ? colors.onAccent : colors.accent;
  const height = size === "lg" ? "h-16" : "h-14";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      className={`${height} items-center justify-center px-4 ${
        disabled || loading ? "opacity-45" : ""
      }`}
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
        scheme === "light" ? CARD_SHADOW : null,
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
      className="px-3.5 py-2"
      style={{
        borderRadius: TACTICAL_RADIUS.sharp,
        borderWidth: 1,
        borderColor: selected ? colors.accent : border,
        backgroundColor: selected ? `${colors.accent}18` : colors.surface,
      }}
    >
      <Text
        style={{
          fontFamily: POPPINS.semibold,
          fontSize: TYPE.caption,
          color: selected ? colors.accent : colors.steel,
        }}
      >
        {label}
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
          fontFamily: POPPINS.bold,
          fontSize: TYPE.caption,
          color: colors.onAccent,
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
      placeholderTextColor={colors.steel}
      {...props}
      className={`${FILLED_INPUT_CLASS} ${className}`.trim()}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: TACTICAL_RADIUS.sharp,
          borderWidth: 1,
          borderColor: border,
          color: colors.textStrong,
          fontFamily: POPPINS.regular,
          fontSize: TYPE.bodyLg,
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
        borderRadius: TACTICAL_RADIUS.panel,
      }}
    >
      <Text
        className="text-center"
        style={{
          fontFamily: POPPINS.semibold,
          fontSize: TYPE.body,
          color: colors.text,
        }}
      >
        {title}
      </Text>
      {subtitle !== undefined && subtitle !== "" && (
        <Text
          className="mt-1.5 text-center"
          style={{
            fontFamily: POPPINS.regular,
            fontSize: TYPE.caption,
            lineHeight: 22,
            color: colors.steel,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}
