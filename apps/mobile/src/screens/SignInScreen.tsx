import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { LegalDocumentModal } from "../components/LegalDocumentModal";
import {
  SIGN_IN_LAYOUT_FLEX,
  SignInScreenBackground,
} from "../components/SignInScreenBackground";
import { PRIVACY_POLICY, TERMS_OF_USE } from "@proyecto/legal";
import { HERCOM_COLORS, POPPINS } from "../constants/theme";

const LOGO_WIDTH = 228;
const LOGO_HEIGHT = Math.round(LOGO_WIDTH * (620 / 561));

/**
 * Portada al estilo splash comercial: mapa/autopistas arriba, gris abajo,
 * logo animado y tarjeta de acceso.
 */
export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<"terms" | "privacy" | null>(null);
  const [sheetInteractive, setSheetInteractive] = useState(false);

  const logoScale = useRef(new Animated.Value(0.2)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoLift = useRef(new Animated.Value(64)).current;
  const sheetY = useRef(new Animated.Value(280)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    const animation = Animated.sequence([
      Animated.delay(160),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          speed: 12,
          bounciness: 9,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(320),
      Animated.parallel([
        Animated.spring(logoLift, {
          toValue: 0,
          speed: 12,
          bounciness: 4,
          useNativeDriver: true,
        }),
        Animated.timing(sheetY, {
          toValue: 0,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sheetOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (active && finished) {
        setSheetInteractive(true);
      }
    });

    return () => {
      active = false;
      animation.stop();
    };
  }, [logoLift, logoOpacity, logoScale, sheetOpacity, sheetY]);

  return (
    <View className="flex-1">
      <SignInScreenBackground />

      <View className="flex-1" style={styles.content}>
        <View
          className="items-center justify-center"
          style={{
            flex: SIGN_IN_LAYOUT_FLEX.hero,
            paddingTop: insets.top,
          }}
        >
          <Animated.View
            style={{
              opacity: logoOpacity,
              transform: [{ translateY: logoLift }, { scale: logoScale }],
            }}
          >
            <Image
              source={require("../../assets/images/hercom-logo.png")}
              style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT }}
              resizeMode="contain"
              accessibilityLabel="Hercom, chofer para remplazo"
            />
          </Animated.View>
        </View>

        <Animated.View
          pointerEvents={sheetInteractive ? "auto" : "none"}
          style={{
            flex: SIGN_IN_LAYOUT_FLEX.lower,
            opacity: sheetOpacity,
            transform: [{ translateY: sheetY }],
            marginTop: -36,
            paddingHorizontal: 18,
            paddingBottom: Math.max(insets.bottom, 12) + 8,
          }}
        >
          <View style={styles.loginCard}>
            <Text
              className="mb-1 text-center"
              style={{
                fontFamily: POPPINS.semibold,
                fontSize: 20,
                color: HERCOM_COLORS.text,
              }}
            >
              Bienvenidos a HERCOM
            </Text>
            <Text
              className="mb-5 text-center"
              style={{
                fontFamily: POPPINS.regular,
                fontSize: 14,
                color: HERCOM_COLORS.textMuted,
                lineHeight: 20,
              }}
            >
              Continúa con tu cuenta de Google para ingresar a la app.
            </Text>
            <GoogleSignInButton
              variant="welcome"
              label="Continuar con Google"
              onError={(message) => setError(message)}
            />
          </View>

          {error !== null && (
            <Text
              className="mt-3 text-center"
              style={{
                fontFamily: POPPINS.medium,
                fontSize: 14,
                color: HERCOM_COLORS.danger,
              }}
            >
              {error}
            </Text>
          )}

          <Text
            className="mt-4 text-center"
            style={{
              fontFamily: POPPINS.regular,
              fontSize: 13,
              color: HERCOM_COLORS.textSecondary,
              lineHeight: 18,
            }}
          >
            Al unirte a nuestra aplicación, aceptas nuestros{" "}
            <Text
              style={{
                fontFamily: POPPINS.medium,
                color: HERCOM_COLORS.text,
                textDecorationLine: "underline",
              }}
              onPress={() => setLegalDoc("terms")}
            >
              Términos de Uso
            </Text>
            {" y "}
            <Text
              style={{
                fontFamily: POPPINS.medium,
                color: HERCOM_COLORS.text,
                textDecorationLine: "underline",
              }}
              onPress={() => setLegalDoc("privacy")}
            >
              Política de Privacidad
            </Text>
            .
          </Text>
        </Animated.View>
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

const styles = StyleSheet.create({
  content: {
    zIndex: 1,
  },
  loginCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
});