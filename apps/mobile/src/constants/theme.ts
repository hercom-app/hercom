/** Paleta institucional Hercom — sobria, pocos acentos funcionales. */
export const HERCOM_COLORS = {
  /** Azul institucional — coincide con el fondo de hercom-logo.png (#0B70FE). */
  primary: "#0B70FE",
  primaryDark: "#0959CC",
  primarySoft: "#E8F2FF",

  white: "#FFFFFF",
  canvas: "#F4F6F8",
  surface: "#FFFFFF",
  surfaceMuted: "#F1F5F9",

  text: "#0F172A",
  textMuted: "#64748B",
  textSecondary: "#334155",

  border: "#E2E8F0",

  /** Éxito / disponible (verde sobrio, no neón). */
  success: "#15803D",
  successSoft: "#DCFCE7",
  /** Atención / anticipo (ámbar sobrio, no amarillo). */
  warning: "#B45309",
  warningSoft: "#FEF3C7",
  /** Error / ayuda urgente. */
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",

  offline: "#334155",
  modeSwitch: "#0B70FE",
  mapFallback: "#E8EEF5",
} as const;

export const POPPINS = {
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semibold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
} as const;
