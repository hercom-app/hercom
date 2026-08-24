import { useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { HercomLogo } from "../components/HercomLogo";
import { LegalDocumentModal } from "../components/LegalDocumentModal";
import { PRIVACY_POLICY, TERMS_OF_USE } from "../constants/legalCopy";

/**
 * Ingreso único (estilo inDrive / Yango): Continuar con Google + legales.
 */
export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<"terms" | "privacy" | null>(null);

  return (
    <View
      className="flex-1 bg-hercom px-6"
      style={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 20,
      }}
    >
      <View className="flex-1 items-center justify-center">
        <HercomLogo width={220} />
        <Text className="mt-6 text-center text-base text-white/90">
          Chofer para remplazo
        </Text>
      </View>

      <View className="w-full">
        <GoogleSignInButton
          label="Continuar con Google"
          onError={(message) => setError(message)}
        />

        {error !== null && (
          <View className="mt-3 rounded-xl bg-white/15 px-3 py-2">
            <Text className="text-center text-sm text-white">{error}</Text>
          </View>
        )}

        <Text className="mt-5 text-center text-[12px] leading-5 text-white/85">
          Al unirte a nuestra aplicación, aceptas nuestros{" "}
          <Text
            className="font-semibold text-white underline"
            onPress={() => setLegalDoc("terms")}
          >
            Términos de Uso
          </Text>{" "}
          y{" "}
          <Text
            className="font-semibold text-white underline"
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
