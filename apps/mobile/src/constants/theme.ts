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

export type AppColorScheme = "dark" | "light";

export type ThemeColors = {
  base: string;
  baseElevated: string;
  surface: string;
  surfaceSunken: string;
  accent: string;
  accentDim: string;
  steel: string;
  text: string;
  textStrong: string;
  success: string;
  warning: string;
  danger: string;
};

/**
 * Paleta táctica «Sky Blue Camo» — modo oscuro (HUD de operaciones).
 * El dueño percibió esta UI como oscura; queda como dark.
 */
export const DARK_COLORS: ThemeColors = {
  base: "#111622",
  baseElevated: "#161D2E",
  surface: "#2A3B5C",
  surfaceSunken: "#1B2439",
  accent: "#A1C4FD",
  accentDim: "#7FA8E8",
  steel: "#5B84B1",
  text: "#F0F4F8",
  textStrong: "#FFFFFF",
  success: "#4ADE80",
  warning: "#FBBF24",
  danger: "#F87171",
};

/** Modo claro: fondo blanco, texto oscuro, acento institucional. */
export const LIGHT_COLORS: ThemeColors = {
  base: "#FFFFFF",
  baseElevated: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceSunken: "#F1F5F9",
  accent: "#0B70FE",
  accentDim: "#0959CC",
  steel: "#64748B",
  text: "#0F172A",
  textStrong: "#0B1220",
  success: "#15803D",
  warning: "#B45309",
  danger: "#DC2626",
};

/** Tokens vivos: `applyColorScheme` los muta para que la app se re-pinte. */
export const TACTICAL_COLORS: ThemeColors = { ...DARK_COLORS };

/** Bordes de 1px en azul acero con opacidad baja: simulan pantallas HUD. */
export let TACTICAL_BORDER = "rgba(91, 132, 177, 0.28)";
export let TACTICAL_BORDER_SOFT = "rgba(91, 132, 177, 0.18)";
export let TACTICAL_GRID_LINE = "rgba(91, 132, 177, 0.07)";

/** Radios casi angulares: estética militar / robótica. */
export const TACTICAL_RADIUS = {
  sharp: 2,
  panel: 4,
} as const;

/** Glow sutil del acento para estados activos. */
export const TACTICAL_GLOW = {
  shadowColor: DARK_COLORS.accent,
  shadowOpacity: 0.45,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 0 },
  elevation: 8,
};

export const POPPINS = {
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semibold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
} as const;

/** Monoespaciada para datos numéricos y etiquetas tácticas en mayúsculas. */
export const MONO = {
  regular: "JetBrainsMono_400Regular",
  medium: "JetBrainsMono_500Medium",
  bold: "JetBrainsMono_700Bold",
} as const;

const DARK_CHROME = {
  border: "rgba(91, 132, 177, 0.28)",
  borderSoft: "rgba(91, 132, 177, 0.18)",
  gridLine: "rgba(91, 132, 177, 0.07)",
  glowColor: DARK_COLORS.accent,
  glowOpacity: 0.45,
} as const;

const LIGHT_CHROME = {
  border: "#E2E8F0",
  borderSoft: "#E8EEF4",
  gridLine: "rgba(15, 23, 42, 0.05)",
  glowColor: LIGHT_COLORS.accent,
  glowOpacity: 0.18,
} as const;

/** Aplica la paleta viva. Las pantallas que leen estos tokens en render se actualizan. */
export function applyColorScheme(scheme: AppColorScheme): void {
  const next = scheme === "light" ? LIGHT_COLORS : DARK_COLORS;
  const chrome = scheme === "light" ? LIGHT_CHROME : DARK_CHROME;
  Object.assign(TACTICAL_COLORS, next);
  TACTICAL_BORDER = chrome.border;
  TACTICAL_BORDER_SOFT = chrome.borderSoft;
  TACTICAL_GRID_LINE = chrome.gridLine;
  TACTICAL_GLOW.shadowColor = chrome.glowColor;
  TACTICAL_GLOW.shadowOpacity = chrome.glowOpacity;
  TACTICAL_GLOW.elevation = scheme === "light" ? 3 : 8;
}

/** Alias histórico: el HUD actual es el modo oscuro. */
export { DARK_COLORS as TACTICAL_DARK_COLORS };
