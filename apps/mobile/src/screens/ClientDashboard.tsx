import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc } from "@proyecto/backend/dataModel";
import { AddressAutocomplete } from "../components/AddressAutocomplete";
import { HamburgerButton } from "../components/HamburgerButton";
import { HelpFab } from "../components/HelpFab";
import { SideDrawer } from "../components/SideDrawer";
import {
  addressDraftFromText,
  createEmptyAddressDraft,
  toServiceLocation,
  type AddressDraft,
} from "../lib/addressDraft";
import type { SelectedPlace } from "../lib/googlePlaces";
import {
  applyPickupLocationResult,
  detectPickupLocation,
  openDeviceLocationSettings,
} from "../lib/pickupLocation";
import { formatServiceStopsLabel } from "../lib/wazeNavigation";
import { useAppMode } from "../contexts/AppModeContext";
import { HERCOM_COLORS } from "../constants/theme";

const HOURLY_SERVICE_RATE = 40;
const MIN_SERVICE_HOURS = 2;
const MIN_SERVICE_PRICE = HOURLY_SERVICE_RATE * MIN_SERVICE_HOURS;
const CLIENT_ADVANCE_RATE = 0.25;
const LIMA_REGION = {
  latitude: -12.0464,
  longitude: -77.0428,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};

const STATUS_LABELS: Record<Doc<"services">["status"], string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  heading_to_pickup: "Yendo a recoger",
  arrived_pickup: "Chofer en punto de partida",
  in_progress: "En viaje",
  arrived_destination: "Llegada al destino",
  en_route: "En camino",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

function ClientServiceCard({ service }: { service: Doc<"services"> }) {
  const cancelService = useMutation(api.services.cancelService);
  const acceptOffer = useMutation(api.serviceOffers.acceptOffer);
  const offers = useQuery(
    api.serviceOffers.listForServiceAsClient,
    service.status === "pending" ? { serviceId: service._id } : "skip",
  );
  const [cancelling, setCancelling] = useState(false);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
  const [offerError, setOfferError] = useState<string | null>(null);

  const advanceAmount =
    service.advanceAmount ??
    (service.offeredPrice !== undefined
      ? Math.round(service.offeredPrice * CLIENT_ADVANCE_RATE * 100) / 100
      : 0);
  const advanceConfirmed = service.advanceConfirmedAt !== undefined;

  const canCancel =
    service.status === "pending" ||
    service.status === "assigned" ||
    service.status === "heading_to_pickup" ||
    service.status === "arrived_pickup" ||
    service.status === "en_route";

  async function handleCancel() {
    setCancelling(true);
    try {
      await cancelService({ serviceId: service._id });
    } finally {
      setCancelling(false);
    }
  }

  return (
    <View className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-xs font-semibold uppercase text-hercom">
            {STATUS_LABELS[service.status]}
          </Text>
          {(service.serviceType ?? "app") === "app" && (
            <Text className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
              App
            </Text>
          )}
        </View>
        <Text className="text-sm font-bold text-slate-900">
          S/{service.totalPrice.toFixed(2)}
        </Text>
      </View>
      <Text className="mb-1 text-xs text-slate-500">
        Tarifa base: S/{service.basePrice.toFixed(2)}
        {service.catalogBasePrice !== undefined &&
        service.catalogBasePrice > service.basePrice ? (
          <Text className="text-violet-700">
            {" "}
            (lista S/{service.catalogBasePrice.toFixed(2)}
            {service.discountRate !== undefined
              ? ` · -${(service.discountRate * 100).toFixed(0)}%`
              : ""}
            )
          </Text>
        ) : null}
        {service.offeredPrice !== undefined
          ? ` · Acordada: S/${service.offeredPrice.toFixed(2)}`
          : ""}
      </Text>
      {service.promotionName !== undefined && (
        <Text className="mb-1 text-xs font-semibold text-violet-700">
          Promo: {service.promotionName}
        </Text>
      )}
      <Text className="text-sm text-slate-700">
        {service.origin.address} →{" "}
        {formatServiceStopsLabel(service.destination, service.extraDestinations)}
      </Text>
      {service.status === "assigned" && service.offeredPrice !== undefined && (
        <View className="mt-2 rounded-xl bg-amber-50 p-3">
          <Text className="text-xs font-semibold text-amber-900">
            Anticipo al chofer: S/{advanceAmount.toFixed(2)} (25% de la tarifa)
          </Text>
          <Text className="mt-1 text-xs text-amber-800">
            Entrégalo al chofer antes de que salga a recogerte.
          </Text>
          {advanceConfirmed && (
            <Text className="mt-2 text-xs font-semibold text-emerald-700">
              ✓ El chofer confirmó que recibió el anticipo
            </Text>
          )}
        </View>
      )}
      {service.securityCode !== undefined &&
        service.status !== "finished" &&
        service.status !== "cancelled" && (
          <View className="mt-2 rounded-xl bg-indigo-50 p-3">
            <Text className="text-xs text-indigo-700">
              Código de seguridad para iniciar viaje:{" "}
              <Text className="font-bold text-indigo-900">{service.securityCode}</Text>
            </Text>
          </View>
        )}
      {service.status === "pending" && (
        <View className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <Text className="mb-2 text-xs font-semibold text-slate-600">
            Ofertas de choferes
          </Text>
          {offers === undefined ? (
            <Text className="text-xs text-slate-500">Cargando ofertas...</Text>
          ) : offers.length === 0 ? (
            <Text className="text-xs text-slate-500">
              Aún no hay ofertas para este servicio.
            </Text>
          ) : (
            offers
              .filter((offer) => offer.status === "pending")
              .map((offer) => (
                <View
                  key={offer._id}
                  className="mb-2 rounded-lg border border-slate-200 bg-white p-2"
                >
                  <Text className="text-xs text-slate-700">
                    Placa {offer.driverPlate} · Rating {offer.driverRating.toFixed(1)}★
                  </Text>
                  <Text className="mt-0.5 text-sm font-semibold text-slate-900">
                    Tarifa ofertada: S/{offer.offeredPrice.toFixed(2)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setAcceptingOfferId(offer._id);
                      setOfferError(null);
                      void acceptOffer({
                        serviceId: service._id,
                        offerId: offer._id,
                      })
                        .catch((error) =>
                          setOfferError(
                            error instanceof Error
                              ? error.message
                              : "No se pudo aceptar la oferta.",
                          ),
                        )
                        .finally(() => setAcceptingOfferId(null));
                    }}
                    disabled={acceptingOfferId === offer._id}
                    className="mt-2 rounded-lg bg-hercom py-1.5 disabled:opacity-60"
                  >
                    <Text className="text-center text-xs font-bold uppercase text-white">
                      {acceptingOfferId === offer._id ? "Aceptando..." : "Elegir chofer"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
          )}
          {offerError !== null && (
            <Text className="mt-1 text-xs font-medium text-red-600">{offerError}</Text>
          )}
        </View>
      )}
      {canCancel && (
        <TouchableOpacity
          onPress={() => void handleCancel()}
          disabled={cancelling}
          className="mt-3 rounded-xl border border-red-200 py-2 disabled:opacity-60"
        >
          <Text className="text-center text-sm font-semibold text-red-600">
            {cancelling ? "Cancelando..." : "Cancelar solicitud"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Panel cliente: mapa + bottom sheet (estilo inDrive / Yango). */
export function ClientDashboard() {
  const insets = useSafeAreaInsets();
  const { userName } = useAppMode();
  const services = useQuery(api.services.listForClient, {});
  const createService = useMutation(api.services.createService);
  const markAllNotificationsAsRead = useMutation(api.notifications.markAllAsRead);
  const notifications = useQuery(api.notifications.listMine, { limit: 8 });

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuSection, setMenuSection] = useState("ciudad");
  const [origin, setOrigin] = useState("");
  const [originLat, setOriginLat] = useState<number | null>(null);
  const [originLng, setOriginLng] = useState<number | null>(null);
  const [originPlaceId, setOriginPlaceId] = useState<string | null>(null);
  const [detectedRegionLabel, setDetectedRegionLabel] = useState("");
  const [destination, setDestination] = useState<AddressDraft>(createEmptyAddressDraft());
  const [extraDestinations, setExtraDestinations] = useState<AddressDraft[]>([]);
  const [basePrice, setBasePrice] = useState("");
  const [department, setDepartment] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const unreadNotifications = (notifications ?? []).filter(
    (notification) => notification.readAt === undefined,
  ).length;
  const requestedBasePrice = Number(basePrice);
  const addressRegion = {
    department,
    ...(province !== "" ? { province } : {}),
    ...(district !== "" ? { district } : {}),
  };
  const gpsBias =
    originLat !== null && originLng !== null
      ? { lat: originLat, lng: originLng }
      : undefined;
  const mapRegion =
    originLat !== null && originLng !== null
      ? {
          latitude: originLat,
          longitude: originLng,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }
      : LIMA_REGION;

  function applySelectedPlace(
    place: SelectedPlace,
    setters: {
      setAddress: (value: string) => void;
      setLat: (value: number) => void;
      setLng: (value: number) => void;
      setPlaceId: (value: string) => void;
    },
  ) {
    setters.setAddress(place.address);
    setters.setLat(place.lat);
    setters.setLng(place.lng);
    setters.setPlaceId(place.placeId);
  }

  function updateDestinationDraft(
    index: number | null,
    updater: (current: AddressDraft) => AddressDraft,
  ) {
    if (index === null) {
      setDestination((current) => updater(current));
      return;
    }
    setExtraDestinations((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index ? updater(item) : item,
      ),
    );
  }
  const promoPreview = useQuery(
    api.promotions.previewForRegion,
    department !== "" &&
      Number.isFinite(requestedBasePrice) &&
      requestedBasePrice >= MIN_SERVICE_PRICE
      ? {
          department,
          ...(province !== "" ? { province } : {}),
          ...(district !== "" ? { district } : {}),
          listPrice: requestedBasePrice,
        }
      : "skip",
  );

  async function handleUseMyLocationForOrigin() {
    setLocationLoading(true);
    setError(null);
    try {
      const result = await detectPickupLocation();
      applyPickupLocationResult(result, {
        setOrigin,
        setOriginLat,
        setOriginLng,
        setDepartment,
        setProvince,
        setDistrict,
        setDetectedRegionLabel,
      });
      setOriginPlaceId(null);
      setShowRegionPicker(false);
    } catch (locationError) {
      const message =
        locationError instanceof Error
          ? locationError.message
          : "No se pudo obtener tu ubicación.";
      setError(message);
      if (
        message.includes("bloqueada") ||
        message.includes("GPS") ||
        message.includes("permiso")
      ) {
        Alert.alert("Ubicación necesaria", message, [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Abrir ajustes",
            onPress: () => void openDeviceLocationSettings(),
          },
        ]);
      }
    } finally {
      setLocationLoading(false);
    }
  }

  async function handleSubmit() {
    if (
      origin.trim() === "" ||
      destination.address.trim() === "" ||
      department === "" ||
      !Number.isFinite(requestedBasePrice) ||
      requestedBasePrice < MIN_SERVICE_PRICE
    ) {
      setError(
        `Completa origen, destino y tarifa mínima S/${MIN_SERVICE_PRICE}. Usa ubicación o elige una sugerencia de dirección.`,
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const cleanedExtraDestinations = extraDestinations
        .map((stop) => toServiceLocation(stop))
        .filter((stop) => stop.address !== "");

      await createService({
        origin: {
          address: origin.trim(),
          lat: originLat ?? 0,
          lng: originLng ?? 0,
          department,
          ...(province !== "" ? { province } : {}),
          ...(district !== "" ? { district } : {}),
        },
        destination: toServiceLocation(destination),
        ...(cleanedExtraDestinations.length > 0
          ? { extraDestinations: cleanedExtraDestinations }
          : {}),
        basePrice: requestedBasePrice,
        ...(notes.trim() !== "" ? { notes: notes.trim() } : {}),
      });
      setOrigin("");
      setOriginLat(null);
      setOriginLng(null);
      setOriginPlaceId(null);
      setDetectedRegionLabel("");
      setDestination(createEmptyAddressDraft());
      setExtraDestinations([]);
      setBasePrice("");
      setDepartment("");
      setProvince("");
      setDistrict("");
      setNotes("");
      setMessage("Solicitud enviada. Espera ofertas y elige un chofer.");
    } catch {
      setError("No se pudo crear la solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-slate-100">
      <MapView
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        region={mapRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {originLat !== null && originLng !== null && (
          <Marker
            coordinate={{ latitude: originLat, longitude: originLng }}
            title="Recojo"
            pinColor={HERCOM_COLORS.primary}
          />
        )}
        {destination.lat !== null && destination.lng !== null && (
          <Marker
            coordinate={{
              latitude: destination.lat,
              longitude: destination.lng,
            }}
            title="Destino"
          />
        )}
      </MapView>

      <View
        pointerEvents="box-none"
        style={{ paddingTop: insets.top + 8 }}
        className="absolute left-0 right-0 top-0 z-10 px-4"
      >
        <View className="flex-row items-start gap-3">
          <HamburgerButton onPress={() => setMenuOpen(true)} />
          <View
            className="min-h-12 flex-1 justify-center rounded-2xl bg-white px-4 py-2.5"
            style={{
              shadowColor: "#0F172A",
              shadowOpacity: 0.1,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3,
            }}
          >
            <Text className="text-[11px] font-medium text-slate-500">
              De dónde
            </Text>
            <Text className="text-sm font-semibold text-slate-900" numberOfLines={1}>
              {origin.trim() !== "" ? origin : "Define tu punto de recojo"}
            </Text>
          </View>
          <HelpFab
            fallbackCenter={
              originLat !== null && originLng !== null
                ? { lat: originLat, lng: originLng }
                : undefined
            }
          />
        </View>
      </View>

      <View
        className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden rounded-t-[28px] bg-white"
        style={{
          maxHeight: "62%",
          paddingBottom: insets.bottom + 8,
          shadowColor: "#0F172A",
          shadowOpacity: 0.14,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        }}
      >
        <View className="items-center pb-1 pt-3">
          <View className="h-1 w-10 rounded-full bg-slate-300" />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-4 pb-6"
        >
          <Text className="mb-1 text-lg font-bold text-slate-900">
            ¿Dónde necesitas un chofer de reemplazo?
          </Text>
          <Text className="mb-4 text-sm text-slate-500">
            Tarifa base S/{HOURLY_SERVICE_RATE}/h · mínimo {MIN_SERVICE_HOURS}h =
            S/{MIN_SERVICE_PRICE}
          </Text>

          {(menuSection === "notificaciones" || unreadNotifications > 0) && (
            <View className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-slate-900">
                  Notificaciones ({unreadNotifications})
                </Text>
                <TouchableOpacity onPress={() => void markAllNotificationsAsRead()}>
                  <Text className="text-xs font-semibold text-slate-500">
                    Marcar leídas
                  </Text>
                </TouchableOpacity>
              </View>
              {(notifications ?? []).length === 0 ? (
                <Text className="text-xs text-slate-500">Sin notificaciones.</Text>
              ) : (
                (notifications ?? []).slice(0, 3).map((notification) => (
                  <View key={notification._id} className="mb-2">
                    <Text className="text-xs font-semibold text-slate-800">
                      {notification.title}
                    </Text>
                    <Text className="text-xs text-slate-600">
                      {notification.message}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}

          <View className="gap-3">
            <View>
              <Text className="mb-1.5 text-xs font-semibold text-slate-600">
                Punto de recojo
              </Text>
              <AddressAutocomplete
                value={origin}
                onChangeText={(value) => {
                  setOrigin(value);
                  if (originPlaceId !== null) {
                    setOriginLat(null);
                    setOriginLng(null);
                    setOriginPlaceId(null);
                  }
                }}
                onPlaceSelected={(place) => {
                  applySelectedPlace(place, {
                    setAddress: setOrigin,
                    setLat: setOriginLat,
                    setLng: setOriginLng,
                    setPlaceId: setOriginPlaceId,
                  });
                  setDepartment(place.department ?? department);
                  if (place.province !== undefined) {
                    setProvince(place.province);
                  }
                  if (place.district !== undefined) {
                    setDistrict(place.district);
                  }
                  setDetectedRegionLabel(
                    [place.department, place.province, place.district]
                      .filter(
                        (part): part is string =>
                          part !== undefined && part !== "",
                      )
                      .join(" · "),
                  );
                  setShowRegionPicker(false);
                }}
                onPlaceCleared={() => {
                  setOriginLat(null);
                  setOriginLng(null);
                  setOriginPlaceId(null);
                }}
                placeholder="Buscar dirección de origen"
                region={addressRegion}
                gpsCenter={gpsBias}
                disabled={submitting || locationLoading}
                selectedPlaceId={originPlaceId}
              />
              <TouchableOpacity
                onPress={() => void handleUseMyLocationForOrigin()}
                disabled={locationLoading || submitting}
                className="mt-2 flex-row items-center justify-center rounded-2xl border border-sky-300 bg-sky-50 py-3 disabled:opacity-60"
              >
                {locationLoading ? (
                  <ActivityIndicator color="#0369A1" />
                ) : (
                  <Text className="text-sm font-semibold text-sky-900">
                    📍 Usar mi ubicación actual
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View>
              <Text className="mb-1.5 text-xs font-semibold text-slate-600">
                Destino
              </Text>
              <AddressAutocomplete
                value={destination.address}
                onChangeText={(value) => {
                  updateDestinationDraft(null, () => addressDraftFromText(value));
                }}
                onPlaceSelected={(place) => {
                  updateDestinationDraft(null, () => ({
                    address: place.address,
                    lat: place.lat,
                    lng: place.lng,
                    placeId: place.placeId,
                  }));
                  if (department === "") {
                    setDepartment(place.department ?? "");
                  }
                  if (place.province !== undefined && province === "") {
                    setProvince(place.province);
                  }
                  if (place.district !== undefined && district === "") {
                    setDistrict(place.district);
                  }
                  if (detectedRegionLabel === "") {
                    setDetectedRegionLabel(
                      [place.department, place.province, place.district]
                        .filter(
                          (part): part is string =>
                            part !== undefined && part !== "",
                        )
                        .join(" · "),
                    );
                  }
                }}
                onPlaceCleared={() => {
                  updateDestinationDraft(null, (current) => ({
                    ...current,
                    lat: null,
                    lng: null,
                    placeId: null,
                  }));
                }}
                placeholder="¿A dónde vas?"
                region={addressRegion}
                gpsCenter={gpsBias}
                disabled={submitting}
                selectedPlaceId={destination.placeId}
              />
            </View>

            {extraDestinations.map((stop, index) => (
              <View
                key={`extra-destination-${index}`}
                className="flex-row items-start gap-2"
              >
                <View className="flex-1">
                  <AddressAutocomplete
                    value={stop.address}
                    onChangeText={(value) => {
                      updateDestinationDraft(index, () =>
                        addressDraftFromText(value),
                      );
                    }}
                    onPlaceSelected={(place) => {
                      updateDestinationDraft(index, () => ({
                        address: place.address,
                        lat: place.lat,
                        lng: place.lng,
                        placeId: place.placeId,
                      }));
                    }}
                    onPlaceCleared={() => {
                      updateDestinationDraft(index, (current) => ({
                        ...current,
                        lat: null,
                        lng: null,
                        placeId: null,
                      }));
                    }}
                    placeholder={`Parada ${index + 2} (opcional)`}
                    region={addressRegion}
                    gpsCenter={gpsBias}
                    disabled={submitting}
                    selectedPlaceId={stop.placeId}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setExtraDestinations((previous) =>
                      previous.filter((_, itemIndex) => itemIndex !== index),
                    );
                  }}
                  className="rounded-xl border border-red-200 px-3 py-3"
                >
                  <Text className="text-sm font-semibold text-red-600">✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              onPress={() =>
                setExtraDestinations((previous) => [
                  ...previous,
                  createEmptyAddressDraft(),
                ])
              }
              disabled={submitting}
              className="rounded-2xl border border-dashed border-slate-300 py-2.5 disabled:opacity-60"
            >
              <Text className="text-center text-sm font-semibold text-slate-600">
                + Agregar parada
              </Text>
            </TouchableOpacity>

            <TextInput
              value={basePrice}
              onChangeText={setBasePrice}
              placeholder={`Tu oferta (mín. S/${MIN_SERVICE_PRICE})`}
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
            />
            {promoPreview !== undefined && promoPreview !== null && (
              <View className="rounded-xl bg-emerald-50 px-3 py-2">
                <Text className="text-xs font-semibold text-emerald-800">
                  Promo: {promoPreview.promotionName} (
                  {(promoPreview.discountRate * 100).toFixed(0)}% off)
                </Text>
                <Text className="mt-1 text-xs text-emerald-700">
                  Pagas S/{promoPreview.basePrice.toFixed(2)} (lista S/
                  {promoPreview.catalogBasePrice.toFixed(2)}).
                </Text>
              </View>
            )}
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Notas (opcional)"
              placeholderTextColor="#94A3B8"
              multiline
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
            />
            <TouchableOpacity
              onPress={() => void handleSubmit()}
              disabled={submitting}
              className="items-center rounded-2xl bg-hercom py-3.5 active:opacity-90 disabled:opacity-60"
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-base font-bold text-white">
                  Solicitar servicio
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {message !== null && (
            <Text className="mt-3 text-center text-sm text-green-700">
              {message}
            </Text>
          )}
          {error !== null && (
            <Text className="mt-3 text-center text-sm text-red-600">{error}</Text>
          )}

          <Text className="mb-3 mt-6 text-base font-bold text-slate-900">
            Mis servicios
          </Text>
          {services === undefined ? (
            <ActivityIndicator color="#007AFF" />
          ) : services.length === 0 ? (
            <Text className="text-center text-sm text-slate-500">
              Aún no tienes solicitudes.
            </Text>
          ) : (
            services.map((service) => (
              <ClientServiceCard key={service._id} service={service} />
            ))
          )}
        </ScrollView>
      </View>

      <SideDrawer
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        userName={userName}
        unreadCount={unreadNotifications}
        activeItem={menuSection === "historial" ? "historial" : "ciudad"}
        onSelectItem={(key) => {
          setMenuSection(key);
          if (key === "historial") {
            // scroll stays in sheet; Mis servicios is already listed
          }
        }}
      />
    </View>
  );
}
