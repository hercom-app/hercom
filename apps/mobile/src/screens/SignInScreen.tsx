import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { HercomLogo } from "../components/HercomLogo";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { PasswordLoginForm } from "../components/PasswordLoginForm";

const SPLASH_MS = 1600;

type SignInScreenProps = {
  onDriverRegister: () => void;
};

/**
 * Bienvenida → acciones claras: chofer, cliente o login.
 */
export function SignInScreen({ onDriverRegister }: SignInScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <Pressable
        style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#007AFF", paddingHorizontal: 24 }}
        onPress={() => setShowSplash(false)}
        accessibilityLabel="Continuar"
      >
        <HercomLogo width={280} />
        <Text style={{ marginTop: 32, fontSize: 14, color: "rgba(255,255,255,0.75)" }}>
          Toca para continuar
        </Text>
      </Pressable>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#007AFF" }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 32 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <HercomLogo width={160} />
      </View>

      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 24,
          padding: 24,
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <Text style={{ marginBottom: 4, textAlign: "center", fontSize: 20, fontWeight: "700", color: "#0F172A" }}>
          Bienvenido a Hercom
        </Text>
        <Text style={{ marginBottom: 20, textAlign: "center", fontSize: 14, color: "#64748B" }}>
          Elige cómo quieres continuar
        </Text>

        {/* Chofer — siempre visible, botón principal */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onDriverRegister}
          style={{
            marginBottom: 12,
            borderRadius: 16,
            backgroundColor: "#007AFF",
            paddingVertical: 16,
          }}
        >
          <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
            Registro de chofer
          </Text>
          <Text style={{ marginTop: 4, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
            DNI, brevete y documentos
          </Text>
        </TouchableOpacity>

        {/* Cliente — Google */}
        <GoogleSignInButton
          label="Registrarse como cliente"
          onError={(message) => setError(message)}
        />

        {/* Login existente */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            setError(null);
            setShowLogin((v) => !v);
          }}
          style={{
            marginTop: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            paddingVertical: 14,
          }}
        >
          <Text style={{ textAlign: "center", fontSize: 15, fontWeight: "600", color: "#334155" }}>
            {showLogin ? "Ocultar inicio de sesión" : "Ya tengo cuenta — Iniciar sesión"}
          </Text>
        </TouchableOpacity>

        {showLogin && (
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#F1F5F9" }}>
            <PasswordLoginForm onError={(message) => setError(message)} />
            <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 16, gap: 12 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: "#E2E8F0" }} />
              <Text style={{ fontSize: 12, color: "#94A3B8" }}>o</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: "#E2E8F0" }} />
            </View>
            <GoogleSignInButton
              label="Entrar con Google"
              onError={(message) => setError(message)}
            />
          </View>
        )}

        {error !== null && (
          <View style={{ marginTop: 16, borderRadius: 12, backgroundColor: "#FEF2F2", paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ textAlign: "center", fontSize: 14, color: "#DC2626" }}>{error}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
