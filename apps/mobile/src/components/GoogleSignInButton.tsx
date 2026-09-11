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
import {
  HERCOM_COLORS,
  MONO,
  TACTICAL_BORDER,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";

WebBrowser.maybeCompleteAuthSession();

type GoogleSignInButtonProps = {
  disabled?: boolean;
  label?: string;
  onError?: (message: string) => void;
  /** `tactical` es ghost HUD; `ops` es CTA lleno (login tipo CoD). */
  variant?: "light" | "tactical" | "ops";
};

function getRedirectTo(): string {
  return Linking.createURL("/");
}

/** Marca Google (cuatro colores) en un cuadrado pequeño. */
function GoogleGlyph() {
  return (
    <View className="mr-3 h-6 w-6 overflow-hidden rounded-full bg-white">
      <View className="flex-1 flex-row flex-wrap">
        <View className="h-3 w-3 bg-[#EA4335]" />
        <View className="h-3 w-3 bg-[#FBBC05]" />
        <View className="h-3 w-3 bg-[#34A853]" />
        <View className="h-3 w-3 bg-[#4285F4]" />
      </View>
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-[13px] font-bold text-slate-800">G</Text>
      </View>
    </View>
  );
}

/** OAuth con Google en React Native (abre navegador in-app y completa el código). */
export function GoogleSignInButton({
  disabled = false,
  label = "Continuar con Google",
  onError,
  variant = "light",
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

  if (variant === "ops") {
    return (
      <TouchableOpacity
        onPress={() => void handlePress()}
        disabled={disabled || submitting}
        activeOpacity={0.82}
        className="h-14 flex-row items-center justify-center disabled:opacity-60"
        style={{
          backgroundColor: HERCOM_COLORS.primary,
          borderRadius: 12,
          shadowColor: HERCOM_COLORS.primary,
          shadowOpacity: 0.45,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
        }}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <GoogleGlyph />
            <Text
              style={{
                fontFamily: MONO.bold,
                fontSize: 13,
                letterSpacing: 1.6,
                color: "#FFFFFF",
              }}
            >
              {label.toUpperCase()}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === "tactical") {
    return (
      <TouchableOpacity
        onPress={() => void handlePress()}
        disabled={disabled || submitting}
        activeOpacity={0.75}
        className="h-14 flex-row items-center justify-center disabled:opacity-60"
        style={{
          backgroundColor: TACTICAL_COLORS.surfaceSunken,
          borderRadius: TACTICAL_RADIUS.sharp,
          borderWidth: 1,
          borderColor: TACTICAL_BORDER,
        }}
      >
        {submitting ? (
          <ActivityIndicator color={TACTICAL_COLORS.accent} />
        ) : (
          <>
            <GoogleGlyph />
            <Text
              style={{
                fontFamily: MONO.bold,
                fontSize: 12,
                letterSpacing: 1.8,
                color: TACTICAL_COLORS.text,
              }}
            >
              {label.toUpperCase()}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => void handlePress()}
      disabled={disabled || submitting}
      activeOpacity={0.85}
      className="h-14 flex-row items-center justify-center rounded-2xl border border-slate-200 bg-white disabled:opacity-60"
      style={{
        shadowColor: "#0F172A",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      {submitting ? (
        <ActivityIndicator color="#0B70FE" />
      ) : (
        <>
          <GoogleGlyph />
          <Text className="text-base font-semibold text-slate-800">{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
