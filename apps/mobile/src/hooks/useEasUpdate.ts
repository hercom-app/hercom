import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import * as Updates from "expo-updates";

async function tryApplyEasUpdate(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) {
    return;
  }
  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) {
      return;
    }
    const fetchResult = await Updates.fetchUpdateAsync();
    if (fetchResult.isNew) {
      await Updates.reloadAsync();
    }
  } catch {
    // Sin red o build sin canal: la app sigue con el bundle embebido.
  }
}

/**
 * Al abrir la app (build nativo con EAS Update), busca y aplica el bundle
 * publicado en el canal del build (p. ej. production). También al volver de
 * segundo plano.
 */
export function useEasUpdate() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    void tryApplyEasUpdate();

    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        next === "active"
      ) {
        void tryApplyEasUpdate();
      }
      appState.current = next;
    });

    return () => sub.remove();
  }, []);
}
