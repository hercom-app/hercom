import { useState } from "react";
import { Image, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { LegalDocumentModal } from "../components/LegalDocumentModal";
import { OpsHudBackdrop } from "../components/OpsHudBackdrop";
import { TacticalScreen, TacticalText, TacticalTitle } from "../components/tactical";
import { PRIVACY_POLICY, TERMS_OF_USE } from "../constants/legalCopy";
import { HERCOM_COLORS, POPPINS } from "../constants/theme";
import { ThemeToggle } from "../components/ThemeToggle";

/** Login institucional: navy camo + card blanca + azul Hercom. */
export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<"terms" | "privacy" | null>(null);

  return (
    <TacticalScreen>
      <StatusBar style="light" />
      <OpsHudBackdrop forceScheme="dark" />

      <View
        className="flex-row items-center justify-end px-5"
        style={{ paddingTop: insets.top + 8 }}
      >
        <ThemeToggle compact />
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <View
          className="items-center overflow-hidden"
          style={{
            width: 200,
            backgroundColor: HERCOM_COLORS.primary,
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 14,
          }}
        >
          <Image
            source={require("../../assets/images/hercom-logo.png")}
            style={{ width: 168, height: 168 }}
            resizeMode="contain"
            accessibilityLabel="Hercom"
          />
        </View>
        <Text
          className="mt-4 text-center"
          style={{
            fontFamily: POPPINS.semibold,
            fontSize: 13,
            letterSpacing: 2,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          CHOFER PARA REEMPLAZO
        </Text>
      </View>

      <View className="px-5" style={{ paddingBottom: insets.bottom + 20 }}>
        <View
          className="px-5 py-5"
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(27, 44, 74, 0.12)",
          }}
        >
          <TacticalTitle size={20} style={{ color: ANA_TITLE }}>
            Inicia sesión
          </TacticalTitle>
          <TacticalText size={14} className="mb-4 mt-1" style={{ color: "#64748B" }}>
            Ingresa para continuar con tu cuenta.
          </TacticalText>

          <GoogleSignInButton
            variant="ops"
            label="Continuar con Google"
            onError={(message) => setError(message)}
          />

          {error !== null && (
            <Text
              className="mt-3 text-center text-sm"
              style={{ fontFamily: POPPINS.medium, color: HERCOM_COLORS.danger }}
            >
              {error}
            </Text>
          )}

          <Text
            className="mt-4 text-center text-xs leading-5"
            style={{ fontFamily: POPPINS.regular, color: "#64748B" }}
          >
            Al unirte aceptas nuestros{" "}
            <Text
              style={{ color: HERCOM_COLORS.primary, fontFamily: POPPINS.semibold }}
              onPress={() => setLegalDoc("terms")}
            >
              Términos de Uso
            </Text>{" "}
            y{" "}
            <Text
              style={{ color: HERCOM_COLORS.primary, fontFamily: POPPINS.semibold }}
              onPress={() => setLegalDoc("privacy")}
            >
              Política de Privacidad
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
    </TacticalScreen>
  );
}

const ANA_TITLE = "#1B2C4A";
