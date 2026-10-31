import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { Id } from "@proyecto/backend/dataModel";
import {
  VEHICLE_PHOTO_SLOT_LABELS,
  VEHICLE_PHOTO_SLOTS,
  type VehiclePhotoSlot,
} from "@proyecto/backend/vehicleChecklistPhotos";
import { useAppTheme } from "../contexts/ThemeContext";
import { HERCOM_COLORS, POPPINS, UBER_RADIUS } from "../constants/theme";

export type LocalVehiclePhoto = {
  uri: string;
  mimeType: string;
};

export type VehiclePhotoDraft = {
  local?: LocalVehiclePhoto;
  storageId?: Id<"_storage">;
  url?: string | null;
};

type Props = {
  photos: Partial<Record<VehiclePhotoSlot, VehiclePhotoDraft>>;
  onCaptured: (slot: VehiclePhotoSlot, photo: LocalVehiclePhoto) => void;
  onError: (message: string) => void;
};

export function VehicleChecklistPhotos({ photos, onCaptured, onError }: Props) {
  const { colors } = useAppTheme();
  const tileWidth = (Dimensions.get("window").width - 50) / 2;

  async function capture(slot: VehiclePhotoSlot) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      onError("Necesitamos la cámara para las fotos del vehículo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || result.assets[0] === undefined) {
      return;
    }
    const asset = result.assets[0];
    onCaptured(slot, {
      uri: asset.uri,
      mimeType: asset.mimeType ?? "image/jpeg",
    });
  }

  return (
    <View>
      <Text
        style={{
          fontFamily: POPPINS.regular,
          fontSize: 15,
          color: colors.text,
          marginBottom: 12,
        }}
      >
        6 fotos, el set de rentadoras: 4 lados, interior y odómetro.
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {VEHICLE_PHOTO_SLOTS.map((slot) => {
          const draft = photos[slot];
          const uri = draft?.local?.uri ?? draft?.url ?? null;
          const taken = uri !== null && uri !== "";
          return (
            <TouchableOpacity
              key={slot}
              onPress={() => void capture(slot)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={
                taken
                  ? `${VEHICLE_PHOTO_SLOT_LABELS[slot]}, foto lista. Toca para cambiar.`
                  : `Tomar foto ${VEHICLE_PHOTO_SLOT_LABELS[slot]}`
              }
              style={{
                width: tileWidth,
                aspectRatio: 4 / 3,
                borderRadius: UBER_RADIUS.card,
                overflow: "hidden",
                backgroundColor: colors.surfaceSunken,
                borderWidth: taken ? 0 : 1.5,
                borderStyle: taken ? "solid" : "dashed",
                borderColor: colors.steel,
              }}
            >
              {taken ? (
                <>
                  <Image
                    source={{ uri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                  <View
                    style={{
                      position: "absolute",
                      left: 8,
                      right: 8,
                      bottom: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor: "rgba(15, 23, 42, 0.72)",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: POPPINS.medium,
                        fontSize: 12,
                        color: HERCOM_COLORS.white,
                        textAlign: "center",
                      }}
                    >
                      Cambiar
                    </Text>
                  </View>
                </>
              ) : (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 10,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: POPPINS.medium,
                      fontSize: 22,
                      color: colors.steel,
                      marginBottom: 2,
                    }}
                  >
                    +
                  </Text>
                  <Text
                    style={{
                      fontFamily: POPPINS.medium,
                      fontSize: 14,
                      color: colors.textStrong,
                      textAlign: "center",
                    }}
                  >
                    {VEHICLE_PHOTO_SLOT_LABELS[slot]}
                  </Text>
                  <Text
                    style={{
                      marginTop: 2,
                      fontFamily: POPPINS.regular,
                      fontSize: 12,
                      color: colors.steel,
                    }}
                  >
                    Tomar foto
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function countFilledVehiclePhotos(
  photos: Partial<Record<VehiclePhotoSlot, VehiclePhotoDraft>>,
): number {
  return VEHICLE_PHOTO_SLOTS.filter((slot) => {
    const draft = photos[slot];
    return draft?.local !== undefined || draft?.storageId !== undefined;
  }).length;
}
