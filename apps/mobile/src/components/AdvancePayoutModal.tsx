import { Image, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TacticalEmpty, TacticalLabel } from "./tactical";
import { HERCOM_COLORS, MONO, POPPINS, TACTICAL_COLORS, TACTICAL_RADIUS } from "../constants/theme";

export type DriverProfileDetails = {
  fullName: string;
  aboutMe?: string;
  photoUrl?: string | null;
  dni: string;
  yape: string;
  plin: string;
  bankAccount1: string;
  bankAccount2: string;
  bankAccount3: string;
};

type AdvancePayoutModalProps = {
  visible: boolean;
  onClose: () => void;
  payout: DriverProfileDetails | null;
};

function Row({ label, value }: { label: string; value: string }) {
  const empty = value === "";
  return (
    <View
      className="mb-2.5 px-4 py-3"
      style={{
        backgroundColor: TACTICAL_COLORS.surfaceSunken,
        borderRadius: TACTICAL_RADIUS.sharp,
        borderLeftWidth: 2,
        borderLeftColor: empty ? TACTICAL_COLORS.steel : TACTICAL_COLORS.accent,
      }}
    >
      <TacticalLabel>{label}</TacticalLabel>
      <Text
        selectable
        className="mt-1"
        style={{
          fontFamily: MONO.bold,
          fontSize: 18,
          color: empty ? TACTICAL_COLORS.steel : TACTICAL_COLORS.textStrong,
        }}
      >
        {empty ? "—" : value}
      </Text>
    </View>
  );
}

export function AdvancePayoutModal({
  visible,
  onClose,
  payout,
}: AdvancePayoutModalProps) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === "android" ? 36 : 12);
  const photoUrl = payout?.photoUrl?.trim() ?? "";
  const aboutMe = payout?.aboutMe?.trim() ?? "";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: topInset }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: HERCOM_COLORS.border,
          }}
        >
          <Text style={{ fontFamily: POPPINS.bold, fontSize: 18, color: HERCOM_COLORS.text }}>
            Datos para transferir
          </Text>
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            hitSlop={12}
            className="px-2 py-1"
          >
            <TacticalLabel tone="accent" size={10}>
              Cerrar
            </TacticalLabel>
          </TouchableOpacity>
        </View>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator
        >
          {payout === null ? (
            <TacticalEmpty
              title="Sin datos de cobro"
              subtitle="El chofer aún no cargó sus datos de cobro."
            />
          ) : (
            <View>
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                {photoUrl !== "" ? (
                  <Image
                    source={{ uri: photoUrl }}
                    accessibilityLabel={`Foto de ${payout.fullName}`}
                    style={{
                      width: 112,
                      height: 112,
                      borderRadius: 56,
                      backgroundColor: HERCOM_COLORS.surfaceMuted,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 112,
                      height: 112,
                      borderRadius: 56,
                      backgroundColor: HERCOM_COLORS.surfaceMuted,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontFamily: POPPINS.bold, fontSize: 36, color: HERCOM_COLORS.primary }}>
                      {payout.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text
                  style={{
                    marginTop: 12,
                    fontFamily: POPPINS.bold,
                    fontSize: 20,
                    color: HERCOM_COLORS.text,
                    textAlign: "center",
                  }}
                >
                  {payout.fullName}
                </Text>
                <Text
                  style={{
                    marginTop: 6,
                    fontFamily: POPPINS.regular,
                    fontSize: 15,
                    lineHeight: 22,
                    color: aboutMe === "" ? HERCOM_COLORS.textMuted : HERCOM_COLORS.text,
                    textAlign: "center",
                  }}
                >
                  {aboutMe === "" ? "Este chofer aún no escribió una presentación." : aboutMe}
                </Text>
              </View>

              <TacticalLabel tone="accent" className="mb-2">
                Titular
              </TacticalLabel>
              <Row label="Nombres" value={payout.fullName} />
              <Row label="DNI" value={payout.dni} />

              <TacticalLabel tone="accent" className="mb-2 mt-2">
                Billeteras
              </TacticalLabel>
              <Row label="Yape" value={payout.yape} />
              <Row label="Plin" value={payout.plin} />

              <TacticalLabel tone="accent" className="mb-2 mt-2">
                Cuentas bancarias
              </TacticalLabel>
              <Row label="Cuenta banco 1" value={payout.bankAccount1} />
              <Row label="Cuenta banco 2" value={payout.bankAccount2} />
              <Row label="Cuenta banco 3" value={payout.bankAccount3} />
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
