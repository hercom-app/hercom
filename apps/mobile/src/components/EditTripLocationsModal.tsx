import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { AppModal } from "./AppModal";
import type { SelectedPlace } from "../lib/googlePlaces";

type LocationValue = {
  address: string;
  lat: number;
  lng: number;
  department?: string;
  province?: string;
  district?: string;
};

type EditTripLocationsModalProps = {
  visible: boolean;
  origin: LocationValue;
  destination: LocationValue;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (next: {
    origin?: LocationValue;
    destination?: LocationValue;
  }) => void;
};

export function EditTripLocationsModal({
  visible,
  origin,
  destination,
  saving,
  error,
  onClose,
  onSave,
}: EditTripLocationsModalProps) {
  const [originText, setOriginText] = useState(origin.address);
  const [originPlace, setOriginPlace] = useState<SelectedPlace | null>(null);
  const [destText, setDestText] = useState(destination.address);
  const [destPlace, setDestPlace] = useState<SelectedPlace | null>(null);

  useEffect(() => {
    if (!visible) return;
    setOriginText(origin.address);
    setOriginPlace(null);
    setDestText(destination.address);
    setDestPlace(null);
  }, [visible, origin.address, destination.address]);

  const region = {
    department: origin.department ?? "",
    ...(origin.province !== undefined ? { province: origin.province } : {}),
    ...(origin.district !== undefined ? { district: origin.district } : {}),
  };

  function handleSave() {
    const nextOrigin =
      originPlace !== null
        ? {
            address: originPlace.address,
            lat: originPlace.lat,
            lng: originPlace.lng,
            ...(originPlace.department !== undefined
              ? { department: originPlace.department }
              : {}),
            ...(originPlace.province !== undefined
              ? { province: originPlace.province }
              : {}),
            ...(originPlace.district !== undefined
              ? { district: originPlace.district }
              : {}),
          }
        : undefined;
    const nextDestination =
      destPlace !== null
        ? {
            address: destPlace.address,
            lat: destPlace.lat,
            lng: destPlace.lng,
            ...(destPlace.department !== undefined
              ? { department: destPlace.department }
              : {}),
            ...(destPlace.province !== undefined
              ? { province: destPlace.province }
              : {}),
            ...(destPlace.district !== undefined
              ? { district: destPlace.district }
              : {}),
          }
        : undefined;
    if (nextOrigin === undefined && nextDestination === undefined) {
      return;
    }
    onSave({
      ...(nextOrigin !== undefined ? { origin: nextOrigin } : {}),
      ...(nextDestination !== undefined ? { destination: nextDestination } : {}),
    });
  }

  return (
    <AppModal
      visible={visible}
      title="Editar ruta del viaje"
      onClose={onClose}
      footer={
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || (originPlace === null && destPlace === null)}
          className="mt-3 rounded-2xl bg-hercom py-4 disabled:opacity-60"
        >
          <Text className="text-center text-lg font-bold text-white">
            {saving ? "Guardando..." : "Guardar cambios"}
          </Text>
        </TouchableOpacity>
      }
    >
      <Text className="mb-4 text-base text-slate-600">
        Solo puedes cambiar partida o destino mientras el viaje está en curso.
      </Text>
      <Text className="mb-2 text-base font-semibold text-slate-700">
        Punto de partida
      </Text>
      <AddressAutocomplete
        value={originText}
        onChangeText={(value) => {
          setOriginText(value);
          setOriginPlace(null);
        }}
        onPlaceSelected={(place) => {
          setOriginText(place.address);
          setOriginPlace(place);
        }}
        placeholder="Nueva partida"
        region={region}
      />
      <View className="h-4" />
      <Text className="mb-2 text-base font-semibold text-slate-700">Destino</Text>
      <AddressAutocomplete
        value={destText}
        onChangeText={(value) => {
          setDestText(value);
          setDestPlace(null);
        }}
        onPlaceSelected={(place) => {
          setDestText(place.address);
          setDestPlace(place);
        }}
        placeholder="Nuevo destino"
        region={region}
      />
      {error !== null && (
        <Text className="mt-3 text-base font-medium text-red-600">{error}</Text>
      )}
      {originPlace === null && destPlace === null && (
        <Text className="mt-3 text-base text-slate-500">
          Elige una dirección de la lista para partida y/o destino.
        </Text>
      )}
    </AppModal>
  );
}

