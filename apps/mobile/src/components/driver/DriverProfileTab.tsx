import { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc } from "@proyecto/backend/dataModel";
import { DriverMyData } from "../DriverMyData";
import { DrawerIcon, type DrawerIconName } from "../DrawerIcons";
import { ThemeToggle } from "../ThemeToggle";
import { UberScreenHeader } from "../uber/UberScreenHeader";
import { useAppMode } from "../../contexts/AppModeContext";
import { useAppTheme } from "../../contexts/ThemeContext";
import { LegalDocumentModal } from "../LegalDocumentModal";
import { HERCOM_COLORS, POPPINS } from "../../constants/theme";
import {
  PRIVACY_DOCUMENT,
  TERMS_DOCUMENT,
  type LegalDocument,
} from "@proyecto/legal";

type DriverProfileTabProps = {
  driver: Doc<"drivers">;
  userName: string;
  avatarUrl?: string | null;
  section: "menu" | "datos";
  onSectionChange: (section: "menu" | "datos") => void;
};

function ProfileRow({
  icon,
  title,
  subtitle,
  onPress,
  danger = false,
}: {
  icon: DrawerIconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors, border } = useAppTheme();
  const tint = danger ? colors.danger : colors.textStrong;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: border,
      }}
    >
      <DrawerIcon name={icon} color={tint} size={24} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: POPPINS.medium, fontSize: 17, color: tint }}>{title}</Text>
        {subtitle !== undefined && (
          <Text
            style={{ marginTop: 2, fontFamily: POPPINS.regular, fontSize: 14, color: colors.steel }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {!danger && <DrawerIcon name="chevron" color={colors.steel} />}
    </TouchableOpacity>
  );
}

/** Pestaña Perfil: identidad del chofer, datos, apariencia, modo y sesión. */
export function DriverProfileTab({
  driver,
  userName,
  avatarUrl,
  section,
  onSectionChange,
}: DriverProfileTabProps) {
  const { colors } = useAppTheme();
  const { signOut } = useAuthActions();
  const { setMode } = useAppMode();
  const me = useQuery(api.users.getMe);
  const accountEmail = me?.email?.trim() ?? "";
  const [switching, setSwitching] = useState(false);
  const [legal, setLegal] = useState<LegalDocument | null>(null);
  const displayName = userName.trim() !== "" ? userName : "Chofer Hercom";

  if (section === "datos") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.base }}>
        <UberScreenHeader
          title="Mis datos"
          trailing={
            <TouchableOpacity onPress={() => onSectionChange("menu")} hitSlop={12}>
              <Text style={{ fontFamily: POPPINS.semibold, fontSize: 15, color: colors.accent }}>
                Volver
              </Text>
            </TouchableOpacity>
          }
        />
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
          <DriverMyData
            driver={driver}
            fallbackName={userName}
            email={accountEmail === "" ? null : accountEmail}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <UberScreenHeader title="Perfil" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 20 }}>
          {avatarUrl !== undefined && avatarUrl !== null && avatarUrl !== "" ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceSunken }}
            />
          ) : (
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: HERCOM_COLORS.primarySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontFamily: POPPINS.bold, fontSize: 26, color: HERCOM_COLORS.primary }}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{ fontFamily: POPPINS.bold, fontSize: 20, color: colors.textStrong }}
            >
              {displayName}
            </Text>
            {accountEmail !== "" ? (
              <Text
                numberOfLines={1}
                style={{ marginTop: 2, fontFamily: POPPINS.regular, fontSize: 14, color: colors.steel }}
              >
                {accountEmail}
              </Text>
            ) : null}
            <Text style={{ marginTop: 2, fontFamily: POPPINS.regular, fontSize: 15, color: colors.steel }}>
              {`${driver.rating.toFixed(1)} ★ · ${driver.totalTrips} ${driver.totalTrips === 1 ? "viaje" : "viajes"}`}
            </Text>
            <Text style={{ marginTop: 2, fontFamily: POPPINS.medium, fontSize: 14, color: colors.steel }}>
              {`${driver.vehicle.make} ${driver.vehicle.model} · ${driver.vehicle.plate}`}
            </Text>
          </View>
        </View>

        <ProfileRow
          icon="clipboard"
          title="Mis datos y documentos"
          subtitle="Registro, brevete y datos de cobro"
          onPress={() => onSectionChange("datos")}
        />
        <ProfileRow
          icon="car"
          title={switching ? "Cambiando…" : "Cambiar a modo cliente"}
          subtitle="Pide un chofer con tu misma cuenta"
          onPress={() => {
            setSwitching(true);
            void setMode("client").finally(() => setSwitching(false));
          }}
        />

        <ProfileRow
          icon="shield"
          title="Términos de uso"
          onPress={() => setLegal(TERMS_DOCUMENT)}
        />
        <ProfileRow
          icon="key"
          title="Política de privacidad"
          onPress={() => setLegal(PRIVACY_DOCUMENT)}
        />

        <View style={{ paddingVertical: 16 }}>
          <ThemeToggle />
        </View>

        <ProfileRow icon="logout" title="Cerrar sesión" danger onPress={() => void signOut()} />
      </ScrollView>
      <LegalDocumentModal
        visible={legal !== null}
        document={legal ?? undefined}
        title={legal?.title ?? ""}
        onClose={() => setLegal(null)}
      />
    </View>
  );
}
