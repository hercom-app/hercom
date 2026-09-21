import type { Id } from "@proyecto/backend/dataModel";
import { Text, View } from "react-native";
import { AppModal } from "./AppModal";
import { DriverInfoCard } from "./uber/DriverInfoCard";
import { TripPriceFooter } from "./uber/ClientActiveTripSheet";
import {
  TacticalButton,
  TacticalEmpty,
  TacticalValue,
} from "./tactical";
import { HERCOM_COLORS, MONO, TACTICAL_COLORS } from "../constants/theme";

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
          <DriverInfoCard
            driverName={offer.driverName}
            rating={offer.driverRating}
            tripsCount={offer.driverTrips}
            verified
          />
          <TripPriceFooter
            label="Tarifa ofertada"
            price={`S/${offer.offeredPrice.toFixed(2)}`}
          />
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
