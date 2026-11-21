import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { LegalDocumentModal } from "../components/LegalDocumentModal";
import { SignInScreenBackground } from "../components/SignInScreenBackground";
import { PRIVACY_DOCUMENT, TERMS_DOCUMENT } from "@proyecto/legal";
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

  const footerPaddingBottom = Math.max(insets.bottom, 12) + 8;

  return (
    <View className="flex-1">
      <SignInScreenBackground />

      <View style={styles.content}>
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
            flex: 1,
            opacity: sheetOpacity,
            transform: [{ translateY: sheetY }],
            paddingHorizontal: 18,
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
              Tu seguridad es nuestra prioridad
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
              Un chofer para remplazo cuando más lo necesites
            </Text>
            <GoogleSignInButton
              variant="splash"
              label="Continuar con Google"
              onError={(message) => setError(message)}
            />
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.85}
              style={styles.phoneButton}
            >
              <Text style={styles.phoneButtonLabel}>Continuar con el teléfono</Text>
            </TouchableOpacity>
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
        </Animated.View>

        <Text
          pointerEvents="box-none"
          className="text-center"
          style={[
            styles.legalFooter,
            {
              paddingHorizontal: 22,
              paddingBottom: footerPaddingBottom,
            },
          ]}
        >
          Al unirte a nuestra aplicación, aceptas nuestros{" "}
          <Text
            style={styles.legalLink}
            onPress={() => setLegalDoc("terms")}
          >
            Términos de Uso
          </Text>
          {" y "}
          <Text
            style={styles.legalLink}
            onPress={() => setLegalDoc("privacy")}
          >
            Política de Privacidad
          </Text>
          .
        </Text>
      </View>

      <LegalDocumentModal
        visible={legalDoc === "terms"}
        document={TERMS_DOCUMENT}
        title={TERMS_DOCUMENT.title}
        onClose={() => setLegalDoc(null)}
      />
      <LegalDocumentModal
        visible={legalDoc === "privacy"}
        document={PRIVACY_DOCUMENT}
        title={PRIVACY_DOCUMENT.title}
        onClose={() => setLegalDoc(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
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
  phoneButton: {
    marginTop: 12,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  phoneButtonLabel: {
    fontFamily: POPPINS.medium,
    fontSize: 16,
    color: HERCOM_COLORS.text,
  },
  legalFooter: {
    fontFamily: POPPINS.regular,
    fontSize: 12,
    color: HERCOM_COLORS.textSecondary,
    lineHeight: 17,
    paddingTop: 8,
  },
  legalLink: {
    fontFamily: POPPINS.medium,
    color: HERCOM_COLORS.text,
    textDecorationLine: "underline",
  },
});
