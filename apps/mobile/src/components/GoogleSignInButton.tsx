import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useAuthActions } from "@convex-dev/auth/react";

WebBrowser.maybeCompleteAuthSession();

type GoogleSignInButtonProps = {
  disabled?: boolean;
  label?: string;
  onError?: (message: string) => void;
};

function getRedirectTo(): string {
  // Expo Go: exp://…; build nativo: choferes:// (scheme en app.json).
  return Linking.createURL("/");
}

/** OAuth con Google en React Native (abre navegador in-app y completa el código). */
export function GoogleSignInButton({
  disabled = false,
  label = "Continuar con Google",
  onError,
}: GoogleSignInButtonProps) {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);

  async function handlePress() {
    if (disabled || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      const redirectTo = getRedirectTo();
      const { redirect } = await signIn("google", { redirectTo });

      if (Platform.OS === "web") {
        return;
      }

      if (redirect === undefined) {
        onError?.("No se pudo iniciar el flujo con Google.");
        return;
      }

      const browserResult = await WebBrowser.openAuthSessionAsync(
        redirect.toString(),
        redirectTo,
      );

      if (browserResult.type === "success") {
        const code = new URL(browserResult.url).searchParams.get("code");
        if (code === null) {
          onError?.("Google no devolvió un código de autorización.");
          return;
        }
        await signIn("google", { code });
        return;
      }

      if (browserResult.type !== "cancel") {
        onError?.("No se pudo completar la autorización con Google.");
      }
    } catch {
      onError?.("No se pudo iniciar sesión con Google.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <TouchableOpacity
      onPress={() => void handlePress()}
      disabled={disabled || submitting}
      className="flex-row items-center justify-center rounded-2xl border border-slate-200 bg-white py-3.5 active:bg-slate-50 disabled:opacity-60"
    >
      {submitting ? (
        <ActivityIndicator color="#007AFF" />
      ) : (
        <>
          <View className="mr-2 h-5 w-5 items-center justify-center rounded-full bg-slate-100">
            <Text className="text-xs font-bold text-slate-700">G</Text>
          </View>
          <Text className="text-base font-semibold text-slate-800">{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
