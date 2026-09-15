/** Paleta institucional Hercom — sobria, pocos acentos funcionales. */
export const HERCOM_COLORS = {
  /** Azul institucional — acento de marca en CTAs y estados activos. */
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

  success: "#15803D",
  successSoft: "#DCFCE7",
  warning: "#B45309",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",

  offline: "#334155",
  modeSwitch: "#0B70FE",
  mapFallback: "#E8EEF5",
} as const;

/**
 * ANA / Federal Standard — navy camo (base atmosférica).
 * El acento de interacción es siempre Hercom blue (#0B70FE).
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
  /** Barra superior navy (estilo Military Pay). */
  headerBg: string;
  headerText: string;
  headerMuted: string;
  /** Texto sobre botones azul Hercom. */
  onAccent: string;
  /** Banda de dato destacado (tarifa, saldo). */
  dataBandBg: string;
  dataBandText: string;
};

/** Claro — canvas + cabecera navy + cards blancas. */
export const LIGHT_COLORS: ThemeColors = {
  base: HERCOM_COLORS.canvas,
  baseElevated: "#FFFFFF",
  surface: HERCOM_COLORS.surface,
  surfaceSunken: HERCOM_COLORS.surfaceMuted,
  accent: HERCOM_COLORS.primary,
  accentDim: HERCOM_COLORS.primaryDark,
  steel: "#64748B",
  text: ANA.insigniaBlue,
  textStrong: HERCOM_COLORS.text,
  success: HERCOM_COLORS.success,
  warning: HERCOM_COLORS.warning,
  danger: HERCOM_COLORS.danger,
  headerBg: ANA.insigniaBlue,
  headerText: "#FFFFFF",
  headerMuted: "rgba(255, 255, 255, 0.72)",
  onAccent: "#FFFFFF",
  dataBandBg: ANA.instrumentBlack,
  dataBandText: "#FFFFFF",
};

/** Oscuro — hangar navy camo, acento Hercom blue. */
export const DARK_COLORS: ThemeColors = {
  base: ANA.aircraftSeaBlue,
  baseElevated: ANA.aircraftInsigniaBlue,
  surface: ANA.strataBlue,
  surfaceSunken: ANA.navyBlack,
  accent: HERCOM_COLORS.primary,
  accentDim: HERCOM_COLORS.primaryDark,
  steel: ANA.lightGray,
  text: ANA.aircraftWhite,
  textStrong: "#F6F5F2",
  success: "#3DDC84",
  warning: "#FFB020",
  danger: "#FF4D4D",
  headerBg: ANA.insigniaBlue,
  headerText: "#FFFFFF",
  headerMuted: "rgba(255, 255, 255, 0.68)",
  onAccent: "#FFFFFF",
  dataBandBg: ANA.instrumentBlack,
  dataBandText: "#FFFFFF",
};

/** Tokens vivos: `applyColorScheme` los muta para que la app se re-pinte. */
export const TACTICAL_COLORS: ThemeColors = { ...LIGHT_COLORS };

export let TACTICAL_BORDER = "rgba(27, 44, 74, 0.14)";
export let TACTICAL_BORDER_SOFT = "rgba(27, 44, 74, 0.08)";
export let TACTICAL_GRID_LINE = "rgba(27, 44, 74, 0.04)";

/** Radios sobrios — cards legibles, no chasis angular extremo. */
export const TACTICAL_RADIUS = {
  sharp: 6,
  panel: 8,
} as const;

/** Sin glow neón en botones. */
export const TACTICAL_GLOW = {
  shadowColor: "transparent",
  shadowOpacity: 0,
  shadowRadius: 0,
  shadowOffset: { width: 0, height: 0 },
  elevation: 0,
};

/**
 * Cuerpo UI — Rajdhani (condensada, legible).
 * El alias `POPPINS` se mantiene para no romper imports.
 */
export const POPPINS = {
  regular: "Rajdhani_400Regular",
  medium: "Rajdhani_500Medium",
  semibold: "Rajdhani_600SemiBold",
  bold: "Rajdhani_700Bold",
} as const;

/** Solo cifras, montos y códigos. */
export const MONO = {
  regular: "ShareTechMono_400Regular",
  medium: "ShareTechMono_400Regular",
  bold: "ShareTechMono_400Regular",
} as const;

/** @deprecated Ya no se usa Black Ops; alias a bold Rajdhani. */
export const DISPLAY = {
  regular: "Rajdhani_700Bold",
} as const;

const DARK_CHROME = {
  border: "rgba(107, 132, 184, 0.22)",
  borderSoft: "rgba(107, 132, 184, 0.12)",
  gridLine: "rgba(107, 132, 184, 0.04)",
  glowColor: "transparent",
  glowOpacity: 0,
} as const;

const LIGHT_CHROME = {
  border: "rgba(27, 44, 74, 0.14)",
  borderSoft: "rgba(27, 44, 74, 0.08)",
  gridLine: "rgba(27, 44, 74, 0.04)",
  glowColor: "transparent",
  glowOpacity: 0,
} as const;

export function applyColorScheme(scheme: AppColorScheme): void {
  const next = scheme === "light" ? LIGHT_COLORS : DARK_COLORS;
  const chrome = scheme === "light" ? LIGHT_CHROME : DARK_CHROME;
  Object.assign(TACTICAL_COLORS, next);
  TACTICAL_BORDER = chrome.border;
  TACTICAL_BORDER_SOFT = chrome.borderSoft;
  TACTICAL_GRID_LINE = chrome.gridLine;
  TACTICAL_GLOW.shadowColor = chrome.glowColor;
  TACTICAL_GLOW.shadowOpacity = chrome.glowOpacity;
  TACTICAL_GLOW.elevation = 0;
}

applyColorScheme("light");

export { DARK_COLORS as TACTICAL_DARK_COLORS };
