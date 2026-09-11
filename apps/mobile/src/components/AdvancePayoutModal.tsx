import { Text, View } from "react-native";
import { AppModal } from "./AppModal";
import { TacticalEmpty, TacticalLabel } from "./tactical";
import { MONO, TACTICAL_COLORS, TACTICAL_RADIUS } from "../constants/theme";

type AdvancePayoutModalProps = {
  visible: boolean;
  onClose: () => void;
  payout: {
    fullName: string;
    dni: string;
    yape: string;
    plin: string;
    bankAccount1: string;
    bankAccount2: string;
    bankAccount3: string;
  } | null;
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
        borderLeftColor: empty
          ? TACTICAL_COLORS.steel
          : TACTICAL_COLORS.accent,
      }}
    >
      <TacticalLabel size={9}>{label}</TacticalLabel>
      <Text
        selectable
        className="mt-1"
        style={{
          fontFamily: MONO.bold,
          fontSize: 15,
          letterSpacing: 0.8,
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
  return (
    <AppModal visible={visible} title="Datos para transferir" onClose={onClose}>
      {payout === null ? (
        <TacticalEmpty
          title="Sin datos de cobro"
          subtitle="El chofer aún no cargó sus datos de cobro."
        />
      ) : (
        <View>
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
    </AppModal>
  );
}
