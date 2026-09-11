import { useState } from "react";
import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { HercomLogo } from "../components/HercomLogo";
import { LegalDocumentModal } from "../components/LegalDocumentModal";
import {
  HudCorners,
  TacticalDivider,
  TacticalLabel,
  TacticalPanel,
  TacticalScreen,
  TacticalStatus,
  TacticalText,
} from "../components/tactical";
import { PRIVACY_POLICY, TERMS_OF_USE } from "../constants/legalCopy";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAppTheme } from "../contexts/ThemeContext";

/** Ingreso al sistema: cabecera de marca + panel de acceso estilo HUD. */
export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { scheme, colors } = useAppTheme();
  const [error, setError] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<"terms" | "privacy" | null>(null);

  return (
    <TacticalScreen>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View
        className="flex-row items-center justify-between px-5"
        style={{ paddingTop: insets.top + 12 }}
      >
        <TacticalLabel size={10}>Hercom · Ops</TacticalLabel>
        <TacticalStatus label="Enlace seguro" tone="active" />
      </View>
      <View className="px-5 pt-3">
        <ThemeToggle compact />
      </View>

      <View className="flex-1 items-center justify-center px-5">
        <View className="relative items-center px-8 py-6">
          <HudCorners size={16} opacity={0.5} />
          <HercomLogo width={190} />
        </View>
        <TacticalLabel className="mt-5" size={10}>
          Choferes de reemplazo
        </TacticalLabel>
      </View>

      <View className="px-5" style={{ paddingBottom: insets.bottom + 20 }}>
        <TacticalPanel corners>
          <TacticalLabel tone="accent" className="mb-4">
            Acceso
          </TacticalLabel>

          <GoogleSignInButton
            variant="tactical"
            label="Continuar con Google"
            onError={(message) => setError(message)}
          />

          {error !== null && (
            <Text
              className="mt-3 text-center text-xs"
              style={{ color: colors.danger }}
            >
              {error}
            </Text>
          )}

          <TacticalDivider label="Legal" />

          <TacticalText size={11} className="text-center">
            Al unirte aceptas nuestros{" "}
            <Text
              style={{ color: colors.accent }}
              onPress={() => setLegalDoc("terms")}
            >
              Términos de Uso
            </Text>{" "}
            y{" "}
            <Text
              style={{ color: colors.accent }}
              onPress={() => setLegalDoc("privacy")}
            >
              Política de Privacidad
            </Text>
            .
          </TacticalText>
        </TacticalPanel>
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
