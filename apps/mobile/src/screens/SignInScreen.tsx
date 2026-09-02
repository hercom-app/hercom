import { useState } from "react";
import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { HercomLogo } from "../components/HercomLogo";
import { LegalDocumentModal } from "../components/LegalDocumentModal";
import { CARD_SHADOW } from "../components/ui";
import { PRIVACY_POLICY, TERMS_OF_USE } from "../constants/legalCopy";

/**
 * Ingreso: marca en cabecera azul, acción en card blanca.
 */
export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<"terms" | "privacy" | null>(null);

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="light" />
      <View
        className="flex-1 items-center justify-center bg-hercom"
        style={{ paddingTop: insets.top + 16 }}
      >
        <HercomLogo width={200} />
      </View>

      <View
        className="-mt-6 rounded-t-[32px] bg-canvas px-6 pt-8"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        <View
          className="rounded-3xl bg-white p-5"
          style={CARD_SHADOW}
        >
          <Text className="mb-1 text-center text-lg font-bold text-slate-900">
            Inicia sesión
          </Text>
          <Text className="mb-5 text-center text-sm text-slate-500">
            Chofer para remplazo
          </Text>
          <GoogleSignInButton
            label="Continuar con Google"
            onError={(message) => setError(message)}
          />
          {error !== null && (
            <Text className="mt-3 text-center text-sm text-red-600">{error}</Text>
          )}
        </View>

        <Text className="mt-5 text-center text-[12px] leading-5 text-slate-500">
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
