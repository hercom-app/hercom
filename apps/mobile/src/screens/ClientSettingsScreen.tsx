import { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { AccountScreenShell } from "../components/AccountScreenShell";
import { UiCard, CARD_SHADOW } from "../components/ui";
import { LegalDocumentModal } from "../components/LegalDocumentModal";
import { PRIVACY_POLICY, TERMS_OF_USE } from "../constants/legalCopy";
import { ClientIdentityForm } from "./ClientIdentityForm";

type ClientSettingsScreenProps = {
  onOpenMenu: () => void;
};

function ReadOnlyField({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string | undefined;
  last?: boolean;
}) {
  const display = value !== undefined && value.trim() !== "" ? value : "—";
  return (
    <View className={last ? "" : "mb-3"}>
      <Text className="mb-1.5 text-xs font-semibold text-slate-500">{label}</Text>
      <View className="rounded-2xl bg-slate-100 px-4 py-3.5">
        <Text className="text-base text-slate-900">{display}</Text>
      </View>
    </View>
  );
}

/** Identidad RENIEC y correo: solo lectura. */
export function ClientSettingsScreen({ onOpenMenu }: ClientSettingsScreenProps) {
  const me = useQuery(api.users.getMe);
  const [legal, setLegal] = useState<"terms" | "privacy" | null>(null);

  if (me !== undefined && me !== null && me.identityComplete !== true) {
    return (
      <ClientIdentityForm
        onOpenMenu={onOpenMenu}
        title="Mi Información"
      />
    );
  }

  return (
    <AccountScreenShell title="Mi Información" onOpenMenu={onOpenMenu}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <UiCard>
          {me === undefined || me === null ? (
            <Text className="text-sm text-slate-400">Cargando…</Text>
          ) : (
            <>
              <ReadOnlyField label="DNI" value={me.dni} />
              <ReadOnlyField label="Nombres" value={me.firstName} />
              <ReadOnlyField label="Apellido paterno" value={me.firstLastName} />
              <ReadOnlyField
                label="Apellido materno"
                value={me.secondLastName}
              />
              {me.selfieUrl !== null && me.selfieUrl !== undefined && (
                <View className="mb-3">
                  <Text className="mb-1.5 text-xs font-semibold text-slate-500">
                    Selfie
                  </Text>
                  <Image
                    source={{ uri: me.selfieUrl }}
                    style={{ width: 112, height: 160, borderRadius: 16 }}
                    className="bg-slate-200"
                  />
                </View>
              )}
              <ReadOnlyField label="Correo" value={me.email} />
              <ReadOnlyField label="Teléfono" value={me.phone} last />
            </>
          )}
        </UiCard>

        <View className="mt-4 overflow-hidden rounded-3xl bg-white p-1" style={CARD_SHADOW}>
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
