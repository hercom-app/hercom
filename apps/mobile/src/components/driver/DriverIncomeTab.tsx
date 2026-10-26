import { View } from "react-native";
import type { Doc } from "@proyecto/backend/dataModel";
import { DriverEarningsView } from "../DriverEarningsView";
import { UberScreenHeader } from "../uber/UberScreenHeader";
import { DriverWalletBalanceView } from "../wallet/DriverWalletBalanceView";
import { DriverWalletTopUpView } from "../wallet/DriverWalletTopUpView";
import { WalletScreenTransition } from "../wallet/WalletScreenTransition";
import { SegmentedTabs } from "./SegmentedTabs";
import { useAppTheme } from "../../contexts/ThemeContext";

export type IncomeSection = "ganancias" | "viajes";
export type WalletFlow = "balance" | "topup";

type DriverIncomeTabProps = {
  section: IncomeSection;
  onSectionChange: (section: IncomeSection) => void;
  walletFlow: WalletFlow;
  onWalletFlowChange: (flow: WalletFlow) => void;
  tripCredits: number;
  transactions: Doc<"walletTransactions">[] | undefined;
};

/** Pestaña Ingresos: ganancias y viajes prepagados (recargas). */
export function DriverIncomeTab({
  section,
  onSectionChange,
  walletFlow,
  onWalletFlowChange,
  tripCredits,
  transactions,
}: DriverIncomeTabProps) {
  const { colors } = useAppTheme();

  if (section === "viajes" && walletFlow === "topup") {
    return (
      <WalletScreenTransition screenKey="topup">
        <DriverWalletTopUpView
          onBack={() => onWalletFlowChange("balance")}
          onTopUpComplete={() => onWalletFlowChange("balance")}
        />
      </WalletScreenTransition>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <UberScreenHeader title="Ingresos" />
      <SegmentedTabs
        options={[
          { key: "ganancias", label: "Ganancias" },
          { key: "viajes", label: "Viajes prepagados" },
        ]}
        value={section}
        onChange={onSectionChange}
      />
      {section === "ganancias" ? (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
          <DriverEarningsView />
        </View>
      ) : (
        <DriverWalletBalanceView
          tripCredits={tripCredits}
          transactions={transactions}
          onRecargar={() => onWalletFlowChange("topup")}
        />
      )}
    </View>
  );
}
