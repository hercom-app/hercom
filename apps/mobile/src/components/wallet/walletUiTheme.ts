import { HERCOM_COLORS, POPPINS, TYPE } from "../../constants/theme";
import { useAppTheme } from "../../contexts/ThemeContext";

/**
 * Saldo / recarga — mismo layout Yango; colores = tema global (useAppTheme).
 */
export type WalletTheme = {
  bg: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textMuted: string;
  textDim: string;
  ctaBg: string;
  ctaText: string;
  pillBg: string;
  actionCircleBg: string;
  izipayRed: string;
  creditText: string;
};

export const WALLET_TYPE = {
  balanceHero: 40,
  screenTitle: TYPE.title,
  sectionTitle: TYPE.bodyLg,
  body: TYPE.body,
  caption: TYPE.caption,
  amountInput: 36,
} as const;

export const WALLET_FONT = POPPINS;

export function useWalletTheme(): WalletTheme {
  const { colors, border } = useAppTheme();

  return {
    bg: colors.base,
    surface: colors.surface,
    surfaceElevated: colors.baseElevated,
    border,
    text: colors.textStrong,
    textMuted: colors.steel,
    textDim: colors.text,
    ctaBg: colors.accent,
    ctaText: colors.onAccent,
    pillBg: colors.dataBandBg,
    actionCircleBg: colors.surfaceSunken,
    izipayRed: "#E4002B",
    creditText: colors.success,
  };
}

/** @deprecated Usar colors.base del tema. */
export const WALLET_LIGHT_CANVAS = HERCOM_COLORS.canvas;
