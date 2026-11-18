import { Text, View } from "react-native";
import {
  quoteDriverFare,
  type DriverFareQuote,
} from "@proyecto/backend/driverFare";
import { useAppTheme } from "../contexts/ThemeContext";
import { POPPINS, TABULAR } from "../constants/theme";

export function solesLabel(amount: number): string {
  return Number.isInteger(amount) ? `S/ ${amount}` : `S/ ${amount.toFixed(2)}`;
}

export function discountTitle(service: {
  discountKind?: "first_trips" | "campaign";
  promotionName?: string;
  discountRate?: number;
}): string {
  if (service.discountKind === "campaign") {
    return service.promotionName ?? "Campaña";
  }
  if (service.discountKind === "first_trips" || (service.discountRate ?? 0) > 0) {
    return "Primeros viajes";
  }
  return "";
}

export function quoteOffer(
  offer: number,
  discountRate?: number,
  commissionRate?: number,
): DriverFareQuote {
  return quoteDriverFare(offer, discountRate, commissionRate);
}

/** Dos importes con nombre: el de la izquierda puede ir tachado. */
export function MoneyPair({
  leftLabel,
  leftAmount,
  rightLabel,
  rightAmount,
  strikeLeft = false,
  align = "flex-start",
  leftSize = 18,
  rightSize = 22,
}: {
  leftLabel: string;
  leftAmount: number;
  rightLabel: string;
  rightAmount: number;
  strikeLeft?: boolean;
  align?: "center" | "flex-end" | "flex-start";
  leftSize?: number;
  rightSize?: number;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: align, gap: 14 }}>
      <View style={{ alignItems: align === "flex-end" ? "flex-end" : "flex-start" }}>
        <Text style={{ fontFamily: POPPINS.medium, fontSize: 12, color: colors.steel }}>
          {leftLabel}
        </Text>
        <Text
          style={{
            fontFamily: POPPINS.medium,
            fontSize: leftSize,
            color: colors.steel,
            textDecorationLine: strikeLeft ? "line-through" : "none",
            ...TABULAR,
          }}
        >
          {solesLabel(leftAmount)}
        </Text>
      </View>
      <View style={{ alignItems: align === "flex-end" ? "flex-end" : "flex-start" }}>
        <Text style={{ fontFamily: POPPINS.medium, fontSize: 12, color: colors.steel }}>
          {rightLabel}
        </Text>
        <Text
          style={{
            fontFamily: POPPINS.bold,
            fontSize: rightSize,
            color: colors.textStrong,
            ...TABULAR,
          }}
        >
          {solesLabel(rightAmount)}
        </Text>
      </View>
    </View>
  );
}

/**
 * El chofer ve que es un primer viaje, cuánto le paga el cliente
 * y cuánto baja su comisión.
 */
export function DriverFirstTripsNotice({
  quote,
  advance,
  label = "Primeros viajes",
  showPair = true,
}: {
  quote: DriverFareQuote;
  advance?: number;
  label?: string;
  showPair?: boolean;
}) {
  const { colors } = useAppTheme();
  if (!quote.discounted) {
    return null;
  }
  const rest =
    advance === undefined
      ? undefined
      : Math.round((quote.clientPays - advance) * 100) / 100;

  return (
    <View
      style={{
        backgroundColor: colors.surfaceSunken,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 6,
        marginBottom: 14,
      }}
    >
      <Text
        style={{
          fontFamily: POPPINS.bold,
          fontSize: 13,
          letterSpacing: 0.6,
          color: colors.accent,
        }}
      >
        {label.toUpperCase()}
      </Text>
      {showPair ? (
        <MoneyPair
          leftLabel="Tu oferta"
          leftAmount={quote.offer}
          rightLabel="Comisión"
          rightAmount={quote.commission}
          leftSize={18}
          rightSize={26}
        />
      ) : null}
      <Text style={{ fontFamily: POPPINS.regular, fontSize: 15, lineHeight: 21, color: colors.text }}>
        {`El cliente te paga ${solesLabel(quote.clientPays)}. Sin este descuento la comisión sería ${solesLabel(quote.fullCommission)}.`}
      </Text>
      <Text style={{ fontFamily: POPPINS.semibold, fontSize: 15, lineHeight: 21, color: colors.textStrong }}>
        {`Te quedas ${solesLabel(quote.net)}. Te pagan menos y tú pagas menos comisión.`}
      </Text>
      {advance !== undefined && rest !== undefined && (
        <Text style={{ fontFamily: POPPINS.regular, fontSize: 14, lineHeight: 20, color: colors.text }}>
          {`Anticipo ${solesLabel(advance)}. El resto del viaje ${solesLabel(Math.max(rest, 0))}.`}
        </Text>
      )}
    </View>
  );
}
