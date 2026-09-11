import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import {
  applyColorScheme,
  TACTICAL_BORDER,
  TACTICAL_BORDER_SOFT,
  TACTICAL_COLORS,
  TACTICAL_GLOW,
  TACTICAL_GRID_LINE,
  type AppColorScheme,
  type ThemeColors,
} from "../constants/theme";

const SCHEME_KEY = "hercomColorScheme";

type ThemeContextValue = {
  scheme: AppColorScheme;
  colors: ThemeColors;
  border: string;
  borderSoft: string;
  gridLine: string;
  glow: typeof TACTICAL_GLOW;
  setScheme: (scheme: AppColorScheme) => Promise<void>;
  toggleScheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

async function loadStoredScheme(): Promise<AppColorScheme> {
  const stored = await SecureStore.getItemAsync(SCHEME_KEY);
  return stored === "light" ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setSchemeState] = useState<AppColorScheme>("dark");

  useEffect(() => {
    void (async () => {
      const stored = await loadStoredScheme();
      applyColorScheme(stored);
      setSchemeState(stored);
    })();
  }, []);

  const setScheme = useCallback(async (next: AppColorScheme) => {
    applyColorScheme(next);
    setSchemeState(next);
    await SecureStore.setItemAsync(SCHEME_KEY, next);
  }, []);

  const toggleScheme = useCallback(async () => {
    const next: AppColorScheme = scheme === "dark" ? "light" : "dark";
    await setScheme(next);
  }, [scheme, setScheme]);

  const value = useMemo(
    (): ThemeContextValue => ({
      scheme,
      colors: TACTICAL_COLORS,
      border: TACTICAL_BORDER,
      borderSoft: TACTICAL_BORDER_SOFT,
      gridLine: TACTICAL_GRID_LINE,
      glow: TACTICAL_GLOW,
      setScheme,
      toggleScheme,
    }),
    [scheme, setScheme, toggleScheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === null) {
    return {
      scheme: "dark",
      colors: TACTICAL_COLORS,
      border: TACTICAL_BORDER,
      borderSoft: TACTICAL_BORDER_SOFT,
      gridLine: TACTICAL_GRID_LINE,
      glow: TACTICAL_GLOW,
      setScheme: async () => undefined,
      toggleScheme: async () => undefined,
    };
  }
  return context;
}
