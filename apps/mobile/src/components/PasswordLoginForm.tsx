import { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuthActions } from "@convex-dev/auth/react";

type PasswordLoginFormProps = {
  onError?: (message: string) => void;
};

/** Inicio de sesión con email y contraseña (cuentas demo o registradas así). */
export function PasswordLoginForm({ onError }: PasswordLoginFormProps) {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("email", email.trim());
      formData.set("password", password);
      formData.set("flow", "signIn");
      await signIn("password", formData);
    } catch {
      onError?.("Correo o contraseña incorrectos.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="gap-3">
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Correo electrónico"
        placeholderTextColor="#94A3B8"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña"
        placeholderTextColor="#94A3B8"
        secureTextEntry
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
      />
      <TouchableOpacity
        onPress={() => void handleSubmit()}
        disabled={submitting || email.trim() === "" || password === ""}
        className="items-center rounded-2xl bg-hercom py-3.5 active:opacity-90 disabled:opacity-60"
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-base font-bold uppercase tracking-wide text-white">
            Iniciar sesión
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
