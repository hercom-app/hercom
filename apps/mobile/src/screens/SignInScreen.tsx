import { useState } from "react";
import { Image, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { LegalDocumentModal } from "../components/LegalDocumentModal";
import { PRIVACY_POLICY, TERMS_OF_USE } from "../constants/legalCopy";
import { HERCOM_COLORS, POPPINS, TYPE } from "../constants/theme";

/** Login — fondo blanco fijo, logo centrado, Google abajo. */
export function SignInScreen() {
  const [error, setError] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<"terms" | "privacy" | null>(null);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />

      <View className="flex-1 px-6">
        <View className="flex-1 items-center justify-center">
          <Image
            source={require("../../assets/images/icon.png")}
            style={{ width: 120, height: 120 }}
            resizeMode="contain"
            accessibilityLabel="Hercom"
          />
        </View>

        <View className="pb-6">
          <GoogleSignInButton
            variant="consumer"
            label="Continuar con Google"
            onError={(message) => setError(message)}
          />

          {error !== null && (
            <Text
              className="mt-4 text-center"
              style={{
                fontFamily: POPPINS.medium,
                fontSize: TYPE.caption,
                color: HERCOM_COLORS.danger,
              }}
            >
              {error}
            </Text>
          )}

          <Text
            className="mt-5 text-center"
            style={{
              fontFamily: POPPINS.regular,
              fontSize: TYPE.caption,
              color: HERCOM_COLORS.textMuted,
              lineHeight: 22,
            }}
          >
            Al continuar aceptas nuestros{" "}
            <Text
              style={{ color: HERCOM_COLORS.primary, fontFamily: POPPINS.semibold }}
              onPress={() => setLegalDoc("terms")}
            >
              Términos
            </Text>{" "}
            y{" "}
            <Text
              style={{ color: HERCOM_COLORS.primary, fontFamily: POPPINS.semibold }}
              onPress={() => setLegalDoc("privacy")}
            >
              Privacidad
            </Text>
            .
          </Text>
        </View>
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
    </SafeAreaView>
  );
}
