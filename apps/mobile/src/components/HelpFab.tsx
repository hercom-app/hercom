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

  async function handleSupport() {
    setMenuOpen(false);
    try {
      const canWhatsApp = await Linking.canOpenURL(HELP_CONTACTS.supportWhatsAppUrl);
      if (canWhatsApp) {
        await Linking.openURL(HELP_CONTACTS.supportWhatsAppUrl);
        return;
      }
    } catch {
      // fallback teléfono
    }
    await Linking.openURL(`tel:${HELP_CONTACTS.supportPhone}`);
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
        className="h-12 min-w-12 items-center justify-center rounded-full bg-red-600 px-2.5"
        style={{
          shadowColor: "#0F172A",
          shadowOpacity: 0.18,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }}
      >
        <Text className="text-[10px] font-extrabold tracking-wide text-white">
          AYUDA
        </Text>
      </TouchableOpacity>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setMenuOpen(false)}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="rounded-t-3xl bg-white px-5 pb-8 pt-4"
          >
            <View className="mb-4 items-center">
              <View className="h-1 w-10 rounded-full bg-slate-300" />
            </View>
            <Text className="mb-1 text-lg font-bold text-slate-900">Ayuda</Text>
            <Text className="mb-4 text-sm text-slate-500">
              Soporte y opciones de emergencia
            </Text>

            <TouchableOpacity
              onPress={() => void handleSupport()}
              className="mb-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
            >
              <Text className="text-base font-semibold text-slate-900">
                Soporte
              </Text>
              <Text className="mt-0.5 text-xs text-slate-500">
                Contactar a {HELP_CONTACTS.supportLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => void handleCallPolice()}
              className="mb-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
            >
              <Text className="text-base font-semibold text-slate-900">
                Llamar a la policía
              </Text>
              <Text className="mt-0.5 text-xs text-slate-500">
                Marca el {HELP_CONTACTS.policePhone}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => void handleNearestHealth()}
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4"
            >
              <Text className="text-base font-semibold text-red-700">
                Ir a hospital o clínica cercana
              </Text>
              <Text className="mt-0.5 text-xs text-red-600/80">
                Busca hospitales y clínicas cerca
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMenuOpen(false)}
              className="mt-4 py-3"
            >
              <Text className="text-center text-sm font-semibold text-slate-500">
                Cerrar
              </Text>
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
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[75%] rounded-t-3xl bg-white px-5 pb-8 pt-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-red-700">
                Hospitales y clínicas
              </Text>
              <TouchableOpacity onPress={() => setHealthOpen(false)}>
                <Text className="text-sm font-semibold text-slate-500">
                  Cerrar
                </Text>
              </TouchableOpacity>
            </View>

            {healthLoading && (
              <View className="items-center py-10">
                <ActivityIndicator color="#DC2626" />
                <Text className="mt-3 text-sm text-slate-500">
                  Buscando hospitales y clínicas…
                </Text>
              </View>
            )}

            {healthError !== null && !healthLoading && (
              <Text className="py-6 text-center text-sm text-red-600">
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
      <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        {title} · {places.length}
      </Text>
      <View className="overflow-hidden rounded-2xl border border-slate-100">
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
              className="mb-2 rounded-2xl border border-red-100 bg-red-50/50 px-4 py-3"
            >
              <Text className="text-sm font-semibold text-slate-900">
                {place.name}
              </Text>
              <Text className="mt-0.5 text-xs text-slate-600">{place.address}</Text>
              <View className="mt-1.5 flex-row flex-wrap items-center gap-2">
                <Text className="text-xs font-semibold text-slate-700">
                  {formatDistanceKm(place.distanceMeters)}
                </Text>
                {place.openNow === true && (
                  <Text className="text-xs font-semibold text-emerald-700">
                    Abierto ahora
                  </Text>
                )}
                {place.openNow === false && (
                  <Text className="text-xs font-semibold text-amber-700">
                    Cerrado ahora
                  </Text>
                )}
                <Text className="text-xs font-semibold text-red-700">
                  Abrir en Waze →
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {canScroll && (
          <View className="items-center border-t border-slate-100 bg-white py-2.5">
            <View className="h-2 w-2 rounded-full bg-slate-400" />
            <View className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300" />
          </View>
        )}
      </View>
    </View>
  );
}
