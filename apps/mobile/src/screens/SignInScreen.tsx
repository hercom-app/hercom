import { useEffect, useRef, useState } from "react";
import { Animated, Image, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { LegalDocumentModal } from "../components/LegalDocumentModal";
import { OpsHudBackdrop } from "../components/OpsHudBackdrop";
import {
  HudCorners,
  TacticalLabel,
  TacticalScreen,
  TacticalStatus,
  TacticalText,
} from "../components/tactical";
import { PRIVACY_POLICY, TERMS_OF_USE } from "../constants/legalCopy";
import {
  DISPLAY,
  HERCOM_COLORS,
  MONO,
} from "../constants/theme";
import { ThemeToggle } from "../components/ThemeToggle";

/** Login HUD: marca Hercom de la landing + consola táctica tipo ops. */
export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<"terms" | "privacy" | null>(null);
  const panelBg = "rgba(14, 18, 26, 0.92)";
  const panelBorder = "rgba(11, 112, 254, 0.55)";

  return (
    <TacticalScreen grid={false}>
      <StatusBar style="light" />
      <OpsHudBackdrop forceScheme="dark" />

      <View
        className="flex-row items-center gap-3 px-5"
        style={{ paddingTop: insets.top + 10 }}
      >
        <View
          className="h-11 w-11 items-center justify-center overflow-hidden"
          style={{
            backgroundColor: HERCOM_COLORS.primary,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              fontFamily: DISPLAY.regular,
              fontSize: 18,
              color: "#FFFFFF",
            }}
          >
            H
          </Text>
        </View>
        <View className="flex-1">
          <TacticalLabel size={9} tone="accent" style={{ color: "#7EB6FF" }}>
            Unidad Lima
          </TacticalLabel>
          <TacticalLabel size={9} style={{ color: "#8B9BB0" }}>
            Lat -12.046 · Lon -77.043
          </TacticalLabel>
        </View>
        <ThemeToggle compact />
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <View className="items-center" style={{ width: 204 }}>
          <View
            className="overflow-hidden"
            style={{
              width: 204,
              backgroundColor: HERCOM_COLORS.primary,
              borderRadius: 22,
              paddingVertical: 18,
              paddingHorizontal: 16,
            }}
          >
            <Image
              source={require("../../assets/images/hercom-logo.png")}
              style={{ width: 172, height: 172 }}
              resizeMode="contain"
              accessibilityLabel="Hercom"
            />
          </View>
          <HudCorners color="#FFFFFF" size={16} thickness={2} opacity={0.9} />
        </View>

        <View className="mt-5 flex-row items-center gap-2">
          <LiveDot />
          <TacticalStatus label="Link seguro" tone="success" />
          <TacticalStatus label="Ops online" tone="active" />
        </View>
      </View>

      <View className="px-5" style={{ paddingBottom: insets.bottom + 18 }}>
        <View
          className="px-5 py-5"
          style={{
            backgroundColor: panelBg,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: panelBorder,
          }}
        >
          <HudCorners
            color={HERCOM_COLORS.primary}
            size={12}
            thickness={1.5}
            opacity={0.9}
          />
          <TacticalLabel tone="accent" size={9} style={{ color: "#7EB6FF" }}>
            Acceso
          </TacticalLabel>
          <Text
            className="mt-1.5 mb-1"
            style={{
              fontFamily: DISPLAY.regular,
              fontSize: 18,
              letterSpacing: 0.6,
              color: "#F4F7FB",
            }}
          >
            BIENVENIDO A HERCOM
          </Text>
          <TacticalText size={12} className="mb-4" style={{ color: "#B7C5D6" }}>
            Ingresá para continuar.
          </TacticalText>

          <GoogleSignInButton
            variant="ops"
            label="Ingresar con Google"
            onError={(message) => setError(message)}
          />

          {error !== null && (
            <Text
              className="mt-3 text-center text-xs"
              style={{ fontFamily: MONO.medium, color: "#FF6B6B" }}
            >
              {error}
            </Text>
          )}

          <TacticalText size={11} className="mt-4 text-center" style={{ color: "#8B9BB0" }}>
            Al unirte aceptas nuestros{" "}
            <Text
              style={{ color: HERCOM_COLORS.primary, fontFamily: MONO.medium }}
              onPress={() => setLegalDoc("terms")}
            >
              Términos de Uso
            </Text>{" "}
            y{" "}
            <Text
              style={{ color: HERCOM_COLORS.primary, fontFamily: MONO.medium }}
              onPress={() => setLegalDoc("privacy")}
            >
              Política de Privacidad
            </Text>
            .
          </TacticalText>
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

function LiveDot() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 780,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 780,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        opacity,
        width: 7,
        height: 7,
        borderRadius: 1,
        backgroundColor: HERCOM_COLORS.primary,
      }}
    />
  );
}
