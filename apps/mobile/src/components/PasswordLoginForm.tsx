import { useState } from "react";
import { View } from "react-native";
import { useAuthActions } from "@convex-dev/auth/react";
import { UiButton, UiInput } from "./ui";

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
      <UiInput
        value={email}
        onChangeText={setEmail}
        placeholder="Correo electrónico"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <UiInput
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña"
        secureTextEntry
      />
      <UiButton
        label="Iniciar sesión"
        onPress={() => void handleSubmit()}
        disabled={submitting || email.trim() === "" || password === ""}
        loading={submitting}
      />
    </View>
  );
}
