import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE, type Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HERCOM_COLORS, POPPINS } from "../../constants/theme";
import {
  reverseGeocodePoint,
  type PickupLocationResult,
} from "../../lib/pickupLocation";
import { FloatingCircleButton } from "../uber/FloatingCircleButton";
import { PersonGlyph } from "./RouteIcons";

type PinPickerScreenProps = {
  initialCenter: { lat: number; lng: number };
  showsUserLocation: boolean;
  onCancel: () => void;
  onConfirm: (result: PickupLocationResult) => void;
};

const PIN_DELTA = 0.012;

/** Mapa a pantalla completa: el punto fijo queda al centro y el mapa se mueve con el dedo. */
export function PinPickerScreen({
  initialCenter,
  showsUserLocation,
  onCancel,
  onConfirm,
}: PinPickerScreenProps) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const requestRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draft, setDraft] = useState<PickupLocationResult | null>(null);
  const [resolving, setResolving] = useState(true);
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  function resolveCenter(latitude: number, longitude: number) {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }
    setResolving(true);
    debounceRef.current = setTimeout(() => {
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      void reverseGeocodePoint(latitude, longitude)
        .then((result) => {
          if (requestRef.current !== requestId) {
            return;
          }
          setDraft(result);
          setPinError(null);
        })
        .catch(() => {
          if (requestRef.current !== requestId) {
            return;
          }
          setDraft(null);
          setPinError("Mueve el mapa hasta una dirección reconocible.");
        })
        .finally(() => {
          if (requestRef.current === requestId) {
            setResolving(false);
          }
        });
    }, 380);
  }

  function handleRegionChange(region: Region) {
    resolveCenter(region.latitude, region.longitude);
  }

  const label =
    draft !== null
      ? draft.address.split(",")[0]?.trim() || draft.address
      : resolving
        ? "Buscando dirección…"
        : "Mueve el mapa";

  return (
    <View className="flex-1" style={{ backgroundColor: HERCOM_COLORS.mapFallback }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: initialCenter.lat,
          longitude: initialCenter.lng,
          latitudeDelta: PIN_DELTA,
          longitudeDelta: PIN_DELTA,
        }}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        rotateEnabled={false}
        pitchEnabled={false}
        onRegionChangeComplete={handleRegionChange}
      />

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: "50%",
          left: 16,
          right: 16,
          height: 0,
          alignItems: "center",
        }}
      >
        <View
          style={{
            position: "absolute",
            bottom: -23,
            alignItems: "center",
            maxWidth: "92%",
          }}
        >
          <View
            style={{
              backgroundColor: "#111111",
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 10,
              marginBottom: 8,
              maxWidth: 280,
            }}
          >
            <Text
              numberOfLines={2}
              style={{
                fontFamily: POPPINS.semibold,
                fontSize: 14,
                lineHeight: 18,
                color: "#FFFFFF",
                textAlign: "center",
              }}
            >
              {label}
            </Text>
          </View>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: "#111111",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 3,
              borderColor: "#FFFFFF",
            }}
          >
            <PersonGlyph size={22} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <View
        style={{
          position: "absolute",
          top: insets.top + 10,
          left: 16,
        }}
      >
        <FloatingCircleButton accessibilityLabel="Volver" onPress={onCancel}>
          <Text
            style={{
              fontFamily: POPPINS.bold,
              fontSize: 20,
              color: HERCOM_COLORS.text,
            }}
          >
            ←
          </Text>
        </FloatingCircleButton>
      </View>

      <View
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: insets.bottom + 16,
        }}
      >
        {pinError !== null && !resolving && (
          <Text
            style={{
              marginBottom: 8,
              textAlign: "center",
              fontFamily: POPPINS.medium,
              fontSize: 13,
              color: HERCOM_COLORS.danger,
            }}
          >
            {pinError}
          </Text>
        )}
        <Pressable
          onPress={() => {
            if (draft !== null) {
              onConfirm(draft);
            }
          }}
          disabled={draft === null || resolving}
          style={{
            height: 56,
            borderRadius: 16,
            backgroundColor: HERCOM_COLORS.primary,
            alignItems: "center",
            justifyContent: "center",
            opacity: draft === null || resolving ? 0.55 : 1,
          }}
        >
          {resolving ? (
            <ActivityIndicator color={HERCOM_COLORS.white} />
          ) : (
            <Text
              style={{
                fontFamily: POPPINS.bold,
                fontSize: 18,
                color: HERCOM_COLORS.white,
              }}
            >
              Hecho
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
