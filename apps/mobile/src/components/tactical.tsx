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
import { useAppTheme } from "../contexts/ThemeContext";
import {
  MONO,
  POPPINS,
  TACTICAL_BORDER,
  TACTICAL_BORDER_SOFT,
  TACTICAL_COLORS,
  TACTICAL_GLOW,
  TACTICAL_GRID_LINE,
  TACTICAL_RADIUS,
} from "../constants/theme";

/**
 * Primitivos de interfaz táctica (HUD de operaciones).
 *
 * Reglas del sistema:
 * - Esquinas casi angulares (2-4 px), nunca pill salvo indicadores de estado.
 * - Bordes de 1 px en azul acero con opacidad baja.
 * - Etiquetas y datos numéricos en monoespaciada, mayúsculas y tracking amplio.
 */

/** Corchetes en las esquinas, como miras de una pantalla de mando. */
export function HudCorners({
  color = TACTICAL_COLORS.accent,
  size = 10,
  thickness = 1.5,
  opacity = 0.85,
}: {
  color?: string;
  size?: number;
  thickness?: number;
  opacity?: number;
}) {
  const base: ViewStyle = {
    position: "absolute",
    width: size,
    height: size,
    borderColor: color,
    opacity,
  };
  return (
    <View pointerEvents="none" style={StyleSheetAbsoluteFill}>
      <View
        style={[
          base,
          { top: 0, left: 0, borderTopWidth: thickness, borderLeftWidth: thickness },
        ]}
      />
      <View
        style={[
          base,
          { top: 0, right: 0, borderTopWidth: thickness, borderRightWidth: thickness },
        ]}
      />
      <View
        style={[
          base,
          {
            bottom: 0,
            left: 0,
            borderBottomWidth: thickness,
            borderLeftWidth: thickness,
          },
        ]}
      />
      <View
        style={[
          base,
          {
            bottom: 0,
            right: 0,
            borderBottomWidth: thickness,
            borderRightWidth: thickness,
          },
        ]}
      />
    </View>
  );
}

const StyleSheetAbsoluteFill: ViewStyle = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

/** Cuadrícula tenue de fondo; puramente decorativa. */
export function GridBackdrop({
  spacing = 28,
  rows = 26,
  columns = 14,
}: {
  spacing?: number;
  rows?: number;
  columns?: number;
}) {
  return (
    <View pointerEvents="none" style={StyleSheetAbsoluteFill}>
      {Array.from({ length: rows }).map((_, index) => (
        <View
          key={`h-${index}`}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: index * spacing,
            height: 1,
            backgroundColor: TACTICAL_GRID_LINE,
          }}
        />
      ))}
      {Array.from({ length: columns }).map((_, index) => (
        <View
          key={`v-${index}`}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: index * spacing,
            width: 1,
            backgroundColor: TACTICAL_GRID_LINE,
          }}
        />
      ))}
    </View>
  );
}

/** Lienzo de pantalla: fondo del tema + cuadrícula solo en oscuro. */
export function TacticalScreen({
  children,
  grid = true,
  className = "",
  style,
}: {
  children: ReactNode;
  grid?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { scheme, colors } = useAppTheme();
  return (
    <View
      className={`flex-1 ${className}`.trim()}
      style={[{ backgroundColor: colors.base }, style]}
    >
      {grid && scheme === "dark" ? <GridBackdrop /> : null}
      {children}
    </View>
  );
}

type TacticalPanelProps = {
  children: ReactNode;
  /** Corchetes de mira en las esquinas. */
  corners?: boolean;
  /** Estado activo: borde y glow en azul cielo. */
  active?: boolean;
  /** `sunken` para bloques embebidos dentro de otro panel. */
  tone?: "surface" | "sunken" | "transparent";
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/** Contenedor base: borde HUD de 1 px y esquinas angulares. */
export function TacticalPanel({
  children,
  corners = false,
  active = false,
  tone = "surface",
  className = "",
  style,
}: TacticalPanelProps) {
  const background =
    tone === "surface"
      ? TACTICAL_COLORS.surface
      : tone === "sunken"
        ? TACTICAL_COLORS.surfaceSunken
        : "transparent";
  return (
    <View
      className={`p-4 ${className}`.trim()}
      style={[
        {
          backgroundColor: background,
          borderRadius: TACTICAL_RADIUS.panel,
          borderWidth: 1,
          borderColor: active ? TACTICAL_COLORS.accent : TACTICAL_BORDER,
        },
        active && TACTICAL_GLOW,
        style,
      ]}
    >
      {corners && <HudCorners opacity={active ? 1 : 0.55} />}
      {children}
    </View>
  );
}

/** Etiqueta táctica: monoespaciada, mayúsculas, tracking amplio. */
export function TacticalLabel({
  children,
  tone = "steel",
  size = 11,
  className = "",
  style,
}: {
  children: ReactNode;
  tone?: "steel" | "accent" | "text";
  size?: number;
  className?: string;
  style?: StyleProp<TextStyle>;
}) {
  const color =
    tone === "accent"
      ? TACTICAL_COLORS.accent
      : tone === "text"
        ? TACTICAL_COLORS.text
        : TACTICAL_COLORS.steel;
  return (
    <Text
      className={className}
      style={[
        {
          fontFamily: MONO.medium,
          fontSize: size,
          letterSpacing: 1.6,
          color,
        },
        style,
      ]}
    >
      {typeof children === "string" ? children.toUpperCase() : children}
    </Text>
  );
}

/** Dato numérico o código: monoespaciada, alta legibilidad. */
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
  const color =
    tone === "accent"
      ? TACTICAL_COLORS.accent
      : tone === "steel"
        ? TACTICAL_COLORS.steel
        : TACTICAL_COLORS.textStrong;
  return (
    <Text
      className={className}
      style={[
        { fontFamily: MONO.bold, fontSize: size, letterSpacing: 0.5, color },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** Título de pantalla: monoespaciada, mayúsculas, tracking de mando. */
export function TacticalTitle({
  children,
  size = 20,
  className = "",
}: {
  children: ReactNode;
  size?: number;
  className?: string;
}) {
  return (
    <Text
      className={className}
      style={{
        fontFamily: MONO.bold,
        fontSize: size,
        letterSpacing: size >= 20 ? 2 : 1.6,
        color: TACTICAL_COLORS.textStrong,
        textTransform: "uppercase",
      }}
    >
      {typeof children === "string" ? children.toUpperCase() : children}
    </Text>
  );
}

/** Texto de apoyo sobre fondo oscuro. */
export function TacticalText({
  children,
  size = 13,
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
  return (
    <Text
      className={className}
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: POPPINS.regular,
          fontSize: size,
          lineHeight: size * 1.5,
          color:
            tone === "text" ? TACTICAL_COLORS.text : TACTICAL_COLORS.steel,
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

/** CTA táctico: relleno azul cielo en primario, contorno acero en secundario. */
export function TacticalButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "lg",
  className = "",
}: TacticalButtonProps) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const background = isPrimary
    ? TACTICAL_COLORS.accent
    : isDanger
      ? "rgba(248, 113, 113, 0.12)"
      : variant === "secondary"
        ? "rgba(91, 132, 177, 0.12)"
        : "transparent";
  const borderColor = isPrimary
    ? TACTICAL_COLORS.accent
    : isDanger
      ? TACTICAL_COLORS.danger
      : TACTICAL_BORDER;
  const labelColor = isPrimary
    ? TACTICAL_COLORS.base
    : isDanger
      ? TACTICAL_COLORS.danger
      : TACTICAL_COLORS.accent;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      className={`items-center justify-center px-4 ${
        size === "lg" ? "h-14" : "h-12"
      } ${disabled || loading ? "opacity-45" : ""} ${className}`.trim()}
      style={[
        {
          backgroundColor: background,
          borderRadius: TACTICAL_RADIUS.sharp,
          borderWidth: 1,
          borderColor,
        },
        isPrimary && !disabled && !loading ? TACTICAL_GLOW : null,
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

type TacticalInputProps = TextInputProps & {
  /** Etiqueta táctica encima del campo. */
  label?: string;
  /** Fuerza monoespaciada (DNI, códigos, placas). */
  mono?: boolean;
  containerClassName?: string;
};

/** Campo de datos: fondo hundido, borde HUD y foco en azul cielo. */
export function TacticalInput({
  label,
  mono = false,
  containerClassName = "",
  style,
  ...props
}: TacticalInputProps) {
  return (
    <View className={containerClassName}>
      {label !== undefined && (
        <TacticalLabel className="mb-2">{label}</TacticalLabel>
      )}
      <TextInput
        placeholderTextColor="rgba(91, 132, 177, 0.7)"
        {...props}
        style={[
          {
            backgroundColor: TACTICAL_COLORS.surfaceSunken,
            borderRadius: TACTICAL_RADIUS.sharp,
            borderWidth: 1,
            borderColor: TACTICAL_BORDER,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: mono ? 16 : 15,
            letterSpacing: mono ? 2 : 0,
            fontFamily: mono ? MONO.medium : POPPINS.regular,
            color: TACTICAL_COLORS.textStrong,
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

/** Indicador de estado con punto, como telemetría de misión. */
export function TacticalStatus({ label, tone = "idle" }: TacticalStatusProps) {
  const color =
    tone === "active"
      ? TACTICAL_COLORS.accent
      : tone === "success"
        ? TACTICAL_COLORS.success
        : tone === "warning"
          ? TACTICAL_COLORS.warning
          : tone === "danger"
            ? TACTICAL_COLORS.danger
            : TACTICAL_COLORS.steel;
  return (
    <View
      className="flex-row items-center px-2.5 py-1"
      style={{
        borderRadius: TACTICAL_RADIUS.sharp,
        borderWidth: 1,
        borderColor: `${color}66`,
        backgroundColor: `${color}1A`,
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          backgroundColor: color,
          marginRight: 7,
        }}
      />
      <Text
        style={{
          fontFamily: MONO.medium,
          fontSize: 10,
          letterSpacing: 1.4,
          color,
        }}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

/** Separador con etiqueta opcional al centro. */
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
      <TacticalLabel className="mx-3" size={10}>
        {label}
      </TacticalLabel>
      <View
        className="flex-1"
        style={{ height: 1, backgroundColor: TACTICAL_BORDER_SOFT }}
      />
    </View>
  );
}

/** Estado vacío con marco punteado del HUD. */
export function TacticalEmpty({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View
      className="items-center px-4 py-8"
      style={{
        borderWidth: 1,
        borderColor: TACTICAL_BORDER_SOFT,
        borderStyle: "dashed",
        borderRadius: TACTICAL_RADIUS.sharp,
      }}
    >
      <TacticalLabel size={10} tone="text" className="text-center">
        {title}
      </TacticalLabel>
      {subtitle !== undefined && subtitle !== "" && (
        <TacticalText size={11} className="mt-1.5 text-center">
          {subtitle}
        </TacticalText>
      )}
    </View>
  );
}

/** Fila de telemetría: etiqueta a la izquierda, dato a la derecha. */
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
      <TacticalLabel size={10}>{label}</TacticalLabel>
      <TacticalValue size={13} tone={tone}>
        {value}
      </TacticalValue>
    </View>
  );
}
