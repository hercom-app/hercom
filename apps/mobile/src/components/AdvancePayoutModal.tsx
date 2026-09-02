import { Text, View } from "react-native";
import { AppModal } from "./AppModal";

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
  return (
    <View className="mb-3 rounded-2xl bg-slate-50 px-4 py-3">
      <Text className="mb-1 text-xs font-semibold text-slate-500">{label}</Text>
      <Text selectable className="text-lg font-semibold text-slate-900">
        {value !== "" ? value : "—"}
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
        <Text className="text-base text-slate-600">
          El chofer aún no cargó sus datos de cobro.
        </Text>
      ) : (
        <View>
          <Row label="Nombres" value={payout.fullName} />
          <Row label="DNI" value={payout.dni} />
          <Row label="Yape" value={payout.yape} />
          <Row label="Plin" value={payout.plin} />
          <Row label="Cuenta banco 1" value={payout.bankAccount1} />
          <Row label="Cuenta banco 2" value={payout.bankAccount2} />
          <Row label="Cuenta banco 3" value={payout.bankAccount3} />
        </View>
      )}
    </AppModal>
  );
}
