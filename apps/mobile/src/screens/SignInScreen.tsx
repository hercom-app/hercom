import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { LegalDocumentModal } from "../components/LegalDocumentModal";
import { PRIVACY_POLICY, TERMS_OF_USE } from "../constants/legalCopy";
import { HERCOM_COLORS, POPPINS } from "../constants/theme";

const LOGO_WIDTH = 228;
const LOGO_HEIGHT = Math.round(LOGO_WIDTH * (620 / 561));

/**
 * Portada: fondo primario a pantalla completa, el logo entra con un rebote
 * (como Yango) y después sube la tarjeta de inicio de sesión.
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
    <View className="flex-1" style={{ backgroundColor: HERCOM_COLORS.primary }}>
      <StatusBar style="light" />

      <View
        className="flex-1 items-center justify-center"
        style={{ paddingTop: insets.top }}
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
          opacity: sheetOpacity,
          transform: [{ translateY: sheetY }],
          paddingHorizontal: 18,
          paddingBottom: Math.max(insets.bottom, 12) + 8,
        }}
      >
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 28,
            paddingHorizontal: 18,
            paddingTop: 22,
            paddingBottom: 18,
          }}
        >
          <Text
            className="mb-4 text-center"
            style={{
              fontFamily: POPPINS.semibold,
              fontSize: 18,
              color: HERCOM_COLORS.text,
            }}
          >
            Inicia sesión
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
              color: "#FFFFFF",
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
            color: "rgba(15, 23, 42, 0.78)",
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
