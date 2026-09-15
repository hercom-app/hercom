import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { HELP_CONTACTS } from "../constants/helpContacts";
import {
  fetchNearbyHealthCenters,
  formatDistanceKm,
  type NearbyHealthLists,
  type NearbyHealthPlace,
} from "../lib/nearbyHealthCenters";
import { openWazeNavigation } from "../lib/wazeNavigation";
import { detectPickupLocation } from "../lib/pickupLocation";
import {
  TacticalLabel,
  TacticalStatus,
  TacticalText,
  TacticalTitle,
} from "./tactical";
import {
  MONO,
  TACTICAL_BORDER,
  TACTICAL_BORDER_SOFT,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";

type HelpFabProps = {
  /** Coordenadas de respaldo si el GPS falla (ej. origen del viaje). */
  fallbackCenter?: { lat: number; lng: number };
};

const EMPTY_LISTS: NearbyHealthLists = { hospitals: [], clinics: [] };

/** Botón flotante derecho de ayuda + menú de emergencia. */
export function HelpFab({ fallbackCenter }: HelpFabProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [lists, setLists] = useState<NearbyHealthLists>(EMPTY_LISTS);

  async function handleCallPolice() {
    setMenuOpen(false);
    await Linking.openURL(`tel:${HELP_CONTACTS.policePhone}`);
  }

  async function handleNearestHealth() {
    setMenuOpen(false);
    setHealthOpen(true);
    setHealthLoading(true);
    setHealthError(null);
    setLists(EMPTY_LISTS);
    try {
      let lat = fallbackCenter?.lat;
      let lng = fallbackCenter?.lng;
      try {
        const gps = await detectPickupLocation();
        lat = gps.lat;
        lng = gps.lng;
      } catch {
        if (lat === undefined || lng === undefined) {
          throw new Error(
            "Activa el GPS o define un origen para buscar cerca.",
          );
        }
      }
      const results = await fetchNearbyHealthCenters(lat!, lng!);
      setLists(results);
      if (results.hospitals.length === 0 && results.clinics.length === 0) {
        setHealthError("No se encontraron hospitales o clínicas cerca.");
      }
    } catch (error) {
      setHealthError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar hospitales o clínicas.",
      );
    } finally {
      setHealthLoading(false);
    }
  }

  async function handleSelectPlace(place: NearbyHealthPlace) {
    setHealthOpen(false);
    await openWazeNavigation({
      address: place.address,
      lat: place.lat,
      lng: place.lng,
    });
  }

  const hasResults =
    lists.hospitals.length > 0 || lists.clinics.length > 0;

  return (
    <>
      <TouchableOpacity
        onPress={() => setMenuOpen(true)}
        accessibilityLabel="Ayuda y emergencia"
        activeOpacity={0.85}
        className="h-14 w-14 items-center justify-center"
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 999,
          shadowColor: "#0F172A",
          shadowOpacity: 0.12,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        <Text
          style={{
            fontFamily: MONO.bold,
            fontSize: 22,
            color: TACTICAL_COLORS.accent,
          }}
        >
          ?
        </Text>
      </TouchableOpacity>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.45)" }}
          onPress={() => setMenuOpen(false)}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="px-5 pb-8 pt-3"
            style={{
              backgroundColor: TACTICAL_COLORS.base,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            <View className="mb-5 items-center">
              <View
                className="h-1 w-10 rounded-full"
                style={{ backgroundColor: TACTICAL_BORDER_SOFT }}
              />
            </View>
            <TacticalTitle size={22}>¿Necesitas ayuda?</TacticalTitle>
            <TacticalText size={15} className="mb-5 mt-2">
              Contacta a emergencias o encuentra atención médica cerca. Para
              soporte de la app, usa Ayuda en el menú.
            </TacticalText>

            <TouchableOpacity
              onPress={() => void handleCallPolice()}
              className="mb-3 px-4 py-4"
              style={{
                borderRadius: TACTICAL_RADIUS.panel,
                backgroundColor: TACTICAL_COLORS.surface,
                shadowColor: "#0F172A",
                shadowOpacity: 0.06,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              <TacticalLabel tone="text">Llamar a la policía</TacticalLabel>
              <TacticalText size={15} className="mt-1">
                {`Marca el ${HELP_CONTACTS.policePhone}`}
              </TacticalText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => void handleNearestHealth()}
              className="px-4 py-4"
              style={{
                borderRadius: TACTICAL_RADIUS.panel,
                backgroundColor: TACTICAL_COLORS.dataBandBg,
              }}
            >
              <TacticalLabel tone="accent">
                Hospital o clínica cercana
              </TacticalLabel>
              <TacticalText size={15} className="mt-1">
                Te guiamos con Waze
              </TacticalText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMenuOpen(false)}
              className="mt-5 py-3"
            >
              <TacticalLabel className="text-center">Cerrar</TacticalLabel>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={healthOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setHealthOpen(false)}
      >
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(17, 22, 34, 0.72)" }}
        >
          <View
            className="max-h-[75%] px-5 pb-8 pt-3"
            style={{
              backgroundColor: TACTICAL_COLORS.base,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            <View className="mb-3 flex-row items-center justify-between">
              <TacticalTitle size={17}>Hospitales y clínicas</TacticalTitle>
              <TouchableOpacity onPress={() => setHealthOpen(false)}>
                <TacticalLabel tone="accent">Cerrar</TacticalLabel>
              </TouchableOpacity>
            </View>

            {healthLoading && (
              <View className="items-center py-10">
                <ActivityIndicator color={TACTICAL_COLORS.danger} />
                <TacticalText size={12} className="mt-3">
                  Buscando hospitales y clínicas…
                </TacticalText>
              </View>
            )}

            {healthError !== null && !healthLoading && (
              <Text
                className="py-6 text-center text-xs"
                style={{ fontFamily: MONO.medium, color: TACTICAL_COLORS.danger }}
              >
                {healthError}
              </Text>
            )}

            {!healthLoading && hasResults && (
              <View style={{ maxHeight: "100%" }}>
                {lists.hospitals.length > 0 && (
                  <PlaceSection
                    title="Hospitales"
                    places={lists.hospitals}
                    onSelect={handleSelectPlace}
                  />
                )}
                {lists.clinics.length > 0 && (
                  <PlaceSection
                    title="Clínicas"
                    places={lists.clinics}
                    onSelect={handleSelectPlace}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

function PlaceSection({
  title,
  places,
  onSelect,
}: {
  title: string;
  places: NearbyHealthPlace[];
  onSelect: (place: NearbyHealthPlace) => void;
}) {
  const canScroll = places.length > 2;

  return (
    <View className="mb-3">
      <TacticalLabel className="mb-2">
        {`${title} · ${places.length}`}
      </TacticalLabel>
      <View
        className="overflow-hidden"
        style={{
          borderRadius: TACTICAL_RADIUS.panel,
          borderWidth: 1,
          borderColor: TACTICAL_BORDER,
        }}
      >
        <ScrollView
          style={{ maxHeight: 220 }}
          nestedScrollEnabled
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          {places.map((place) => (
            <TouchableOpacity
              key={place.placeId}
              onPress={() => void onSelect(place)}
              className="mb-px px-4 py-3"
              style={{
                backgroundColor: TACTICAL_COLORS.surface,
                borderBottomWidth: 1,
                borderBottomColor: TACTICAL_BORDER_SOFT,
              }}
            >
              <TacticalLabel tone="text">
                {place.name}
              </TacticalLabel>
              <TacticalText size={11} className="mt-0.5">
                {place.address}
              </TacticalText>
              <View className="mt-1.5 flex-row flex-wrap items-center gap-2">
                <TacticalStatus
                  label={formatDistanceKm(place.distanceMeters)}
                  tone="idle"
                />
                {place.openNow === true && (
                  <TacticalStatus label="Abierto ahora" tone="success" />
                )}
                {place.openNow === false && (
                  <TacticalStatus label="Cerrado ahora" tone="warning" />
                )}
                <TacticalLabel tone="accent">
                  Waze →
                </TacticalLabel>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {canScroll && (
          <View
            className="items-center py-2.5"
            style={{
              borderTopWidth: 1,
              borderTopColor: TACTICAL_BORDER_SOFT,
              backgroundColor: TACTICAL_COLORS.baseElevated,
            }}
          >
            <View
              className="h-2 w-2"
              style={{ backgroundColor: TACTICAL_COLORS.steel }}
            />
            <View
              className="mt-1 h-1.5 w-1.5"
              style={{ backgroundColor: TACTICAL_COLORS.steel, opacity: 0.5 }}
            />
          </View>
        )}
      </View>
    </View>
  );
}
