import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc } from "@proyecto/backend/dataModel";
import { AddressAutocomplete } from "../components/AddressAutocomplete";
import { HamburgerButton } from "../components/HamburgerButton";
import { HelpFab } from "../components/HelpFab";
import { HercomLogo } from "../components/HercomLogo";
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
  ensureLocationAccess,
  openDeviceLocationSettings,
} from "../lib/pickupLocation";
import { formatServiceStopsLabel } from "../lib/wazeNavigation";
import { useAppMode } from "../contexts/AppModeContext";
import { HERCOM_COLORS } from "../constants/theme";
import * as Location from "expo-location";

const HOURLY_SERVICE_RATE = 40;
const MIN_SERVICE_HOURS = 2;
const MIN_SERVICE_PRICE = HOURLY_SERVICE_RATE * MIN_SERVICE_HOURS;
const CLIENT_ADVANCE_RATE = 0.25;
const SERVICE_HOUR_OPTIONS = [2, 3, 4, 5, 6, 8] as const;
const LIMA_REGION = {
  latitude: -12.0464,
  longitude: -77.0428,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};

const RISK_MESSAGES = [
  "EVITA LA MULTA DE 5500 SOLES.",
  "EN EL PERU HAY 8000 ACCIDENTES AL AÑO POR MANEJAR EN ESTADO DE EBRIEDAD, 4000 DE ELLOS TERMINAN EN MUERTES.",
  "EVITA IR A LA CARCEL",
] as const;

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

function PayoutLine({ label, value }: { label: string; value: string }) {
  return (
    <Text className="text-xs text-slate-700">
      <Text className="font-semibold text-slate-800">{label}: </Text>
      {value}
    </Text>
  );
}

function ClientServiceCard({
  service,
}: {
  service: Doc<"services"> & { driverName?: string };
}) {
  const cancelService = useMutation(api.services.cancelService);
  const acceptOffer = useMutation(api.serviceOffers.acceptOffer);
  const offers = useQuery(
    api.serviceOffers.listForServiceAsClient,
    service.status === "pending" ? { serviceId: service._id } : "skip",
  );
  const driverPayout = useQuery(
    api.drivers.getPayoutForClientService,
    service.status === "assigned" && service.driverId !== undefined
      ? { serviceId: service._id }
      : "skip",
  );
  const [cancelling, setCancelling] = useState(false);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
  const [offerError, setOfferError] = useState<string | null>(null);

  const agreedPrice = service.offeredPrice ?? service.totalPrice;
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
    <View className="mb-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
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
          {service.offeredPrice !== undefined
            ? `S/${agreedPrice.toFixed(2)}`
            : "Sin acordar"}
        </Text>
      </View>
      <Text className="mb-1 text-xs text-slate-600">
        {service.offeredPrice !== undefined
          ? `Tarifa acordada: S/${service.offeredPrice.toFixed(2)}`
          : "Esperando acuerdo de tarifa"}
      </Text>
      <Text className="mb-1 text-xs font-medium text-slate-800">
        {service.driverName !== undefined
          ? `Chofer: ${service.driverName}`
          : "Sin chofer asignado"}
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
            Transfiérelo con estos datos antes de que salga a recogerte.
          </Text>
          {driverPayout === undefined ? (
            <Text className="mt-2 text-xs text-amber-700">
              Cargando datos del chofer…
            </Text>
          ) : driverPayout === null ? (
            <Text className="mt-2 text-xs text-amber-700">
              Sin datos del chofer aún.
            </Text>
          ) : (
            <View className="mt-2 gap-1 rounded-lg border border-amber-200 bg-white/70 p-2">
              <PayoutLine label="Nombres" value={driverPayout.fullName} />
              <PayoutLine
                label="DNI"
                value={driverPayout.dni !== "" ? driverPayout.dni : "Pendiente"}
              />
              <PayoutLine
                label="Yape"
                value={driverPayout.yape !== "" ? driverPayout.yape : "—"}
              />
              <PayoutLine
                label="Plin"
                value={driverPayout.plin !== "" ? driverPayout.plin : "—"}
              />
              <PayoutLine
                label="Cuenta banco 1"
                value={
                  driverPayout.bankAccount1 !== ""
                    ? driverPayout.bankAccount1
                    : "—"
                }
              />
              <PayoutLine
                label="Cuenta banco 2"
                value={
                  driverPayout.bankAccount2 !== ""
                    ? driverPayout.bankAccount2
                    : "—"
                }
              />
              <PayoutLine
                label="Cuenta banco 3"
                value={
                  driverPayout.bankAccount3 !== ""
                    ? driverPayout.bankAccount3
                    : "—"
                }
              />
            </View>
          )}
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
                    {offer.driverName} · {offer.driverRating.toFixed(1)}★
                    {offer.driverTrips > 0
                      ? ` · ${offer.driverTrips} servicios`
                      : ""}
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

function fitMapRegion(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
) {
  const midLat = (origin.lat + destination.lat) / 2;
  const midLng = (origin.lng + destination.lng) / 2;
  const latDelta = Math.max(Math.abs(origin.lat - destination.lat) * 1.8, 0.04);
  const lngDelta = Math.max(Math.abs(origin.lng - destination.lng) * 1.8, 0.04);
  return {
    latitude: midLat,
    longitude: midLng,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

/** Panel cliente: flujo Yango (motivos → mapa → horas/tarifa). */
export function ClientDashboard() {
  const insets = useSafeAreaInsets();
  const { userName } = useAppMode();
  const services = useQuery(api.services.listForClient, {});
  const createService = useMutation(api.services.createService);
  const markAllNotificationsAsRead = useMutation(api.notifications.markAllAsRead);
  const notifications = useQuery(api.notifications.listMine, { limit: 8 });

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuSection, setMenuSection] = useState("ciudad");
  const [flowStep, setFlowStep] = useState<"compose" | "confirm">("compose");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  /** null = landing; al abrir búsqueda no se enfoca un TextInput que luego pierda el foco por el layout. */
  const [addressSearchField, setAddressSearchField] = useState<
    null | "origin" | "destination" | number
  >(null);
  const addressSearchActive = addressSearchField !== null;
  const sheetScrollRef = useRef<ScrollView>(null);
  const [origin, setOrigin] = useState("");
  const [originLat, setOriginLat] = useState<number | null>(null);
  const [originLng, setOriginLng] = useState<number | null>(null);
  const [originPlaceId, setOriginPlaceId] = useState<string | null>(null);
  const [destination, setDestination] = useState<AddressDraft>(
    createEmptyAddressDraft(),
  );
  const [extraDestinations, setExtraDestinations] = useState<AddressDraft[]>([]);
  const [serviceHours, setServiceHours] = useState<number>(MIN_SERVICE_HOURS);
  const [department, setDepartment] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showsBlueDot, setShowsBlueDot] = useState(false);

  const unreadNotifications = (notifications ?? []).filter(
    (notification) => notification.readAt === undefined,
  ).length;
  const listPrice = serviceHours * HOURLY_SERVICE_RATE;
  const addressRegion = {
    department,
    ...(province !== "" ? { province } : {}),
    ...(district !== "" ? { district } : {}),
  };
  const gpsBias =
    originLat !== null && originLng !== null
      ? { lat: originLat, lng: originLng }
      : undefined;

  const canContinue =
    origin.trim() !== "" &&
    originLat !== null &&
    originLng !== null &&
    destination.address.trim() !== "" &&
    destination.lat !== null &&
    destination.lng !== null;

  const confirmMapRegion =
    originLat !== null &&
    originLng !== null &&
    destination.lat !== null &&
    destination.lng !== null
      ? fitMapRegion(
          { lat: originLat, lng: originLng },
          { lat: destination.lat, lng: destination.lng },
        )
      : userCoords !== null
        ? {
            latitude: userCoords.lat,
            longitude: userCoords.lng,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }
        : LIMA_REGION;

  const windowHeight = Dimensions.get("window").height;
  const composeExpandedHeight = Math.max(520, windowHeight * 0.92);

  const promoPreview = useQuery(
    api.promotions.previewForRegion,
    department !== "" && listPrice >= MIN_SERVICE_PRICE
      ? {
          department,
          ...(province !== "" ? { province } : {}),
          ...(district !== "" ? { district } : {}),
          listPrice,
        }
      : "skip",
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await ensureLocationAccess();
        if (cancelled) return;
        setShowsBlueDot(true);
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      } catch {
        if (!cancelled) {
          setShowsBlueDot(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

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

  function openAddressSearch(field: "origin" | "destination" | number) {
    setError(null);
    setAddressSearchField(field);
  }

  function closeAddressSearch() {
    Keyboard.dismiss();
    setAddressSearchField(null);
  }

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
        setDetectedRegionLabel: () => {
          /* región se guarda en department/province/district */
        },
      });
      setOriginPlaceId(null);
    } catch (locationError) {
      const msg =
        locationError instanceof Error
          ? locationError.message
          : "No se pudo obtener tu ubicación.";
      setError(msg);
      if (
        msg.includes("bloqueada") ||
        msg.includes("GPS") ||
        msg.includes("permiso")
      ) {
        Alert.alert("Ubicación necesaria", msg, [
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

  function handleContinueToConfirm() {
    if (!canContinue) {
      setError(
        "Completa origen y destino eligiendo una sugerencia de dirección.",
      );
      return;
    }
    setError(null);
    setMessage(null);
    setAddressSearchField(null);
    setFlowStep("confirm");
  }

  function resetComposeForm() {
    setOrigin("");
    setOriginLat(null);
    setOriginLng(null);
    setOriginPlaceId(null);
    setDestination(createEmptyAddressDraft());
    setExtraDestinations([]);
    setServiceHours(MIN_SERVICE_HOURS);
    setDepartment("");
    setProvince("");
    setDistrict("");
    setNotes("");
    setFlowStep("compose");
  }

  async function handleSubmit() {
    if (
      origin.trim() === "" ||
      destination.address.trim() === "" ||
      department === "" ||
      listPrice < MIN_SERVICE_PRICE
    ) {
      setError(
        `Completa origen, destino y al menos ${MIN_SERVICE_HOURS}h (S/${MIN_SERVICE_PRICE}).`,
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
        basePrice: listPrice,
        ...(notes.trim() !== "" ? { notes: notes.trim() } : {}),
      });
      resetComposeForm();
      setMessage("Solicitud enviada. Espera ofertas y elige un chofer.");
      setMenuSection("historial");
    } catch {
      setError("No se pudo crear la solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  const drawer = (
    <SideDrawer
      visible={menuOpen}
      onClose={() => setMenuOpen(false)}
      userName={userName}
      unreadCount={unreadNotifications}
      activeItem={menuSection}
      onSelectItem={(key) => {
        setMenuSection(key);
        if (key === "ciudad") {
          setFlowStep("compose");
        }
      }}
    />
  );

  if (menuSection === "historial" || menuSection === "notificaciones") {
    return (
      <View className="flex-1 bg-slate-100">
        <View
          style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
          className="flex-row items-center gap-3 border-b border-slate-200 bg-white px-4"
        >
          <HamburgerButton onPress={() => setMenuOpen(true)} />
          <Text className="flex-1 text-lg font-bold text-slate-900">
            {menuSection === "notificaciones"
              ? "Notificaciones"
              : "Mis servicios"}
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          {message !== null && menuSection === "historial" && (
            <Text className="mb-3 text-center text-sm text-green-700">
              {message}
            </Text>
          )}
          {menuSection === "notificaciones" ? (
            <View className="rounded-2xl border border-slate-100 bg-white p-3">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-slate-900">
                  {unreadNotifications} sin leer
                </Text>
                <TouchableOpacity
                  onPress={() => void markAllNotificationsAsRead()}
                >
                  <Text className="text-xs font-semibold text-slate-500">
                    Marcar leídas
                  </Text>
                </TouchableOpacity>
              </View>
              {(notifications ?? []).length === 0 ? (
                <Text className="text-xs text-slate-500">
                  Sin notificaciones.
                </Text>
              ) : (
                (notifications ?? []).map((notification) => (
                  <View
                    key={notification._id}
                    className="mb-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <Text className="text-xs font-semibold text-slate-800">
                      {notification.title}
                    </Text>
                    <Text className="mt-1 text-xs text-slate-600">
                      {notification.message}
                    </Text>
                  </View>
                ))
              )}
            </View>
          ) : services === undefined ? (
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
        {drawer}
      </View>
    );
  }

  // ——— Paso 1: landing motivos + direcciones ———
  if (flowStep === "compose") {
    const addressFieldButton = (
      label: string,
      value: string,
      placeholder: string,
      onPress: () => void,
    ) => (
      <View>
        <Text className="mb-1.5 text-xs font-semibold text-slate-600">
          {label}
        </Text>
        <Pressable
          onPress={onPress}
          disabled={submitting}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 active:bg-slate-100"
        >
          <Text
            className={`text-base ${
              value.trim() !== "" ? "text-slate-900" : "text-slate-400"
            }`}
            numberOfLines={2}
          >
            {value.trim() !== "" ? value : placeholder}
          </Text>
        </Pressable>
      </View>
    );

    return (
      <View className="flex-1 bg-slate-100">
        <View
          style={{ paddingTop: insets.top + 8 }}
          className="z-10 flex-row items-center justify-between px-4 pb-2"
        >
          <HamburgerButton onPress={() => setMenuOpen(true)} />
          <View className="h-12 justify-center">
            <HercomLogo width={44} />
          </View>
        </View>

        {!addressSearchActive ? (
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 28,
            }}
          >
            <Text className="mb-5 text-2xl font-bold text-slate-900">
              ¿Dónde necesitas un chofer de reemplazo?
            </Text>

            <View className="mb-5 items-center">
              <View className="mb-4 h-28 w-28 items-center justify-center rounded-full border-[5px] border-white bg-red-600">
                <Text className="text-2xl font-black tracking-[3px] text-white">
                  STOP
                </Text>
              </View>
              <View className="w-full gap-3">
                {RISK_MESSAGES.map((message) => (
                  <Text
                    key={message}
                    className="text-center text-sm font-semibold leading-5 text-slate-800"
                  >
                    {message}
                  </Text>
                ))}
              </View>
            </View>

            <View className="gap-3 rounded-3xl bg-white p-4 shadow-sm">
              {addressFieldButton(
                "Punto de recojo",
                origin,
                "¿De dónde te recogemos?",
                () => openAddressSearch("origin"),
              )}
              <TouchableOpacity
                onPress={() => void handleUseMyLocationForOrigin()}
                disabled={locationLoading || submitting}
                className="flex-row items-center justify-center rounded-2xl border border-sky-300 bg-sky-50 py-3 disabled:opacity-60"
              >
                {locationLoading ? (
                  <ActivityIndicator color="#0369A1" />
                ) : (
                  <Text className="text-sm font-semibold text-sky-900">
                    Usar mi ubicación actual
                  </Text>
                )}
              </TouchableOpacity>

              {addressFieldButton(
                "Destino",
                destination.address,
                "¿A dónde vas?",
                () => openAddressSearch("destination"),
              )}

              {extraDestinations.map((stop, index) => (
                <View
                  key={`extra-landing-${index}`}
                  className="flex-row items-start gap-2"
                >
                  <View className="flex-1">
                    {addressFieldButton(
                      `Parada ${index + 2}`,
                      stop.address,
                      `Parada ${index + 2} (opcional)`,
                      () => openAddressSearch(index),
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setExtraDestinations((previous) =>
                        previous.filter((_, itemIndex) => itemIndex !== index),
                      );
                    }}
                    className="mt-6 rounded-xl border border-red-200 px-3 py-3"
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

              <TouchableOpacity
                onPress={handleContinueToConfirm}
                disabled={!canContinue || submitting}
                className="items-center rounded-2xl bg-hercom py-3.5 active:opacity-90 disabled:opacity-50"
              >
                <Text className="text-base font-bold text-white">Continuar</Text>
              </TouchableOpacity>
            </View>

            {error !== null && (
              <Text className="mt-3 text-center text-sm text-red-600">
                {error}
              </Text>
            )}
          </ScrollView>
        ) : (
          <View className="flex-1 justify-end">
            <View
              className="mx-2 overflow-hidden rounded-t-[28px] bg-white"
              style={{
                height: composeExpandedHeight,
                shadowColor: "#0F172A",
                shadowOpacity: 0.16,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: -4 },
                elevation: 14,
              }}
            >
              <View className="flex-row items-center justify-between px-4 pb-1 pt-3">
                <View className="w-10" />
                <View className="h-1 w-10 rounded-full bg-slate-300" />
                <TouchableOpacity
                  onPress={closeAddressSearch}
                  className="h-10 w-10 items-center justify-center"
                  hitSlop={8}
                >
                  <Text className="text-lg font-semibold text-slate-500">✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                ref={sheetScrollRef}
                className="flex-1"
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none"
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom:
                    (keyboardHeight > 0 ? keyboardHeight : insets.bottom) + 28,
                }}
              >
                <Text className="mb-3 text-lg font-bold text-slate-900">
                  Busca tu dirección
                </Text>

                <View className="mb-3">
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
                    }}
                    onPlaceCleared={() => {
                      setOriginLat(null);
                      setOriginLng(null);
                      setOriginPlaceId(null);
                    }}
                    expandedList
                    keepActiveOnBlur
                    autoFocus={addressSearchField === "origin"}
                    placeholder="¿De dónde te recogemos?"
                    region={addressRegion}
                    gpsCenter={gpsBias}
                    disabled={submitting || locationLoading}
                    selectedPlaceId={originPlaceId}
                  />
                </View>

                <View className="mb-3">
                  <Text className="mb-1.5 text-xs font-semibold text-slate-600">
                    Destino
                  </Text>
                  <AddressAutocomplete
                    value={destination.address}
                    onChangeText={(value) => {
                      updateDestinationDraft(null, () =>
                        addressDraftFromText(value),
                      );
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
                    }}
                    onPlaceCleared={() => {
                      updateDestinationDraft(null, (current) => ({
                        ...current,
                        lat: null,
                        lng: null,
                        placeId: null,
                      }));
                    }}
                    expandedList
                    keepActiveOnBlur
                    autoFocus={addressSearchField === "destination"}
                    placeholder="¿A dónde vas?"
                    region={addressRegion}
                    gpsCenter={gpsBias}
                    disabled={submitting}
                    selectedPlaceId={destination.placeId}
                  />
                </View>

                {extraDestinations.map((stop, index) => (
                  <View
                    key={`extra-search-${index}`}
                    className="mb-3 flex-row items-start gap-2"
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
                        expandedList
                        keepActiveOnBlur
                        autoFocus={addressSearchField === index}
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
                          previous.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        );
                        if (addressSearchField === index) {
                          setAddressSearchField("destination");
                        }
                      }}
                      className="rounded-xl border border-red-200 px-3 py-3"
                    >
                      <Text className="text-sm font-semibold text-red-600">
                        ✕
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {canContinue && (
                  <TouchableOpacity
                    onPress={() => {
                      closeAddressSearch();
                      handleContinueToConfirm();
                    }}
                    disabled={submitting}
                    className="mt-2 items-center rounded-2xl bg-hercom py-3.5 active:opacity-90 disabled:opacity-50"
                  >
                    <Text className="text-base font-bold text-white">
                      Continuar
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </View>
        )}
        {drawer}
      </View>
    );
  }

  // ——— Paso 2:
  // ——— Paso 2: mapa + horas / tarifa ———
  return (
    <View className="flex-1 bg-slate-100">
      <MapView
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        region={confirmMapRegion}
        showsUserLocation={showsBlueDot}
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
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => {
              setFlowStep("compose");
              setError(null);
            }}
            className="h-12 w-12 items-center justify-center rounded-full bg-white"
            style={{
              shadowColor: "#0F172A",
              shadowOpacity: 0.12,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3,
            }}
          >
            <Text className="text-xl text-slate-800">←</Text>
          </TouchableOpacity>
          <View className="flex-1" />
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
          maxHeight: "58%",
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
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 20,
          }}
        >
          <Text className="mb-3 text-lg font-bold text-slate-900">
            Confirma tu servicio
          </Text>

          <View className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <Text className="text-[11px] font-semibold uppercase text-slate-500">
              De
            </Text>
            <Text className="mt-0.5 text-sm font-medium text-slate-900" numberOfLines={2}>
              {origin}
            </Text>
            <View className="my-2 h-px bg-slate-200" />
            <Text className="text-[11px] font-semibold uppercase text-slate-500">
              A
            </Text>
            <Text className="mt-0.5 text-sm font-medium text-slate-900" numberOfLines={2}>
              {formatServiceStopsLabel(
                toServiceLocation(destination),
                extraDestinations.map((stop) => toServiceLocation(stop)),
              )}
            </Text>
          </View>

          <Text className="mb-2 text-xs font-semibold text-slate-600">
            ¿Cuánto tiempo necesitas?
          </Text>
          <Text className="mb-3 text-xs text-slate-500">
            Tarifa S/{HOURLY_SERVICE_RATE}/h · mínimo {MIN_SERVICE_HOURS}h = S/
            {MIN_SERVICE_PRICE}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            contentContainerStyle={{ gap: 8 }}
          >
            {SERVICE_HOUR_OPTIONS.map((hours) => {
              const selected = serviceHours === hours;
              return (
                <TouchableOpacity
                  key={hours}
                  onPress={() => setServiceHours(hours)}
                  className={`rounded-2xl border px-4 py-3 ${
                    selected
                      ? "border-hercom bg-hercom"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <Text
                    className={`text-center text-sm font-bold ${
                      selected ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {hours}h
                  </Text>
                  <Text
                    className={`mt-0.5 text-center text-[11px] ${
                      selected ? "text-white/90" : "text-slate-500"
                    }`}
                  >
                    S/{hours * HOURLY_SERVICE_RATE}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View className="mb-3 flex-row items-end justify-between rounded-2xl bg-slate-900 px-4 py-3">
            <View>
              <Text className="text-xs font-medium text-slate-300">
                Tarifa estimada
              </Text>
              <Text className="text-2xl font-bold text-white">
                S/{listPrice.toFixed(0)}
              </Text>
            </View>
            <Text className="pb-1 text-xs text-slate-400">
              {serviceHours}h × S/{HOURLY_SERVICE_RATE}
            </Text>
          </View>

          {promoPreview !== undefined && promoPreview !== null && (
            <View className="mb-3 rounded-xl bg-emerald-50 px-3 py-2">
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
            className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
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
                Solicitar servicio · S/{listPrice.toFixed(0)}
              </Text>
            )}
          </TouchableOpacity>

          {error !== null && (
            <Text className="mt-3 text-center text-sm text-red-600">{error}</Text>
          )}
        </ScrollView>
      </View>
      {drawer}
    </View>
  );
}
