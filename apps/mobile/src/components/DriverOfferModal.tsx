import type { Id } from "@proyecto/backend/dataModel";
import { Text, View } from "react-native";
import { AppModal } from "./AppModal";
import {
  TacticalButton,
  TacticalEmpty,
  TacticalLabel,
  TacticalPanel,
  TacticalStatus,
  TacticalTitle,
  TacticalValue,
} from "./tactical";
import { MONO, TACTICAL_COLORS, TACTICAL_RADIUS } from "../constants/theme";

export type DriverOfferInfo = {
  _id: Id<"serviceOffers">;
  offeredPrice: number;
  driverName: string;
  driverRating: number;
  driverTrips: number;
};

type DriverOfferModalProps = {
  visible: boolean;
  offer: DriverOfferInfo | null;
  accepting: boolean;
  error: string | null;
  onClose: () => void;
  onAccept: () => void;
};

export function DriverOfferModal({
  visible,
  offer,
  accepting,
  error,
  onClose,
  onAccept,
}: DriverOfferModalProps) {
  return (
    <AppModal
      visible={visible}
      title="Información del chofer"
      onClose={onClose}
      footer={
        offer !== null ? (
          <View className="mt-3">
            <TacticalButton
              label={accepting ? "Confirmando..." : "Elegir este chofer"}
              onPress={onAccept}
              disabled={accepting}
              loading={accepting}
            />
          </View>
        ) : null
      }
    >
      {offer === null ? (
        <TacticalEmpty title="Sin oferta seleccionada" />
      ) : (
        <View>
          <TacticalPanel corners active>
            <TacticalLabel size={9}>Operador</TacticalLabel>
            <TacticalTitle size={22} className="mt-1">
              {offer.driverName}
            </TacticalTitle>
            <View className="mt-3 flex-row flex-wrap items-center gap-2">
              <TacticalStatus
                label={`${offer.driverRating.toFixed(1)} ★`}
                tone="warning"
              />
              <TacticalStatus
                label={
                  offer.driverTrips > 0
                    ? `${offer.driverTrips} ${offer.driverTrips === 1 ? "viaje" : "viajes"}`
                    : "Chofer nuevo"
                }
                tone={offer.driverTrips > 0 ? "active" : "idle"}
              />
            </View>
          </TacticalPanel>

          <View
            className="mt-3 flex-row items-end justify-between px-4 py-3"
            style={{
              backgroundColor: "rgba(161, 196, 253, 0.1)",
              borderRadius: TACTICAL_RADIUS.sharp,
              borderLeftWidth: 2,
              borderLeftColor: TACTICAL_COLORS.accent,
            }}
          >
            <TacticalLabel size={10}>Tarifa ofertada</TacticalLabel>
            <TacticalValue size={24} tone="accent">
              {`S/${offer.offeredPrice.toFixed(2)}`}
            </TacticalValue>
          </View>

          {error !== null && (
            <Text
              className="mt-3 text-xs"
              style={{ fontFamily: MONO.medium, color: TACTICAL_COLORS.danger }}
            >
              {error}
            </Text>
          )}
        </View>
      )}
    </AppModal>
  );
}
