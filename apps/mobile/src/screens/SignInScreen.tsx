import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuthActions } from "@convex-dev/auth/react";

export function SignInScreen() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignIn() {
    setError(null);
    setSubmitting(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
    } catch {
      setError("No se pudo iniciar sesión. Verifica tus datos.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 justify-center px-6">
      <Text className="mb-1 text-3xl font-bold text-slate-900">
        Choferes
      </Text>
      <Text className="mb-8 text-base text-slate-500">
        Inicia sesión para recibir viajes.
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Correo"
        autoCapitalize="none"
        keyboardType="email-address"
        className="mb-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña"
        secureTextEntry
        className="mb-4 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base"
      />

      {error !== null && (
        <Text className="mb-3 text-sm text-red-600">{error}</Text>
      )}

      <TouchableOpacity
        onPress={() => void handleSignIn()}
        disabled={submitting}
        className="rounded-xl bg-brand py-3 active:bg-brand-dark"
      >
        <Text className="text-center text-base font-semibold text-white">
          {submitting ? "Entrando..." : "Entrar"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
