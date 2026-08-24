import { useEffect } from "react";
import { BackHandler } from "react-native";

/**
 * Intercepta el botón atrás de Android.
 * Si `onBack` retorna true, consume el evento (no sale de la app).
 */
export function useAndroidBackHandler(onBack: () => boolean) {
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBack,
    );
    return () => subscription.remove();
  }, [onBack]);
}
