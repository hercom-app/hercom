import { useState } from "react";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { AccountScreenShell } from "../components/AccountScreenShell";
import { LegalDocumentModal } from "../components/LegalDocumentModal";
import {
  TacticalLabel,
  TacticalPanel,
  TacticalText,
  TacticalValue,
} from "../components/tactical";
import { PRIVACY_POLICY, TERMS_OF_USE } from "../constants/legalCopy";
import {
  TACTICAL_BORDER,
  TACTICAL_BORDER_SOFT,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";
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
      <TacticalLabel size={9} className="mb-1.5">
        {label}
      </TacticalLabel>
      <View
        className="px-4 py-3.5"
        style={{
          backgroundColor: TACTICAL_COLORS.surfaceSunken,
          borderRadius: TACTICAL_RADIUS.sharp,
          borderWidth: 1,
          borderColor: TACTICAL_BORDER,
        }}
      >
        <TacticalValue size={14}>{display}</TacticalValue>
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
    <AccountScreenShell
      variant="tactical"
      title="Mi Información"
      onOpenMenu={onOpenMenu}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <TacticalPanel corners>
          {me === undefined || me === null ? (
            <TacticalText size={12}>Cargando…</TacticalText>
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
                  <TacticalLabel size={9} className="mb-1.5">
                    Selfie
                  </TacticalLabel>
                  <Image
                    source={{ uri: me.selfieUrl }}
                    style={{
                      width: 112,
                      height: 160,
                      borderRadius: TACTICAL_RADIUS.sharp,
                      borderWidth: 1,
                      borderColor: TACTICAL_COLORS.accent,
                      backgroundColor: TACTICAL_COLORS.surfaceSunken,
                    }}
                  />
                </View>
              )}
              <ReadOnlyField label="Correo" value={me.email} />
              <ReadOnlyField label="Teléfono" value={me.phone} last />
            </>
          )}
        </TacticalPanel>

        <TacticalPanel className="mt-4 p-1">
          <TouchableOpacity
            onPress={() => setLegal("terms")}
            className="px-3 py-3.5"
          >
            <TacticalLabel size={11} tone="text">
              Términos de uso
            </TacticalLabel>
          </TouchableOpacity>
          <View
            className="mx-3"
            style={{ height: 1, backgroundColor: TACTICAL_BORDER_SOFT }}
          />
          <TouchableOpacity
            onPress={() => setLegal("privacy")}
            className="px-3 py-3.5"
          >
            <TacticalLabel size={11} tone="text">
              Política de privacidad
            </TacticalLabel>
          </TouchableOpacity>
        </TacticalPanel>
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
