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

/**
 * ANA / Federal Standard — navy táctico.
 * Claro = Aircraft White + Blue. Oscuro = Insignia / Sea / Strata.
 */
export const ANA = {
  aircraftWhite: "#EDECEA",
  azureBlue: "#6B84B8",
  engineGray: "#4A4C4E",
  navyBlack: "#1C1E22",
  insigniaBlue: "#1B2C4A",
  lightGray: "#B0B2B5",
  blue: "#1A4F8C",
  seaBlue: "#3A4654",
  aircraftSeaBlue: "#1A2433",
  instrumentBlack: "#0E0F11",
  navyBlue: "#3D4E5C",
  gunshipGray: "#5A5C60",
  aircraftInsigniaBlue: "#3A4554",
  strataBlue: "#163044",
  black: "#080808",
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

/** Oscuro — hangar nocturno: negro instrumento, insignia y azure de lectura. */
export const DARK_COLORS: ThemeColors = {
  base: ANA.instrumentBlack,
  baseElevated: ANA.navyBlack,
  surface: ANA.aircraftSeaBlue,
  surfaceSunken: ANA.strataBlue,
  accent: ANA.azureBlue,
  accentDim: ANA.blue,
  steel: ANA.lightGray,
  text: ANA.aircraftWhite,
  textStrong: "#F6F5F2",
  success: "#3DDC84",
  warning: "#FFB020",
  danger: "#FF4D4D",
};

/** Claro — briefing diurno: papel aircraft white, tinta insignia, acento Blue ANA. */
export const LIGHT_COLORS: ThemeColors = {
  base: ANA.aircraftWhite,
  baseElevated: "#F7F6F4",
  surface: "#FFFFFF",
  surfaceSunken: "#D9D7D3",
  accent: ANA.blue,
  accentDim: ANA.insigniaBlue,
  steel: ANA.navyBlue,
  text: ANA.insigniaBlue,
  textStrong: ANA.navyBlack,
  success: "#157A3C",
  warning: "#B45309",
  danger: "#C81E1E",
};

/** Tokens vivos: `applyColorScheme` los muta para que la app se re-pinte. */
export const TACTICAL_COLORS: ThemeColors = { ...LIGHT_COLORS };

/** Bordes de 1px en navy con opacidad baja. */
export let TACTICAL_BORDER = "rgba(26, 79, 140, 0.32)";
export let TACTICAL_BORDER_SOFT = "rgba(26, 79, 140, 0.16)";
export let TACTICAL_GRID_LINE = "rgba(27, 44, 74, 0.07)";

/** Radios casi nulos: chasis de consola, no card de producto. */
export const TACTICAL_RADIUS = {
  sharp: 1,
  panel: 2,
} as const;

/** Glow del acento para estados activos. */
export const TACTICAL_GLOW = {
  shadowColor: LIGHT_COLORS.accent,
  shadowOpacity: 0.22,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 0 },
  elevation: 3,
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
  border: "rgba(107, 132, 184, 0.38)",
  borderSoft: "rgba(107, 132, 184, 0.18)",
  gridLine: "rgba(107, 132, 184, 0.08)",
  glowColor: DARK_COLORS.accent,
  glowOpacity: 0.4,
} as const;

const LIGHT_CHROME = {
  border: "rgba(26, 79, 140, 0.32)",
  borderSoft: "rgba(26, 79, 140, 0.16)",
  gridLine: "rgba(27, 44, 74, 0.07)",
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

applyColorScheme("light");

/** Alias histórico: el HUD actual es el modo oscuro. */
export { DARK_COLORS as TACTICAL_DARK_COLORS };
