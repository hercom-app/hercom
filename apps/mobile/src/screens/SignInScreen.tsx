import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { LegalDocumentModal } from "../components/LegalDocumentModal";
import { SignInScreenBackground } from "../components/SignInScreenBackground";
import { PRIVACY_POLICY, TERMS_OF_USE } from "@proyecto/legal";
import { HERCOM_COLORS, POPPINS } from "../constants/theme";

const MARK_ASPECT = 377 / 446;

/** La tarjeta arranca al 37% del alto y monta sobre el borde de la franja azul. */
const CARD_TOP_RATIO = 0.37;

/**
 * Portada al estilo de `apps/landing-page/assets/splash.jpg`: mapa azul arriba,
 * nube Hercom, tarjeta blanca sobre el borde y gris abajo.
 */
export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [error, setError] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<"terms" | "privacy" | null>(null);
  const [sheetInteractive, setSheetInteractive] = useState(false);

  const markWidth = Math.min(width * 0.34, 160);
  const headerHeight = Math.max(height * CARD_TOP_RATIO, insets.top + markWidth * MARK_ASPECT + 48);

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

      <View
        className="items-center justify-center"
        style={{ height: headerHeight, paddingTop: insets.top }}
      >
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ translateY: logoLift }, { scale: logoScale }],
          }}
        >
          <Image
            source={require("../../assets/images/hercom-mark.png")}
            style={{ width: markWidth, height: markWidth * MARK_ASPECT }}
            resizeMode="contain"
            accessibilityLabel="Hercom"
          />
        </Animated.View>
      </View>

      <Animated.View
        pointerEvents={sheetInteractive ? "auto" : "none"}
        style={{
          opacity: sheetOpacity,
          transform: [{ translateY: sheetY }],
          paddingHorizontal: 18,
          paddingBottom: Math.max(insets.bottom, 12) + 8,
        }}
      >
        <View style={styles.card}>
          <Text
            className="text-center"
            style={{
              fontFamily: POPPINS.semibold,
              fontSize: 20,
              color: HERCOM_COLORS.text,
            }}
          >
            Bienvenidos a HERCOM
          </Text>
          <Text
            className="mb-6 mt-2 text-center"
            style={{
              fontFamily: POPPINS.regular,
              fontSize: 14,
              color: HERCOM_COLORS.textMuted,
              lineHeight: 20,
            }}
          >
            Ingresa con tu cuenta de Google para usar la app
          </Text>
          <GoogleSignInButton
            variant="splash"
            label="Ingresar con Google"
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
          className="mt-5 text-center"
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
});
