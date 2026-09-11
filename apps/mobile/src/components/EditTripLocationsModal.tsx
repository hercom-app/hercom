import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { AppModal } from "./AppModal";
import {
  TacticalButton,
  TacticalLabel,
  TacticalText,
} from "./tactical";
import type { SelectedPlace } from "../lib/googlePlaces";
import { MONO, TACTICAL_COLORS } from "../constants/theme";

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
        <View className="mt-3">
          <TacticalButton
            label={saving ? "Guardando..." : "Guardar cambios"}
            onPress={handleSave}
            disabled={saving || (originPlace === null && destPlace === null)}
            loading={saving}
          />
        </View>
      }
    >
      <TacticalText size={12} className="mb-4">
        Solo puedes cambiar partida o destino mientras el viaje está en curso.
      </TacticalText>
      <TacticalLabel tone="accent" className="mb-2">
        Punto de partida
      </TacticalLabel>
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
      <TacticalLabel tone="accent" className="mb-2">
        Destino
      </TacticalLabel>
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
        <Text
          className="mt-3 text-xs"
          style={{ fontFamily: MONO.medium, color: TACTICAL_COLORS.danger }}
        >
          {error}
        </Text>
      )}
      {originPlace === null && destPlace === null && (
        <TacticalText size={12} className="mt-3">
          Elige una dirección de la lista para partida y/o destino.
        </TacticalText>
      )}
    </AppModal>
  );
}

