import { useEffect } from "react";
import * as Updates from "expo-updates";

/**
 * Al abrir la app (build nativo con EAS Update), busca y aplica el bundle
 * publicado en el canal del build (p. ej. production).
 */
export function useEasUpdate() {
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) {
      return;
    }
    void (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
        // Sin red o build sin canal: la app sigue con el bundle embebido.
      }
    })();
  }, []);
}
