import type { Id } from "@proyecto/backend/dataModel";
import { Text, TouchableOpacity, View } from "react-native";
import { AppModal } from "./AppModal";

export type DriverOfferInfo = {
  _id: Id<"serviceOffers">;
  offeredPrice: number;
  driverName: string;
  driverRating: number;
  driverTrips: number;
  driverPlate?: string;
  driverVehicle?: string;
  driverColor?: string;
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
          <TouchableOpacity
            onPress={onAccept}
            disabled={accepting}
            className="mt-3 rounded-2xl bg-hercom py-4 disabled:opacity-60"
          >
            <Text className="text-center text-lg font-bold text-white">
              {accepting ? "Confirmando..." : "Elegir este chofer"}
            </Text>
          </TouchableOpacity>
        ) : null
      }
    >
      {offer === null ? (
        <Text className="text-base text-slate-600">Sin oferta seleccionada.</Text>
      ) : (
        <View>
          <Text className="mb-1 text-2xl font-bold text-slate-900">
            {offer.driverName}
          </Text>
          <Text className="mb-4 text-lg text-amber-700">
            {offer.driverRating.toFixed(1)} ★
            {offer.driverTrips > 0
              ? ` · ${offer.driverTrips} ${offer.driverTrips === 1 ? "viaje" : "viajes"}`
              : " · Chofer nuevo"}
          </Text>
          {offer.driverVehicle !== undefined && offer.driverVehicle !== "" && (
            <Info label="Vehículo" value={offer.driverVehicle} />
          )}
          {offer.driverColor !== undefined && offer.driverColor !== "" && (
            <Info label="Color" value={offer.driverColor} />
          )}
          {offer.driverPlate !== undefined && offer.driverPlate !== "" && (
            <Info label="Placa" value={offer.driverPlate} />
          )}
          <View className="mt-2 rounded-2xl bg-sky-50 p-4">
            <Text className="text-base font-semibold text-slate-600">
              Tarifa ofertada
            </Text>
            <Text className="text-2xl font-bold text-hercom">
              S/{offer.offeredPrice.toFixed(2)}
            </Text>
          </View>
          {error !== null && (
            <Text className="mt-3 text-base font-medium text-red-600">{error}</Text>
          )}
        </View>
      )}
    </AppModal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3">
      <Text className="text-base font-semibold text-slate-500">{label}</Text>
      <Text className="text-lg font-semibold text-slate-900">{value}</Text>
    </View>
  );
}
