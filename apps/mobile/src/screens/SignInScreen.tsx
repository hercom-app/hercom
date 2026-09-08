import { useState } from "react";
import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { HercomLogo } from "../components/HercomLogo";
import { LegalDocumentModal } from "../components/LegalDocumentModal";
import { PRIVACY_POLICY, TERMS_OF_USE } from "../constants/legalCopy";

const LOGIN_CARD_SHADOW = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.05,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

/**
 * Ingreso: marca en cabecera azul, panel inferior mínimo (solo card + legal).
 */
export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<"terms" | "privacy" | null>(null);

  return (
    <View className="flex-1 bg-hercom">
      <StatusBar style="light" />

      <View
        className="flex-1 items-center justify-center"
        style={{ paddingTop: insets.top + 16, paddingBottom: 24 }}
      >
        <HercomLogo width={200} />
      </View>

      <View
        className="overflow-hidden rounded-t-[28px] bg-canvas px-6 pt-6"
        style={{
          marginTop: -20,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <View
          className="rounded-3xl border border-slate-100 bg-white px-5 pb-5 pt-6"
          style={LOGIN_CARD_SHADOW}
        >
          <Text className="mb-5 text-center text-lg font-bold text-slate-900">
            Inicia sesión
          </Text>
          <GoogleSignInButton
            label="Continuar con Google"
            onError={(message) => setError(message)}
          />
          {error !== null && (
            <Text className="mt-3 text-center text-sm text-red-600">{error}</Text>
          )}
        </View>

        <Text className="mt-4 text-center text-[12px] leading-5 text-slate-500">
          Al unirte a nuestra aplicación, aceptas nuestros{" "}
          <Text
            className="font-semibold text-slate-800 underline"
            onPress={() => setLegalDoc("terms")}
          >
            Términos de Uso
          </Text>{" "}
          y{" "}
          <Text
            className="font-semibold text-slate-800 underline"
            onPress={() => setLegalDoc("privacy")}
          >
            Política de Privacidad
          </Text>
          .
        </Text>
      </View>

      <LegalDocumentModal
        visible={legalDoc === "terms"}
        title={TERMS_OF_USE.title}
        body={TERMS_OF_USE.body}
        onClose={() => setLegalDoc(null)}
      />
      <LegalDocumentModal
        visible={legalDoc === "privacy"}
        title={PRIVACY_POLICY.title}
        body={PRIVACY_POLICY.body}
        onClose={() => setLegalDoc(null)}
      />
    </View>
  );
}
