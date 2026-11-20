import { Text, View } from "react-native";
import { useAppTheme } from "../contexts/ThemeContext";
import { POPPINS, TABULAR } from "../constants/theme";

function pen(amount: number): string {
  return `S/ ${amount.toFixed(2)}`;
}

/** Total del servicio − adelanto = saldo pendiente. */
export function ClientTripPaymentBreakdown({
  serviceTotal,
  advanceAmount,
  balanceDue,
  title = "Cierre del viaje",
}: {
  serviceTotal: number;
  advanceAmount: number;
  balanceDue: number;
  title?: string;
}) {
  const { colors, border } = useAppTheme();
  return (
    <View
      style={{
        marginTop: 8,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: colors.surfaceSunken,
        gap: 8,
      }}
    >
      <Text style={{ fontFamily: POPPINS.bold, fontSize: 17, color: colors.textStrong }}>{title}</Text>
      <Row label="Total del servicio" value={pen(serviceTotal)} strong />
      <Row label="Adelanto (25%)" value={`− ${pen(advanceAmount)}`} />
      <View style={{ height: 1, backgroundColor: border, marginVertical: 4 }} />
      <Row label="Saldo a pagar al chofer" value={pen(balanceDue)} strong accent />
    </View>
  );
}

function Row({
  label,
  value,
  strong = false,
  accent = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
      <Text
        style={{
          flex: 1,
          fontFamily: strong ? POPPINS.semibold : POPPINS.regular,
          fontSize: 15,
          color: colors.text,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: POPPINS.bold,
          fontSize: strong ? 18 : 16,
          color: accent ? colors.success : colors.textStrong,
          ...TABULAR,
        }}
      >
        {value}
      </Text>
    </View>
  );
}