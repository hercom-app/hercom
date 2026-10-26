import { useEffect, useRef } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, PROVIDER_GOOGLE } from "react-native-maps";
import type { Doc, Id } from "@proyecto/backend/dataModel";
import { AvailabilityToggle } from "../AvailabilityToggle";
import { DrawerIcon } from "../DrawerIcons";
import { ServiceCard } from "../ServiceCard";
import { MapScreenLayout } from "../uber/MapScreenLayout";
import { UberBottomSheet } from "../uber/UberBottomSheet";
import { formatTripCreditsShort } from "../../lib/driverWalletDisplay";
import { HERCOM_COLORS, POPPINS, TABULAR } from "../../constants/theme";

type DriverStatus = "available" | "busy" | "offline";

const LIMA = { lat: -12.0464, lng: -77.0428 };

type DriverServiceHomeProps = {
  status: DriverStatus;
  tripCredits: number;
  radiusKm: number;
  nearbyCount: number | null;
  coords: { lat: number; lng: number } | null;
  activeServices: Doc<"services">[];
  onOpenChecklist: (serviceId: Id<"services">) => void;
  onOpenLiveMap: (serviceId: Id<"services">) => void;
  onOpenRadius: () => void;
  onOpenSafety: () => void;
  onGoToList: () => void;
  onGoToEarnings: () => void;
};

function regionFor(center: { lat: number; lng: number }, radiusKm: number) {
  const delta = Math.max(0.02, (radiusKm * 2.6) / 111);
  return {
    latitude: center.lat,
    longitude: center.lng,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

function MapFab({
  onPress,
  label,
  icon,
}: {
  onPress: () => void;
  label: string;
  icon: "gear" | "shield";
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={label}
      activeOpacity={0.85}
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: HERCOM_COLORS.white,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#0F172A",
        shadowOpacity: 0.14,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
      }}
    >
      <DrawerIcon name={icon} color={HERCOM_COLORS.text} size={24} />
    </TouchableOpacity>
  );
}

function StatCell({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ flex: 1, paddingVertical: 4 }}
    >
      <Text style={{ fontFamily: POPPINS.regular, fontSize: 14, color: HERCOM_COLORS.textMuted }}>
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          marginTop: 2,
          fontFamily: POPPINS.bold,
          fontSize: 22,
          color: HERCOM_COLORS.text,
          ...TABULAR,
        }}
      >
        {value}
      </Text>
    </TouchableOpacity>
  );
}

/** Pestaña Servicio: mapa, radio, centro de seguridad y conexión. */
export function DriverServiceHome({
  status,
  tripCredits,
  radiusKm,
  nearbyCount,
  coords,
  activeServices,
  onOpenChecklist,
  onOpenLiveMap,
  onOpenRadius,
  onOpenSafety,
  onGoToList,
  onGoToEarnings,
}: DriverServiceHomeProps) {
  const mapRef = useRef<MapView>(null);
  const isAvailable = status === "available";
  const activeService = activeServices[0];
  const center = coords ?? LIMA;

  useEffect(() => {
    if (coords === null) {
      return;
    }
    mapRef.current?.animateToRegion(regionFor(coords, radiusKm), 500);
  }, [coords?.lat, coords?.lng, radiusKm]);

  const fabs = (
    <View
      pointerEvents="box-none"
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        marginBottom: 12,
      }}
    >
      {activeService === undefined ? (
        <MapFab icon="gear" label="Configurar radio de búsqueda" onPress={onOpenRadius} />
      ) : (
        <View />
      )}
      <MapFab icon="shield" label="Centro de seguridad" onPress={onOpenSafety} />
    </View>
  );

  const sheet =
    activeService !== undefined ? (
      <UberBottomSheet
        height={Math.round(Dimensions.get("window").height * 0.58)}
        style={{ paddingBottom: 8 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        >
          {activeServices.map((service) => (
            <ServiceCard
              key={service._id}
              service={service}
              onOpenChecklist={onOpenChecklist}
              onOpenLiveMap={onOpenLiveMap}
            />
          ))}
        </ScrollView>
      </UberBottomSheet>
    ) : (
      <UberBottomSheet style={{ paddingBottom: 12 }}>
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingHorizontal: 4,
            }}
          >
            <StatCell
              label="Viajes prepagados"
              value={formatTripCreditsShort(tripCredits)}
              onPress={onGoToEarnings}
            />
            <View style={{ width: 1, height: 40, backgroundColor: HERCOM_COLORS.border }} />
            <StatCell label="Radio" value={`${radiusKm} km`} onPress={onOpenRadius} />
          </View>

          <TouchableOpacity
            onPress={isAvailable ? onGoToList : undefined}
            disabled={!isAvailable}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: HERCOM_COLORS.surfaceMuted,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: POPPINS.semibold, fontSize: 16, color: HERCOM_COLORS.text }}>
                {isAvailable
                  ? nearbyCount === null
                    ? "Buscando solicitudes…"
                    : nearbyCount === 0
                      ? "Sin solicitudes cerca por ahora"
                      : `${nearbyCount} ${nearbyCount === 1 ? "solicitud" : "solicitudes"} cerca`
                  : "Estás desconectado"}
              </Text>
              <Text
                style={{
                  marginTop: 2,
                  fontFamily: POPPINS.regular,
                  fontSize: 14,
                  color: HERCOM_COLORS.textMuted,
                }}
              >
                {isAvailable
                  ? `Dentro de ${radiusKm} km · toca para ver la lista`
                  : `Conéctate para recibir solicitudes a ${radiusKm} km`}
              </Text>
            </View>
            {isAvailable && <DrawerIcon name="chevron" color={HERCOM_COLORS.text} />}
          </TouchableOpacity>

          <AvailabilityToggle status={status} variant="pill" />
        </View>
      </UberBottomSheet>
    );

  return (
    <MapScreenLayout
      map={
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          initialRegion={regionFor(center, radiusKm)}
          showsUserLocation
          showsMyLocationButton={false}
          loadingEnabled
          loadingIndicatorColor={HERCOM_COLORS.primary}
        >
          {coords !== null && isAvailable && activeService === undefined && (
            <Circle
              center={{ latitude: coords.lat, longitude: coords.lng }}
              radius={radiusKm * 1000}
              strokeColor="rgba(11, 112, 254, 0.55)"
              fillColor="rgba(11, 112, 254, 0.08)"
              strokeWidth={2}
            />
          )}
        </MapView>
      }
      bottomSheet={
        <View pointerEvents="box-none">
          {fabs}
          {sheet}
        </View>
      }
    />
  );
}
