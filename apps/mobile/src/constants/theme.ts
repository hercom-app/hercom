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
 * Oscuro — HUD Black Ops / SilentArc: negro-oliva, cian sonar, ámbar de alerta.
 */
export const DARK_COLORS: ThemeColors = {
  base: "#07090B",
  baseElevated: "#0C1014",
  surface: "#12181C",
  surfaceSunken: "#080B0E",
  accent: "#3EE0C6",
  accentDim: "#1FA896",
  steel: "#7A8B94",
  text: "#DCE6E2",
  textStrong: "#F3F7F5",
  success: "#3DDC84",
  warning: "#FFB020",
  danger: "#FF4D4D",
};

/**
 * Claro — briefing diurno: papel táctico, tinta de mando, mismo cian de ops.
 */
export const LIGHT_COLORS: ThemeColors = {
  base: "#E8E4D9",
  baseElevated: "#F1EEE6",
  surface: "#F7F5EE",
  surfaceSunken: "#DDD8CC",
  accent: "#0A6B5F",
  accentDim: "#08574E",
  steel: "#5C6562",
  text: "#141A1C",
  textStrong: "#0B1012",
  success: "#157A3C",
  warning: "#B45309",
  danger: "#C81E1E",
};

/** Tokens vivos: `applyColorScheme` los muta para que la app se re-pinte. */
export const TACTICAL_COLORS: ThemeColors = { ...DARK_COLORS };

/** Bordes de 1px en cian de sonar con opacidad baja. */
export let TACTICAL_BORDER = "rgba(62, 224, 198, 0.28)";
export let TACTICAL_BORDER_SOFT = "rgba(62, 224, 198, 0.16)";
export let TACTICAL_GRID_LINE = "rgba(62, 224, 198, 0.06)";

/** Radios casi nulos: chasis de consola, no card de producto. */
export const TACTICAL_RADIUS = {
  sharp: 1,
  panel: 2,
} as const;

/** Glow del acento para estados activos. */
export const TACTICAL_GLOW = {
  shadowColor: DARK_COLORS.accent,
  shadowOpacity: 0.55,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 0 },
  elevation: 8,
};

/**
 * Cuerpo UI — Rajdhani (condensada, menús de FPS).
 * El nombre `POPPINS` se mantiene para no romper imports.
 */
export const POPPINS = {
  regular: "Rajdhani_400Regular",
  medium: "Rajdhani_500Medium",
  semibold: "Rajdhani_600SemiBold",
  bold: "Rajdhani_700Bold",
} as const;

/** Readouts HUD — Share Tech Mono (terminal de operaciones). */
export const MONO = {
  regular: "ShareTechMono_400Regular",
  medium: "ShareTechMono_400Regular",
  bold: "ShareTechMono_400Regular",
} as const;

/** Títulos cortos de mando — Black Ops One. */
export const DISPLAY = {
  regular: "BlackOpsOne_400Regular",
} as const;

const DARK_CHROME = {
  border: "rgba(62, 224, 198, 0.28)",
  borderSoft: "rgba(62, 224, 198, 0.16)",
  gridLine: "rgba(62, 224, 198, 0.06)",
  glowColor: DARK_COLORS.accent,
  glowOpacity: 0.55,
} as const;

const LIGHT_CHROME = {
  border: "rgba(10, 107, 95, 0.35)",
  borderSoft: "rgba(10, 107, 95, 0.18)",
  gridLine: "rgba(20, 26, 28, 0.06)",
  glowColor: LIGHT_COLORS.accent,
  glowOpacity: 0.22,
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
