import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { AccountScreenShell } from "../components/AccountScreenShell";
import { LegalDocumentModal } from "../components/LegalDocumentModal";
import { PRIVACY_POLICY, TERMS_OF_USE } from "../constants/legalCopy";
import { convexErrorMessage } from "../lib/convexErrorMessage";

type ClientSettingsScreenProps = {
  onOpenMenu: () => void;
};

/** Nombre, teléfono, correo (solo lectura) y documentos legales. */
export function ClientSettingsScreen({ onOpenMenu }: ClientSettingsScreenProps) {
  const me = useQuery(api.users.getMe);
  const updateProfile = useMutation(api.users.updateProfile);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [legal, setLegal] = useState<"terms" | "privacy" | null>(null);

  useEffect(() => {
    if (me === undefined || me === null || hydrated) {
      return;
    }
    setName(me.name ?? "");
    setPhone(me.phone ?? "");
    setHydrated(true);
  }, [hydrated, me]);

  async function handleSave() {
    const nextName = name.trim();
    if (nextName === "") {
      Alert.alert("Nombre", "Escribe cómo quieres que te veamos en la app.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: nextName,
        phone: phone.trim(),
      });
      Alert.alert("Listo", "Tus datos se actualizaron.");
    } catch (error) {
      Alert.alert("No se pudo guardar", convexErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AccountScreenShell title="Mi Información" onOpenMenu={onOpenMenu}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="rounded-2xl border border-slate-100 bg-white p-4">
          {me === undefined || me === null || !hydrated ? (
            <ActivityIndicator color="#64748B" />
          ) : (
            <>
              <Text className="mb-1.5 text-xs font-semibold text-slate-600">
                Nombre
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre"
                placeholderTextColor="#94A3B8"
                className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
              />
              <Text className="mb-1.5 text-xs font-semibold text-slate-600">
                Teléfono
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Ej. 999 888 777"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
              />
              <Text className="mb-1.5 text-xs font-semibold text-slate-600">
                Correo
              </Text>
              <TextInput
                value={me.email ?? ""}
                editable={false}
                selectTextOnFocus={false}
                className="rounded-xl border border-slate-200 bg-slate-200 px-4 py-3 text-base text-slate-400"
              />
              <TouchableOpacity
                onPress={() => void handleSave()}
                disabled={saving}
                className="mt-4 items-center rounded-xl bg-hercom py-3.5 disabled:opacity-60"
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-sm font-bold text-white">
                    Guardar cambios
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <View className="mt-4 rounded-2xl border border-slate-100 bg-white p-1">
          <TouchableOpacity
            onPress={() => setLegal("terms")}
            className="px-3 py-3.5"
          >
            <Text className="text-[15px] font-medium text-slate-800">
              Términos de uso
            </Text>
          </TouchableOpacity>
          <View className="mx-3 h-px bg-slate-100" />
          <TouchableOpacity
            onPress={() => setLegal("privacy")}
            className="px-3 py-3.5"
          >
            <Text className="text-[15px] font-medium text-slate-800">
              Política de privacidad
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LegalDocumentModal
        visible={legal === "terms"}
        title={TERMS_OF_USE.title}
        body={TERMS_OF_USE.body}
        onClose={() => setLegal(null)}
      />
      <LegalDocumentModal
        visible={legal === "privacy"}
        title={PRIVACY_POLICY.title}
        body={PRIVACY_POLICY.body}
        onClose={() => setLegal(null)}
      />
    </AccountScreenShell>
  );
}
