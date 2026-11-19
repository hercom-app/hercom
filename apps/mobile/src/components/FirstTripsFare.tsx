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

/** Etiqueta verde: "−15% · Primeros viajes". */
export function DiscountTag({
  rate,
  label,
  align = "flex-start",
}: {
  rate: number;
  label?: string;
  align?: "flex-start" | "flex-end" | "center";
}) {
  const { colors } = useAppTheme();
  const percent = Math.round(rate * 100);
  const text = label !== undefined && label !== "" ? `−${percent}% · ${label}` : `−${percent}%`;
  return (
    <View
      style={{
        alignSelf: align,
        backgroundColor: `${colors.success}1F`,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
      }}
    >
      <Text
        numberOfLines={1}
        style={{ fontFamily: POPPINS.semibold, fontSize: 12, color: colors.success }}
      >
        {text}
      </Text>
    </View>
  );
}

/** Cliente: lo que paga en grande y la oferta tachada al lado, en chico. */
export function DiscountedPrice({
  price,
  original,
  size = 22,
}: {
  price: number;
  original: number;
  size?: number;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
      <Text style={{ fontFamily: POPPINS.bold, fontSize: size, color: colors.textStrong, ...TABULAR }}>
        {solesLabel(price)}
      </Text>
      <Text
        style={{
          fontFamily: POPPINS.regular,
          fontSize: Math.max(12, Math.round(size * 0.6)),
          color: colors.steel,
          textDecorationLine: "line-through",
          ...TABULAR,
        }}
      >
        {solesLabel(original)}
      </Text>
    </View>
  );
}

/** Chofer: su oferta en grande y la comisión debajo, en chico. */
export function OfferCommission({
  offer,
  commission,
  size = 22,
  align = "flex-start",
}: {
  offer: number;
  commission: number;
  size?: number;
  align?: "flex-start" | "flex-end" | "center";
}) {
  const { colors } = useAppTheme();
  return (
    <View style={{ alignItems: align }}>
      <Text style={{ fontFamily: POPPINS.bold, fontSize: size, color: colors.textStrong, ...TABULAR }}>
        {solesLabel(offer)}
      </Text>
      <Text style={{ fontFamily: POPPINS.medium, fontSize: 13, color: colors.steel, ...TABULAR }}>
        {`Comisión ${solesLabel(commission)}`}
      </Text>
    </View>
  );
}
