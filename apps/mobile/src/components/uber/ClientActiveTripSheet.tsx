import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import type { Doc } from "@proyecto/backend/dataModel";
import { UberBottomSheet } from "./UberBottomSheet";
import { TripEtaHeader } from "./TripEtaHeader";
import { TripSecurityPin } from "./TripSecurityPin";
import { DriverInfoCard } from "./DriverInfoCard";
import { CommunicationRow } from "./CommunicationRow";
import { HERCOM_COLORS, POPPINS, TYPE } from "../../constants/theme";

const ETA_BY_STATUS: Partial<Record<Doc<"services">["status"], string>> = {
  pending: "Buscando chofer",
  assigned: "Chofer asignado",
  heading_to_pickup: "En camino al recojo",
  arrived_pickup: "Llegó al recojo",
  in_progress: "Viaje en curso",
  en_route: "En ruta",
  arrived_destination: "Llegó al destino",
};

type ClientActiveTripSheetProps = {
  service: Doc<"services"> & { driverName?: string };
  sheetHeight: number;
  children: ReactNode;
};

/** Sheet de viaje activo — ETA, PIN, chofer, acciones. */
export function ClientActiveTripSheet({
  service,
  sheetHeight,
  children,
}: ClientActiveTripSheetProps) {
  const etaLabel = ETA_BY_STATUS[service.status] ?? "Tu viaje";
  const showPin =
    service.securityCode !== undefined &&
    service.status !== "finished" &&
    service.status !== "cancelled";
  const showDriver =
    service.driverName !== undefined &&
    service.status !== "pending" &&
    service.status !== "cancelled";

  return (
    <UberBottomSheet height={sheetHeight}>
      <TripEtaHeader label="" highlight={etaLabel} />
      {showPin && <TripSecurityPin pin={service.securityCode!} />}
      {showDriver && (
        <>
          <DriverInfoCard driverName={service.driverName!} verified />
          <CommunicationRow />
        </>
      )}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        {children}
      </ScrollView>
    </UberBottomSheet>
  );
}

/** Precio / pago al pie del sheet. */
export function TripPriceFooter({
  label,
  price,
  paymentMethod = "Efectivo",
}: {
  label: string;
  price: string;
  paymentMethod?: string;
}) {
  return (
    <View
      className="mx-4 mt-2 flex-row items-center justify-between border-t px-1 pt-3"
      style={{ borderTopColor: HERCOM_COLORS.border }}
    >
      <View>
        <Text
          style={{
            fontFamily: POPPINS.semibold,
            fontSize: TYPE.body,
            color: HERCOM_COLORS.text,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontFamily: POPPINS.bold,
            fontSize: TYPE.headline,
            color: HERCOM_COLORS.text,
            marginTop: 2,
          }}
        >
          {price}
        </Text>
      </View>
      <View className="items-end">
        <Text
          style={{
            fontFamily: POPPINS.regular,
            fontSize: TYPE.caption,
            color: HERCOM_COLORS.textMuted,
          }}
        >
          {paymentMethod}
        </Text>
      </View>
    </View>
  );
}
