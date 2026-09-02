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
import { POPPINS } from "../constants/theme";

export const CARD_SHADOW = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.06,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3,
} as const;

export const SHEET_SHADOW = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.14,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: -6 },
  elevation: 16,
} as const;

export const FILLED_INPUT_CLASS =
  "rounded-2xl bg-slate-100 px-4 py-3.5 text-base text-slate-900";

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
  const tone =
    variant === "primary"
      ? "bg-hercom"
      : variant === "secondary"
        ? "border border-hercom/30 bg-hercom-soft"
        : "bg-transparent";
  const labelTone =
    variant === "primary"
      ? "text-white"
      : variant === "secondary"
        ? "text-hercom-dark"
        : "text-hercom-dark";
  const height = size === "lg" ? "h-14" : "h-12";
  const labelSize = size === "lg" ? "text-base" : "text-sm";
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.88}
      className={`${height} items-center justify-center rounded-2xl px-4 disabled:opacity-45 ${tone}`}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#FFFFFF" : "#0062CC"}
        />
      ) : (
        <Text
          className={`${labelSize} ${labelTone}`}
          style={{ fontFamily: POPPINS.bold }}
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
  return (
    <View
      className={`rounded-3xl bg-white p-5 ${className}`.trim()}
      style={[CARD_SHADOW, style]}
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
  const body = (
    <View
      className={`rounded-full px-3.5 py-1.5 ${
        selected ? "bg-hercom" : "bg-slate-100"
      }`}
    >
      <Text
        className={`text-xs font-semibold ${
          selected ? "text-white" : "text-slate-600"
        }`}
      >
        {label}
      </Text>
    </View>
  );
  if (onPress === undefined) {
    return body;
  }
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      {body}
    </TouchableOpacity>
  );
}

type UiBadgeProps = {
  count: number;
};

export function UiBadge({ count }: UiBadgeProps) {
  if (count <= 0) {
    return null;
  }
  return (
    <View className="min-w-[20px] items-center rounded-full bg-hercom px-1.5 py-0.5">
      <Text className="text-[10px] font-bold text-white">
        {count > 99 ? "99+" : String(count)}
      </Text>
    </View>
  );
}

type UiInputProps = TextInputProps & {
  className?: string;
};

export function UiInput({ className = "", ...props }: UiInputProps) {
  return (
    <TextInput
      placeholderTextColor="#94A3B8"
      {...props}
      className={`${FILLED_INPUT_CLASS} ${className}`.trim()}
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
  return (
    <View className="items-center px-4 py-10">
      <Text className="text-center text-base font-semibold text-slate-800">
        {title}
      </Text>
      {subtitle !== undefined && subtitle !== "" && (
        <Text className="mt-1 text-center text-sm text-slate-500">{subtitle}</Text>
      )}
    </View>
  );
}
