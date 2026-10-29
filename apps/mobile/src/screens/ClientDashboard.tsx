import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc, Id } from "@proyecto/backend/dataModel";
import { getAdminServiceStatusLabel } from "@proyecto/backend/serviceClosure";
import { AddressAutocomplete } from "../components/AddressAutocomplete";
import { AdvancePayoutModal } from "../components/AdvancePayoutModal";
import { DriverOfferModal, type DriverOfferInfo } from "../components/DriverOfferModal";
import { EditTripLocationsModal } from "../components/EditTripLocationsModal";
import { HamburgerButton } from "../components/HamburgerButton";
import { HelpFab } from "../components/HelpFab";
import { RateServiceStars } from "../components/RateServiceStars";
import { SideDrawer } from "../components/SideDrawer";
import { ClientSecurityScreen } from "./ClientSecurityScreen";
import { ClientSettingsScreen } from "./ClientSettingsScreen";
import { SupportChatScreen } from "./SupportChatScreen";
import { UiButton, UiCard, UiChip, UiEmpty } from "../components/ui";
import {
  ClientActiveTripSheet,
  FloatingCircleButton,
  LocationChip,
  MapScreenLayout,
  TripSecurityPin,
  UberBottomSheet,
  UberScreenHeader,
} from "../components/uber";
import {
  TacticalInput,
  TacticalLabel,
  TacticalStatus,
  TacticalText,
  TacticalValue,
} from "../components/tactical";
import { LiveTripMapModal } from "../components/LiveTripMapModal";
import { HomeRequestSheet } from "../components/request/HomeRequestSheet";
import { LocationAccessPrompt } from "../components/request/LocationAccessPrompt";
import { PinPickerScreen } from "../components/request/PinPickerScreen";
import { UserLocationDot } from "../components/request/UserLocationDot";
import { CloseGlyph } from "../components/request/RouteIcons";
import {
  addressDraftFromText,
  createEmptyAddressDraft,
  toServiceLocation,
  type AddressDraft,
} from "../lib/addressDraft";
import { toPeopleAddress } from "../lib/googleGeocoding";
import type { SelectedPlace } from "../lib/googlePlaces";
import {
  applyPickupLocationResult,
  detectPickupLocation,
  ensureLocationAccess,
  getLocationAccessStatus,
  openDeviceLocationSettings,
  readPickupCoordinates,
  resolvePickupAddress,
  type PickupLocationResult,
} from "../lib/pickupLocation";
import { recentDestinationsFromServices } from "../lib/recentDestinations";
import { isActiveServiceStatus } from "../lib/serviceStatus";
import { ExtendTripPanel } from "../components/ExtendTripPanel";
import { canClientExtendTrip } from "../lib/tripExtension";
import { formatServiceStopsLabel } from "../lib/wazeNavigation";
import { useAppMode } from "../contexts/AppModeContext";
import { HERCOM_COLORS, TACTICAL_BORDER, TACTICAL_COLORS, TACTICAL_RADIUS, MONO, POPPINS } from "../constants/theme";
import { useAndroidBackHandler } from "../hooks/useAndroidBackHandler";
import { convexErrorMessage } from "../lib/convexErrorMessage";
import * as Location from "expo-location";

const DEFAULT_HOURLY_SERVICE_RATE = 40;
const DEFAULT_MIN_SERVICE_HOURS = 2;
const DEFAULT_MIN_SERVICE_PRICE =
  DEFAULT_HOURLY_SERVICE_RATE * DEFAULT_MIN_SERVICE_HOURS;
const DEFAULT_COUNTRY_CODE = "PE";
const CLIENT_ADVANCE_RATE = 0.25;
const SERVICE_HOUR_OPTIONS = [2, 3, 4, 5, 6, 8] as const;
const LIMA_REGION = {
  latitude: -12.0464,
  longitude: -77.0428,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};

const HOME_MAP_DELTA = 0.04;

function mapRegionForCenter(
  coords: { lat: number; lng: number },
  delta = HOME_MAP_DELTA,
): Region {
  return {
    latitude: coords.lat,
    longitude: coords.lng,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

function MapPositionLoadingOverlay({ visible }: { visible: boolean }) {
  if (!visible) {
    return null;
  }
  return (
    <View
      className="absolute inset-0 z-[5] items-center justify-center"
      style={{ backgroundColor: HERCOM_COLORS.mapFallback }}
      pointerEvents="none"
    >
      <ActivityIndicator size="large" color={HERCOM_COLORS.primary} />
      <Text
        style={{
          marginTop: 12,
          fontFamily: POPPINS.medium,
          fontSize: 15,
          color: HERCOM_COLORS.text,
        }}
      >
        Estamos cargando
      </Text>
    </View>
  );
}

const STATUS_LABELS: Record<
  Exclude<Doc<"services">["status"], "cancelled" | "unattended">,
  string
> = {
  pending: "Pendiente",
  assigned: "Asignado",
  heading_to_pickup: "Yendo a recoger",
  arrived_pickup: "Chofer en punto de partida",
  in_progress: "En curso",
  arrived_destination: "Llegada al destino",
  en_route: "En camino",
  finished: "Finalizado",
};

function clientServiceStatusLabel(
  service: Doc<"services">,
): string {
  if (service.status === "cancelled" || service.status === "unattended") {
    return getAdminServiceStatusLabel(service);
  }
  return STATUS_LABELS[service.status];
}

function ClientServiceCard({
  service,
  embedInTripSheet = false,
}: {
  service: Doc<"services"> & { driverName?: string; clientRating?: number };
  /** Oculta bloques ya mostrados en ClientActiveTripSheet. */
  embedInTripSheet?: boolean;
}) {
  const cancelService = useMutation(api.services.cancelService);
  const acceptOffer = useMutation(api.serviceOffers.acceptOffer);
  const updateTripLocations = useMutation(api.services.updateTripLocations);
  const rateService = useMutation(api.serviceRatings.rateService);
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
  const [selectedOffer, setSelectedOffer] = useState<DriverOfferInfo | null>(null);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [editRouteOpen, setEditRouteOpen] = useState(false);
  const [savingRoute, setSavingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [liveMapOpen, setLiveMapOpen] = useState(false);

  const agreedPrice = service.offeredPrice ?? service.totalPrice;
  const advanceAmount =
    service.advanceAmount ??
    (service.offeredPrice !== undefined
      ? Math.round(service.offeredPrice * CLIENT_ADVANCE_RATE * 100) / 100
      : 0);
  const advanceConfirmed = service.advanceConfirmedAt !== undefined;
  const inProgress = service.status === "in_progress";
  const canShowLive =
    service.status === "heading_to_pickup" ||
    service.status === "arrived_pickup" ||
    service.status === "in_progress" ||
    service.status === "en_route" ||
    service.status === "arrived_destination";

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

  async function handleAcceptOffer() {
    if (selectedOffer === null) return;
    setAcceptingOfferId(selectedOffer._id);
    setOfferError(null);
    try {
      await acceptOffer({
        serviceId: service._id,
        offerId: selectedOffer._id,
      });
      setSelectedOffer(null);
    } catch (error) {
      setOfferError(
        error instanceof Error ? error.message : "No se pudo aceptar la oferta.",
      );
    } finally {
      setAcceptingOfferId(null);
    }
  }

  const content = (
    <>
      {!embedInTripSheet && (
        <>
          <View className="mb-3 flex-row items-center justify-between gap-2">
            <View className="flex-row flex-wrap items-center gap-2">
              <UiChip label={clientServiceStatusLabel(service)} />
              {(service.serviceType ?? "app") === "app" && <UiChip label="App" />}
            </View>
            <TacticalValue size={16} tone="accent">
              {service.offeredPrice !== undefined
                ? `S/${agreedPrice.toFixed(2)}`
                : "Sin acordar"}
            </TacticalValue>
          </View>
          <TacticalText size={12} className="mb-1">
            {service.offeredPrice !== undefined
              ? `Tarifa acordada: S/${service.offeredPrice.toFixed(2)}`
              : "Esperando acuerdo de tarifa"}
          </TacticalText>
          <TacticalText size={12} tone="text" className="mb-1">
            {service.driverName !== undefined
              ? `Chofer: ${service.driverName}`
              : "Sin chofer asignado"}
          </TacticalText>
        </>
      )}
      {service.promotionName !== undefined && (
        <TacticalLabel className="mb-1">
          {`Promo: ${service.promotionName}`}
        </TacticalLabel>
      )}
      <TacticalText size={15} tone="text">
        {toPeopleAddress(service.origin.address)} →{" "}
        {formatServiceStopsLabel(
          {
            ...service.destination,
            address: toPeopleAddress(service.destination.address),
          },
          service.extraDestinations?.map((stop) => ({
            ...stop,
            address: toPeopleAddress(stop.address),
          })),
        )}
      </TacticalText>
      {service.passengerName !== undefined && service.passengerName.trim() !== "" && (
        <TacticalText size={13} className="mt-2">
          {service.forSelf === false
            ? `Para ${service.passengerName}${
                service.passengerPhone !== undefined ? ` · ${service.passengerPhone}` : ""
              }`
            : `Viaja ${service.passengerName}`}
        </TacticalText>
      )}
      {canShowLive && (
        <View className="mt-3 gap-3">
          {!embedInTripSheet && (
            <View className="flex-row items-center justify-between">
              <TacticalLabel tone="text">Emergencia en viaje</TacticalLabel>
              <HelpFab
                fallbackCenter={{
                  lat: service.origin.lat,
                  lng: service.origin.lng,
                }}
              />
            </View>
          )}
          <UiButton
            label="Ver chofer en vivo · Compartir viaje"
            size="md"
            onPress={() => setLiveMapOpen(true)}
          />
        </View>
      )}
      {inProgress && (
        <View className="mt-3">
          <UiButton
            label="Editar partida o destino"
            variant="secondary"
            size="md"
            onPress={() => {
              setRouteError(null);
              setEditRouteOpen(true);
            }}
          />
        </View>
      )}
      {canClientExtendTrip(service.status) && (
        <View className="mt-3">
          <ExtendTripPanel service={service} />
        </View>
      )}
      {service.status === "assigned" && service.offeredPrice !== undefined && (
        <View
          className="mt-3 p-4"
          style={{
            backgroundColor: TACTICAL_COLORS.dataBandBg,
            borderRadius: TACTICAL_RADIUS.panel,
          }}
        >
          <TacticalValue size={18} tone="accent">
            {`Anticipo: S/${advanceAmount.toFixed(2)}`}
          </TacticalValue>
          <TacticalText size={15} className="mt-1">
            Transfiere el 25% de la tarifa al chofer antes de que salga.
          </TacticalText>
          <View className="mt-3">
            <UiButton
              label="Ver datos para transferir"
              variant="secondary"
              size="md"
              onPress={() => setPayoutOpen(true)}
            />
          </View>
          {advanceConfirmed && (
            <View className="mt-3">
              <TacticalStatus label="Anticipo confirmado por el chofer" tone="success" />
            </View>
          )}
        </View>
      )}
      {!embedInTripSheet &&
        service.securityCode !== undefined &&
        service.status !== "finished" &&
        service.status !== "cancelled" &&
        service.status !== "unattended" && (
          <TripSecurityPin
            pin={service.securityCode}
            inset={false}
            style={{ marginTop: 12 }}
          />
        )}
      {service.status === "pending" && (
        <View
          className="mt-3 p-3"
          style={{
            backgroundColor: TACTICAL_COLORS.surfaceSunken,
            borderRadius: TACTICAL_RADIUS.sharp,
          }}
        >
          <TacticalLabel className="mb-2">
            Ofertas de choferes
          </TacticalLabel>
          {offers === undefined ? (
            <TacticalText size={12}>Cargando ofertas...</TacticalText>
          ) : offers.length === 0 ? (
            <TacticalText size={12}>
              Aún no hay ofertas para este servicio.
            </TacticalText>
          ) : (
            offers
              .filter((offer) => offer.status === "pending")
              .map((offer) => (
                <TouchableOpacity
                  key={offer._id}
                  onPress={() => {
                    setOfferError(null);
                    setSelectedOffer({
                      _id: offer._id,
                      offeredPrice: offer.offeredPrice,
                      driverName: offer.driverName,
                      driverRating: offer.driverRating,
                      driverTrips: offer.driverTrips,
                    });
                  }}
                  className="mb-2 p-3"
                  style={{
                    backgroundColor: TACTICAL_COLORS.surface,
                    borderRadius: TACTICAL_RADIUS.sharp,
                    borderWidth: 1,
                    borderColor: TACTICAL_BORDER,
                  }}
                >
                  <TacticalLabel tone="text">
                    {`${offer.driverName} · ${offer.driverRating.toFixed(1)}★${
                      offer.driverTrips > 0
                        ? ` · ${offer.driverTrips} viajes`
                        : ""
                    }`}
                  </TacticalLabel>
                  <TacticalValue size={18} tone="accent" className="mt-1">
                    {`S/${offer.offeredPrice.toFixed(2)}`}
                  </TacticalValue>
                  <TacticalLabel tone="accent" className="mt-1">
                    Ver chofer
                  </TacticalLabel>
                </TouchableOpacity>
              ))
          )}
          {offerError !== null && selectedOffer === null && (
            <Text
              className="mt-1 text-xs"
              style={{ fontFamily: MONO.medium, color: TACTICAL_COLORS.danger }}
            >
              {offerError}
            </Text>
          )}
        </View>
      )}
      {service.status === "finished" && service.clientRating === undefined && (
        <RateServiceStars
          submitting={ratingSubmitting}
          error={ratingError}
          onSubmit={(score, comment) => {
            setRatingSubmitting(true);
            setRatingError(null);
            void rateService({
              serviceId: service._id,
              score,
              ...(comment.trim() !== "" ? { comment: comment.trim() } : {}),
            })
              .catch((error) =>
                setRatingError(
                  error instanceof Error
                    ? error.message
                    : "No se pudo enviar la valoración.",
                ),
              )
              .finally(() => setRatingSubmitting(false));
          }}
        />
      )}
      {service.status === "finished" && service.clientRating !== undefined && (
        <TacticalText size={12} tone="text" className="mt-3">
          {`Valoraste este viaje con ${service.clientRating}★`}
        </TacticalText>
      )}
      {canCancel && (
        <TouchableOpacity
          onPress={() => void handleCancel()}
          disabled={cancelling}
          className="mt-3 py-3 disabled:opacity-60"
          style={{
            borderRadius: TACTICAL_RADIUS.sharp,
            borderWidth: 1,
            borderColor: TACTICAL_COLORS.danger,
          }}
        >
          <Text
            className="text-center"
            style={{
              fontFamily: MONO.bold,
              fontSize: 15,
              color: TACTICAL_COLORS.danger,
            }}
          >
            {cancelling ? "CANCELANDO..." : "CANCELAR SOLICITUD"}
          </Text>
        </TouchableOpacity>
      )}
      <DriverOfferModal
        visible={selectedOffer !== null}
        offer={selectedOffer}
        accepting={acceptingOfferId === selectedOffer?._id}
        error={offerError}
        onClose={() => setSelectedOffer(null)}
        onAccept={() => void handleAcceptOffer()}
      />
      <AdvancePayoutModal
        visible={payoutOpen}
        onClose={() => setPayoutOpen(false)}
        payout={driverPayout ?? null}
      />
      <EditTripLocationsModal
        visible={editRouteOpen}
        origin={service.origin}
        destination={service.destination}
        saving={savingRoute}
        error={routeError}
        onClose={() => setEditRouteOpen(false)}
        onSave={(next) => {
          setSavingRoute(true);
          setRouteError(null);
          void updateTripLocations({
            serviceId: service._id,
            ...next,
          })
            .then(() => setEditRouteOpen(false))
            .catch((error) =>
              setRouteError(
                error instanceof Error
                  ? error.message
                  : "No se pudo actualizar la ruta.",
              ),
            )
            .finally(() => setSavingRoute(false));
        }}
      />
      <LiveTripMapModal
        visible={liveMapOpen}
        serviceId={service._id}
        onClose={() => setLiveMapOpen(false)}
        title="Chofer en vivo"
      />
    </>
  );

  if (embedInTripSheet) {
    return <View>{content}</View>;
  }

  return <UiCard className="mb-3">{content}</UiCard>;
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
  const me = useQuery(api.users.getMe);
  const services = useQuery(api.services.listForClient, {});
  const createService = useMutation(api.services.createService);
  const markAllNotificationsAsRead = useMutation(api.notifications.markAllAsRead);
  const notifications = useQuery(api.notifications.listMine, { limit: 8 });
  const market = useQuery(api.markets.getPublicPricing, {
    countryCode: DEFAULT_COUNTRY_CODE,
  });
  const hourlyRate = market?.hourlyRate ?? DEFAULT_HOURLY_SERVICE_RATE;
  const minServiceHours = market?.minServiceHours ?? DEFAULT_MIN_SERVICE_HOURS;
  const minServicePrice = market?.minServicePrice ?? DEFAULT_MIN_SERVICE_PRICE;
  const currencySymbol = market?.currencySymbol ?? "S/";
  const countryCode = market?.countryCode ?? DEFAULT_COUNTRY_CODE;

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuSection, setMenuSection] = useState("ciudad");
  const [flowStep, setFlowStep] = useState<"compose" | "confirm">("compose");
  /** null = landing; al abrir búsqueda no se enfoca un TextInput que luego pierda el foco por el layout. */
  const [addressSearchField, setAddressSearchField] = useState<
    null | "origin" | "destination" | number
  >(null);
  const addressSearchActive = addressSearchField !== null;
  const sheetScrollRef = useRef<ScrollView>(null);
  const addressSearchFieldRef = useRef(addressSearchField);
  addressSearchFieldRef.current = addressSearchField;
  const [origin, setOrigin] = useState("");
  const [originLat, setOriginLat] = useState<number | null>(null);
  const [originLng, setOriginLng] = useState<number | null>(null);
  const [originPlaceId, setOriginPlaceId] = useState<string | null>(null);
  const [destination, setDestination] = useState<AddressDraft>(
    createEmptyAddressDraft(),
  );
  const [extraDestinations, setExtraDestinations] = useState<AddressDraft[]>([]);
  const [serviceHours, setServiceHours] = useState<number>(DEFAULT_MIN_SERVICE_HOURS);
  const [department, setDepartment] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [notes, setNotes] = useState("");
  const [forSelf, setForSelf] = useState(true);
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [selectedActiveServiceId, setSelectedActiveServiceId] =
    useState<Id<"services"> | null>(null);
  const [requestingAnother, setRequestingAnother] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [pickupResolving, setPickupResolving] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showsBlueDot, setShowsBlueDot] = useState(false);
  const [pinField, setPinField] = useState<null | "origin" | "destination">(
    null,
  );
  const [locationPrompt, setLocationPrompt] = useState<
    "checking" | "hidden" | "ask" | "blocked" | "gps-off"
  >("checking");
  const [routeAutofocus, setRouteAutofocus] = useState(false);
  const originValueRef = useRef("");
  originValueRef.current = origin;
  const homeMapRef = useRef<MapView>(null);

  const unreadNotifications = (notifications ?? []).filter(
    (notification) => notification.readAt === undefined,
  ).length;
  const listPrice = serviceHours * hourlyRate;
  const addressRegion = {
    department,
    ...(province !== "" ? { province } : {}),
    ...(district !== "" ? { district } : {}),
  };
  const gpsBias =
    originLat !== null && originLng !== null
      ? { lat: originLat, lng: originLng }
      : userCoords !== null
        ? { lat: userCoords.lat, lng: userCoords.lng }
        : undefined;

  const canContinue =
    origin.trim() !== "" &&
    originLat !== null &&
    originLng !== null &&
    department.trim() !== "" &&
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

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const screenHeight = Dimensions.get("screen").height;
  /**
   * Sin teclado: ~52% pantalla.
   * Con teclado: llena el hueco encima del teclado; el padre usa
   * paddingBottom = keyboardHeight (un solo offset, sin doble salto).
   */
  const addressSheetHeight =
    keyboardHeight > 0
      ? Math.round(
          Math.max(280, screenHeight - keyboardHeight - insets.top - 24),
        )
      : Math.round(
          Math.min(screenHeight * 0.82, screenHeight - insets.top - 64),
        );
  /** Preview: altura fija razonable (mapa visible arriba). */
  const confirmSheetHeight = Math.round(
    Math.min(680, Math.max(480, screenHeight * 0.66)),
  );
  const homeSheetHeight = Math.round(
    Math.min(680, Math.max(500, screenHeight * 0.66)),
  );
  const activeClientServices = (services ?? []).filter((service) =>
    isActiveServiceStatus(service.status),
  );
  const selectedActiveService = activeClientServices.find(
    (service) => service._id === selectedActiveServiceId,
  );
  const homeMapRegion =
    userCoords !== null
      ? mapRegionForCenter(userCoords)
      : originLat !== null && originLng !== null
        ? mapRegionForCenter({ lat: originLat, lng: originLng })
        : LIMA_REGION;

  useEffect(() => {
    if (userCoords === null || menuSection !== "ciudad") {
      return;
    }
    homeMapRef.current?.animateToRegion(
      mapRegionForCenter(userCoords),
      400,
    );
  }, [userCoords, menuSection]);

  const resolvingMapPosition =
    locationPrompt === "checking" ||
    pickupResolving ||
    (locationLoading && userCoords === null);
  const showMapLoadingOverlay =
    menuSection === "ciudad" &&
    resolvingMapPosition &&
    locationPrompt !== "ask" &&
    locationPrompt !== "blocked" &&
    locationPrompt !== "gps-off";

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      // Origen queda arriba; destino/paradas: scroll para no quedar bajo el teclado.
      const field = addressSearchFieldRef.current;
      if (field !== null && field !== "origin") {
        requestAnimationFrame(() => {
          sheetScrollRef.current?.scrollTo({ y: 120, animated: true });
        });
      }
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const promoPreview = useQuery(
    api.promotions.previewForRegion,
    department !== "" && listPrice >= minServicePrice
      ? {
          countryCode,
          department,
          ...(province !== "" ? { province } : {}),
          ...(district !== "" ? { district } : {}),
          listPrice,
        }
      : "skip",
  );

  function rememberDetectedOrigin(result: PickupLocationResult) {
    setUserCoords({ lat: result.lat, lng: result.lng });
    setShowsBlueDot(true);
    if (originValueRef.current.trim() !== "") {
      return;
    }
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
  }

  function applyPickupCoordinates(coords: { lat: number; lng: number }) {
    setUserCoords(coords);
    setShowsBlueDot(true);
    if (originValueRef.current.trim() !== "") {
      return;
    }
    setOriginLat(coords.lat);
    setOriginLng(coords.lng);
    setOriginPlaceId(null);
  }

  function geocodePickupInBackground(coords: { lat: number; lng: number }) {
    void resolvePickupAddress(coords)
      .then((result) => {
        rememberDetectedOrigin(result);
      })
      .catch(() => {
        if (originValueRef.current.trim() === "") {
          setOrigin("Ubicación actual");
        }
      });
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setPickupResolving(true);
      try {
        const status = await getLocationAccessStatus();
        if (cancelled) return;
        if (status.permissionGranted && status.servicesEnabled) {
          const coords = await readPickupCoordinates();
          if (cancelled) return;
          applyPickupCoordinates(coords);
          setLocationPrompt("hidden");
          setPickupResolving(false);
          geocodePickupInBackground(coords);
          return;
        }
        if (!status.permissionGranted) {
          const permission = await Location.getForegroundPermissionsAsync();
          if (cancelled) return;
          setLocationPrompt(permission.status === "denied" ? "blocked" : "ask");
          return;
        }
        setLocationPrompt("gps-off");
      } catch {
        if (!cancelled) {
          setLocationPrompt("ask");
        }
      } finally {
        if (!cancelled) {
          setPickupResolving(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const previousMenuSectionRef = useRef(menuSection);
  useEffect(() => {
    const previous = previousMenuSectionRef.current;
    previousMenuSectionRef.current = menuSection;
    if (menuSection !== "ciudad" || previous === "ciudad") {
      return;
    }
    let cancelled = false;
    void (async () => {
      const status = await getLocationAccessStatus();
      if (cancelled || !status.permissionGranted || !status.servicesEnabled) {
        return;
      }
      try {
        const coords = await readPickupCoordinates();
        if (cancelled) {
          return;
        }
        applyPickupCoordinates(coords);
        setLocationPrompt("hidden");
        geocodePickupInBackground(coords);
      } catch {
        if (!cancelled) {
          setShowsBlueDot(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [menuSection]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        return;
      }
      if (originValueRef.current.trim() !== "" && originLat !== null) {
        return;
      }
      void (async () => {
        const status = await getLocationAccessStatus();
        if (!status.permissionGranted || !status.servicesEnabled) {
          return;
        }
        try {
          const coords = await readPickupCoordinates();
          applyPickupCoordinates(coords);
          setLocationPrompt("hidden");
          geocodePickupInBackground(coords);
        } catch {
          setShowsBlueDot(false);
        }
      })();
    });
    return () => subscription.remove();
  }, [originLat]);

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
    setRouteAutofocus(typeof field !== "number");
    setAddressSearchField(field);
  }

  function openPinPicker(field: "origin" | "destination") {
    Keyboard.dismiss();
    setRouteAutofocus(false);
    setPinField(field);
  }

  const handleAndroidBack = useCallback(() => {
    if (menuOpen) {
      setMenuOpen(false);
      return true;
    }
    if (pinField !== null) {
      setPinField(null);
      return true;
    }
    if (addressSearchField !== null) {
      Keyboard.dismiss();
      setAddressSearchField(null);
      return true;
    }
    if (flowStep === "confirm") {
      setFlowStep("compose");
      setError(null);
      return true;
    }
    if (selectedActiveServiceId !== null) {
      setSelectedActiveServiceId(null);
      return true;
    }
    if (requestingAnother && flowStep === "compose") {
      setRequestingAnother(false);
      return true;
    }
    if (menuSection !== "ciudad") {
      setMenuSection("ciudad");
      setFlowStep("compose");
      return true;
    }
    return false;
  }, [
    menuOpen,
    pinField,
    addressSearchField,
    flowStep,
    menuSection,
    selectedActiveServiceId,
    requestingAnother,
  ]);

  useAndroidBackHandler(handleAndroidBack);

  async function handleAllowLocation() {
    if (locationPrompt === "blocked" || locationPrompt === "gps-off") {
      const status = await getLocationAccessStatus();
      if (!status.permissionGranted || !status.servicesEnabled) {
        await openDeviceLocationSettings();
        return;
      }
    }
    setLocationLoading(true);
    setPickupResolving(true);
    setError(null);
    try {
      await ensureLocationAccess();
      const coords = await readPickupCoordinates();
      applyPickupCoordinates(coords);
      setLocationPrompt("hidden");
      setPickupResolving(false);
      geocodePickupInBackground(coords);
    } catch {
      const status = await getLocationAccessStatus();
      setShowsBlueDot(false);
      setLocationPrompt(status.permissionGranted ? "gps-off" : "blocked");
    } finally {
      setLocationLoading(false);
      setPickupResolving(false);
    }
  }

  function applyPinResult(result: PickupLocationResult) {
    if (pinField === "origin") {
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
      setUserCoords({ lat: result.lat, lng: result.lng });
    } else if (pinField === "destination") {
      setDestination({
        address: result.address,
        lat: result.lat,
        lng: result.lng,
        placeId: null,
      });
      if (department === "") {
        setDepartment(result.department);
      }
      if (province === "" && result.province !== undefined) {
        setProvince(result.province);
      }
      if (district === "" && result.district !== undefined) {
        setDistrict(result.district);
      }
    }
    setPinField(null);
  }

  function goToConfirmStep() {
    setError(null);
    setMessage(null);
    setAddressSearchField(null);
    setKeyboardHeight(0);

    const goConfirm = () => setFlowStep("confirm");

    // Esperar a que el teclado baje: si montamos confirm con el teclado abierto,
    // el sheet queda “subido” (pan/resize a medias).
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      hideSub.remove();
      goConfirm();
    };
    const hideSub = Keyboard.addListener(hideEvent, finish);
    Keyboard.dismiss();
    // Si no había teclado, keyboardDidHide no dispara.
    setTimeout(finish, Platform.OS === "ios" ? 320 : 180);
  }

  function handleContinueToConfirm() {
    if (!canContinue) {
      setError(
        "Completa origen y destino eligiendo una sugerencia de dirección.",
      );
      return;
    }
    goToConfirmStep();
  }

  function closeAddressSearch() {
    Keyboard.dismiss();
    setKeyboardHeight(0);
    setAddressSearchField(null);
  }

  function resetComposeForm() {
    setOrigin("");
    setOriginLat(null);
    setOriginLng(null);
    setOriginPlaceId(null);
    setDestination(createEmptyAddressDraft());
    setExtraDestinations([]);
    setServiceHours(minServiceHours);
    setDepartment("");
    setProvince("");
    setDistrict("");
    setNotes("");
    setForSelf(true);
    setPassengerName("");
    setPassengerPhone("");
    setFlowStep("compose");
  }

  async function handleSubmit() {
    if (
      origin.trim() === "" ||
      destination.address.trim() === "" ||
      department === "" ||
      originLat === null ||
      originLng === null ||
      destination.lat === null ||
      destination.lng === null ||
      listPrice < minServicePrice ||
      (!forSelf &&
        (passengerName.trim().length < 2 ||
          passengerPhone.replace(/\D/g, "").length < 6))
    ) {
      setError(
        department === ""
          ? "Espera a que cargue tu dirección de recojo o elígela en el mapa."
          : destination.lat === null || destination.lng === null
            ? "Elige el destino desde la lista de sugerencias o el mapa."
            : !forSelf && passengerName.trim().length < 2
            ? "Indica el nombre de la persona que va a usar el servicio."
            : !forSelf && passengerPhone.replace(/\D/g, "").length < 6
              ? "Indica el teléfono de la persona que va a usar el servicio."
              : `Completa origen, destino y al menos ${minServiceHours}h (${currencySymbol}${minServicePrice}).`,
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
          countryCode,
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
        forSelf,
        ...(!forSelf
          ? {
              passengerName: passengerName.trim(),
              passengerPhone: passengerPhone.trim(),
            }
          : {}),
      });
      resetComposeForm();
      setRequestingAnother(false);
      setSelectedActiveServiceId(null);
      setMessage("Solicitud enviada. Espera ofertas y elige un chofer.");
      setMenuSection("historial");
    } catch (submitError) {
      setError(
        convexErrorMessage(submitError, "No se pudo crear la solicitud."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const drawer = (
    <SideDrawer
      visible={menuOpen}
      onClose={() => setMenuOpen(false)}
      userName={userName}
      avatarUrl={me?.selfieUrl}
      unreadCount={unreadNotifications}
      activeItem={menuSection}
      onSelectItem={(key) => {
        setMenuSection(key);
        if (key === "ciudad") {
          setFlowStep("compose");
          setRequestingAnother(false);
          setSelectedActiveServiceId(null);
        }
      }}
    />
  );

  if (menuSection === "ayuda") {
    return (
      <View className="flex-1">
        <SupportChatScreen onOpenMenu={() => setMenuOpen(true)} />
        {drawer}
      </View>
    );
  }

  if (menuSection === "seguridad") {
    return (
      <View className="flex-1">
        <ClientSecurityScreen onOpenMenu={() => setMenuOpen(true)} />
        {drawer}
      </View>
    );
  }

  if (menuSection === "configuracion") {
    return (
      <View className="flex-1">
        <ClientSettingsScreen onOpenMenu={() => setMenuOpen(true)} />
        {drawer}
      </View>
    );
  }

  if (menuSection === "historial" || menuSection === "notificaciones") {
    return (
      <View className="flex-1" style={{ backgroundColor: TACTICAL_COLORS.base }}>
        <UberScreenHeader
          title={
            menuSection === "notificaciones" ? "Notificaciones" : "Mis servicios"
          }
          onOpenMenu={() => setMenuOpen(true)}
        />

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
            <Text className="mb-3 text-center text-sm text-success">
              {message}
            </Text>
          )}
          {menuSection === "notificaciones" ? (
            <UiCard>
              <View className="mb-3 flex-row items-center justify-between">
                <TacticalStatus
                  label={`${unreadNotifications} sin leer`}
                  tone={unreadNotifications > 0 ? "active" : "idle"}
                />
                <TouchableOpacity
                  onPress={() => void markAllNotificationsAsRead()}
                >
                  <TacticalLabel tone="accent">
                    Marcar leídas
                  </TacticalLabel>
                </TouchableOpacity>
              </View>
              {(notifications ?? []).length === 0 ? (
                <UiEmpty title="Sin notificaciones." />
              ) : (
                (notifications ?? []).map((notification) => (
                  <View
                    key={notification._id}
                    className="mb-2 p-3"
                    style={{
                      backgroundColor: TACTICAL_COLORS.surfaceSunken,
                      borderRadius: TACTICAL_RADIUS.sharp,
                    }}
                  >
                    <TacticalLabel tone="text">
                      {notification.title}
                    </TacticalLabel>
                    <TacticalText size={11} className="mt-1">
                      {notification.message}
                    </TacticalText>
                  </View>
                ))
              )}
            </UiCard>
          ) : services === undefined ? (
            <ActivityIndicator color={TACTICAL_COLORS.accent} />
          ) : activeClientServices.length === 0 ? (
            <UiEmpty
              title="No tienes un viaje activo"
              subtitle="Cuando pidas un servicio y esté en curso, lo verás aquí. Los viajes finalizados o cancelados no se listan en esta pantalla."
            />
          ) : (
            activeClientServices.map((service) => (
              <ClientServiceCard key={service._id} service={service} />
            ))
          )}
        </ScrollView>
        {drawer}
      </View>
    );
  }

  if (me === undefined) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: TACTICAL_COLORS.base }}
      >
        <ActivityIndicator color={TACTICAL_COLORS.accent} />
        {drawer}
      </View>
    );
  }

  // ——— Home: lista de viajes activos, luego el que elija ———
  if (
    menuSection === "ciudad" &&
    flowStep === "compose" &&
    !addressSearchActive &&
    pinField === null &&
    !requestingAnother &&
    services !== undefined &&
    activeClientServices.length > 0 &&
    selectedActiveService === undefined
  ) {
    return (
      <View className="flex-1" style={{ backgroundColor: TACTICAL_COLORS.base }}>
        <UberScreenHeader title="Tus viajes" onOpenMenu={() => setMenuOpen(true)} />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={{
              fontFamily: POPPINS.regular,
              fontSize: 14,
              lineHeight: 20,
              color: TACTICAL_COLORS.steel,
              marginBottom: 12,
            }}
          >
            Elige un viaje para verlo. Puedes tener varios a la vez si alguno es para otra persona.
          </Text>
          {activeClientServices.map((service) => (
            <TouchableOpacity
              key={service._id}
              activeOpacity={0.75}
              onPress={() => setSelectedActiveServiceId(service._id)}
              style={{
                backgroundColor: TACTICAL_COLORS.surface,
                borderRadius: TACTICAL_RADIUS.sharp,
                borderWidth: 1,
                borderColor: TACTICAL_BORDER,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontFamily: POPPINS.medium, fontSize: 13, color: TACTICAL_COLORS.accent }}>
                {clientServiceStatusLabel(service)}
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  marginTop: 4,
                  fontFamily: POPPINS.semibold,
                  fontSize: 16,
                  lineHeight: 22,
                  color: TACTICAL_COLORS.text,
                }}
              >
                {toPeopleAddress(service.origin.address)}
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  marginTop: 2,
                  fontFamily: POPPINS.regular,
                  fontSize: 14,
                  lineHeight: 20,
                  color: TACTICAL_COLORS.steel,
                }}
              >
                {`→ ${toPeopleAddress(service.destination.address)}`}
              </Text>
              {service.passengerName !== undefined && service.passengerName.trim() !== "" && (
                <Text
                  style={{
                    marginTop: 6,
                    fontFamily: POPPINS.medium,
                    fontSize: 13,
                    color: TACTICAL_COLORS.text,
                  }}
                >
                  {service.forSelf === false
                    ? `Para ${service.passengerName}`
                    : service.passengerName}
                </Text>
              )}
            </TouchableOpacity>
          ))}
          <View className="mt-2">
            <UiButton
              label="Pedir otro servicio"
              onPress={() => {
                setRequestingAnother(true);
                setFlowStep("compose");
              }}
            />
          </View>
        </ScrollView>
        {drawer}
      </View>
    );
  }

  if (
    menuSection === "ciudad" &&
    selectedActiveService !== undefined &&
    flowStep === "compose" &&
    !addressSearchActive
  ) {
    return (
      <View className="flex-1">
        <MapScreenLayout
          map={
            <MapView
              ref={homeMapRef}
              style={{ flex: 1 }}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              initialRegion={homeMapRegion}
              showsUserLocation={false}
              showsMyLocationButton={false}
              loadingEnabled
              loadingIndicatorColor={HERCOM_COLORS.primary}
            />
          }
          mapOverlay={
            <MapPositionLoadingOverlay visible={showMapLoadingOverlay} />
          }
          topOverlay={
            <View className="flex-row items-center gap-3">
              <FloatingCircleButton
                accessibilityLabel="Volver a tus viajes"
                onPress={() => setSelectedActiveServiceId(null)}
              >
                <Text
                  style={{
                    fontFamily: MONO.bold,
                    fontSize: 18,
                    color: HERCOM_COLORS.text,
                  }}
                >
                  ←
                </Text>
              </FloatingCircleButton>
              <HamburgerButton
                onPress={() => setMenuOpen(true)}
                variant="light"
              />
              <View className="flex-1" />
              <HelpFab
                fallbackCenter={
                  userCoords !== null
                    ? { lat: userCoords.lat, lng: userCoords.lng }
                    : undefined
                }
              />
            </View>
          }
          bottomSheet={
            <ClientActiveTripSheet
              service={selectedActiveService}
              sheetHeight={homeSheetHeight}
            >
              <ClientServiceCard service={selectedActiveService} embedInTripSheet />
            </ClientActiveTripSheet>
          }
        />
        {drawer}
      </View>
    );
  }

  const recentDestinations = recentDestinationsFromServices(services);
  const pinCenter =
    pinField === "origin"
      ? originLat !== null && originLng !== null
        ? { lat: originLat, lng: originLng }
        : (userCoords ?? {
            lat: LIMA_REGION.latitude,
            lng: LIMA_REGION.longitude,
          })
      : destination.lat !== null && destination.lng !== null
        ? { lat: destination.lat, lng: destination.lng }
        : (userCoords ??
          (originLat !== null && originLng !== null
            ? { lat: originLat, lng: originLng }
            : {
                lat: LIMA_REGION.latitude,
                lng: LIMA_REGION.longitude,
              }));

  if (flowStep === "compose" && pinField !== null) {
    return (
      <View className="flex-1">
        <PinPickerScreen
          initialCenter={pinCenter}
          showsUserLocation={false}
          onCancel={() => setPinField(null)}
          onConfirm={applyPinResult}
        />
        {drawer}
      </View>
    );
  }

  // ——— Paso 1: mapa + sheet solicitud ———
  if (flowStep === "compose") {
    const addressSearchSheet = (
      <View
        className="flex-1 justify-end"
        style={{ paddingBottom: keyboardHeight }}
      >
        <UberBottomSheet height={addressSheetHeight}>
          <View className="flex-row items-center px-2 pb-2">
            <View style={{ width: 44 }} />
            <Text
              style={{
                flex: 1,
                textAlign: "center",
                fontFamily: POPPINS.bold,
                fontSize: 18,
                color: HERCOM_COLORS.text,
              }}
            >
              Introduce tu ruta
            </Text>
            <TouchableOpacity
              onPress={closeAddressSearch}
              accessibilityLabel="Cerrar"
              className="h-11 w-11 items-center justify-center"
              hitSlop={8}
            >
              <CloseGlyph size={20} color={TACTICAL_COLORS.steel} />
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
                  paddingBottom: insets.bottom + 24,
                }}
              >
                <View className="mb-3">
                  <AddressAutocomplete
                    value={origin}
                    onChangeText={(value) => {
                      setOrigin(value);
                      setOriginLat(null);
                      setOriginLng(null);
                      setOriginPlaceId(null);
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
                    autoFocus={routeAutofocus && addressSearchField === "origin"}
                    placeholder="Tu ubicación"
                    region={addressRegion}
                    gpsCenter={gpsBias}
                    disabled={submitting || locationLoading}
                    selectedPlaceId={originPlaceId}
                    resolvingLocation={
                      pickupResolving &&
                      origin.trim() === "" &&
                      originLat === null
                    }
                    routeChrome={{
                      caption: "De",
                      active: addressSearchField === "origin",
                      onActivate: () => setAddressSearchField("origin"),
                      onOpenMap: () => openPinPicker("origin"),
                    }}
                  />
                </View>

                <View className="mb-3">
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
                    onPlaceResolved={(place) => {
                      setRouteAutofocus(false);
                      const originReady =
                        originLat !== null &&
                        originLng !== null &&
                        department.trim() !== "";
                      const destinationReady =
                        place.address.trim() !== "" &&
                        Number.isFinite(place.lat) &&
                        Number.isFinite(place.lng);
                      if (!originReady) {
                        setError(
                          "Espera a que cargue tu punto de recojo (De) y vuelve a elegir el destino.",
                        );
                        return;
                      }
                      if (originReady && destinationReady) {
                        goToConfirmStep();
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
                    autoFocus={
                      routeAutofocus && addressSearchField === "destination"
                    }
                    placeholder="A"
                    region={addressRegion}
                    gpsCenter={gpsBias}
                    disabled={submitting}
                    selectedPlaceId={destination.placeId}
                    routeSuggestions
                    regionMatchMode="destination"
                    pickupRegion={{
                      department,
                      ...(province !== "" ? { province } : {}),
                      ...(district !== "" ? { district } : {}),
                    }}
                    routeChrome={{
                      caption: "A",
                      active: addressSearchField === "destination",
                      onActivate: () => setAddressSearchField("destination"),
                      onOpenMap: () => openPinPicker("destination"),
                    }}
                  />
                </View>
                <TouchableOpacity
                  onPress={() =>
                    setExtraDestinations((previous) => [
                      ...previous,
                      createEmptyAddressDraft(),
                    ])
                  }
                  disabled={submitting}
                  className="mb-3 py-1"
                >
                  <Text
                    style={{
                      fontFamily: POPPINS.semibold,
                      fontSize: 14,
                      color: HERCOM_COLORS.primary,
                    }}
                  >
                    + Agregar parada
                  </Text>
                </TouchableOpacity>

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
                      className="h-12 w-12 items-center justify-center"
                      style={{
                        backgroundColor: TACTICAL_COLORS.surfaceSunken,
                        borderRadius: TACTICAL_RADIUS.sharp,
                        borderWidth: 1,
                        borderColor: TACTICAL_BORDER,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: MONO.bold,
                          fontSize: 14,
                          color: TACTICAL_COLORS.steel,
                        }}
                      >
                        ✕
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {canContinue && (
                  <View className="mt-2">
                    <UiButton
                      label="Continuar"
                      onPress={handleContinueToConfirm}
                      disabled={submitting}
                    />
                  </View>
                )}
          </ScrollView>
        </UberBottomSheet>
      </View>
    );

    return (
      <View className="flex-1">
        {addressSearchActive ? (
          <View className="flex-1" style={{ backgroundColor: HERCOM_COLORS.mapFallback }}>
            <MapView
              ref={homeMapRef}
              style={{ flex: 1 }}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              initialRegion={homeMapRegion}
              showsUserLocation={false}
              showsMyLocationButton={false}
            >
              {showsBlueDot && userCoords !== null && (
                <UserLocationDot latitude={userCoords.lat} longitude={userCoords.lng} />
              )}
            </MapView>
            <MapPositionLoadingOverlay visible={showMapLoadingOverlay} />
            {addressSearchSheet}
          </View>
        ) : (
          <MapScreenLayout
            map={
              <MapView
                ref={homeMapRef}
                key={userCoords === null ? "lima" : "gps"}
                style={{ flex: 1 }}
                provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
                initialRegion={homeMapRegion}
                showsUserLocation={false}
                showsMyLocationButton={false}
                loadingEnabled
                loadingIndicatorColor={HERCOM_COLORS.primary}
                mapPadding={{
                  top: insets.top + 56,
                  bottom: homeSheetHeight + 8,
                  left: 16,
                  right: 16,
                }}
              >
                {showsBlueDot && userCoords !== null && (
                  <UserLocationDot latitude={userCoords.lat} longitude={userCoords.lng} />
                )}
              </MapView>
            }
            mapOverlay={
              <MapPositionLoadingOverlay visible={showMapLoadingOverlay} />
            }
            topOverlay={
              <View className="flex-row items-center gap-3">
                <HamburgerButton
                  onPress={() => setMenuOpen(true)}
                  variant="light"
                />
                {origin.trim() !== "" ? (
                  <LocationChip
                    label="De dónde"
                    address={toPeopleAddress(origin)}
                    onPress={() => openAddressSearch("origin")}
                  />
                ) : (
                  <View className="flex-1" />
                )}
                <HelpFab
                  fallbackCenter={
                    userCoords !== null
                      ? { lat: userCoords.lat, lng: userCoords.lng }
                      : undefined
                  }
                />
              </View>
            }
            bottomSheet={
              <UberBottomSheet height={homeSheetHeight}>
                <HomeRequestSheet
                  recents={recentDestinations}
                  error={error}
                  bottomInset={insets.bottom}
                  onSearchPress={() => openAddressSearch("destination")}
                  onSelectRecent={(place) => {
                    setDestination({
                      address: place.address,
                      lat: place.lat,
                      lng: place.lng,
                      placeId: null,
                    });
                    setError(null);
                    if (
                      origin.trim() !== "" &&
                      originLat !== null &&
                      originLng !== null
                    ) {
                      setFlowStep("confirm");
                      return;
                    }
                    openAddressSearch("destination");
                  }}
                />
              </UberBottomSheet>
            }
          />
        )}
        {!addressSearchActive &&
          (locationPrompt === "ask" ||
            locationPrompt === "blocked" ||
            locationPrompt === "gps-off") && (
            <LocationAccessPrompt
              mode={locationPrompt}
              loading={locationLoading}
              onAllow={() => void handleAllowLocation()}
              onDismiss={() => setLocationPrompt("hidden")}
            />
          )}
        {drawer}
      </View>
    );
  }

  // ——— Paso 2: mapa + horas / tarifa ———
  return (
    <View className="flex-1">
      <MapScreenLayout
        map={
          <MapView
            key={`map-${originLat}-${originLng}-${destination.lat}-${destination.lng}`}
            style={{ flex: 1 }}
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            initialRegion={confirmMapRegion}
            mapType="standard"
            showsUserLocation={false}
            showsMyLocationButton={false}
            loadingEnabled
            loadingIndicatorColor={HERCOM_COLORS.primary}
            loadingBackgroundColor={HERCOM_COLORS.mapFallback}
            mapPadding={{
              top: insets.top + 56,
              right: 16,
              bottom: confirmSheetHeight + 12,
              left: 16,
            }}
          >
            {originLat !== null && originLng !== null && (
              <Marker
                coordinate={{ latitude: originLat, longitude: originLng }}
                title="Recojo"
                pinColor={HERCOM_COLORS.primary}
                tracksViewChanges={false}
              />
            )}
            {destination.lat !== null && destination.lng !== null && (
              <Marker
                coordinate={{
                  latitude: destination.lat,
                  longitude: destination.lng,
                }}
                title="Destino"
                tracksViewChanges={false}
              />
            )}
          </MapView>
        }
        topOverlay={
          <View className="flex-row items-center gap-3">
            <FloatingCircleButton
              accessibilityLabel="Volver"
              onPress={() => {
                setFlowStep("compose");
                setError(null);
              }}
            >
              <Text
                style={{
                  fontFamily: MONO.bold,
                  fontSize: 18,
                  color: HERCOM_COLORS.text,
                }}
              >
                ←
              </Text>
            </FloatingCircleButton>
            <View className="flex-1" />
            <HelpFab
              fallbackCenter={
                originLat !== null && originLng !== null
                  ? { lat: originLat, lng: originLng }
                  : undefined
              }
            />
          </View>
        }
        bottomSheet={
          <UberBottomSheet height={confirmSheetHeight}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 20,
              }}
            >
              <Text
                style={{
                  fontFamily: POPPINS.bold,
                  fontSize: 18,
                  lineHeight: 24,
                  color: HERCOM_COLORS.text,
                  marginBottom: 12,
                }}
              >
                Confirmar viaje
              </Text>

          <View
            style={{
              backgroundColor: "#F3F4F6",
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 16,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setFlowStep("compose");
                setError(null);
                setAddressSearchField("origin");
              }}
            >
              <Text
                style={{
                  fontFamily: POPPINS.medium,
                  fontSize: 13,
                  color: HERCOM_COLORS.textMuted,
                }}
              >
                De · tocar para editar
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  marginTop: 2,
                  fontFamily: POPPINS.semibold,
                  fontSize: 15,
                  lineHeight: 20,
                  color: HERCOM_COLORS.text,
                }}
              >
                {toPeopleAddress(origin)}
              </Text>
            </TouchableOpacity>
            <View
              style={{
                height: 1,
                backgroundColor: HERCOM_COLORS.border,
                marginVertical: 10,
              }}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setFlowStep("compose");
                setError(null);
                setAddressSearchField("destination");
              }}
            >
              <Text
                style={{
                  fontFamily: POPPINS.medium,
                  fontSize: 13,
                  color: HERCOM_COLORS.textMuted,
                }}
              >
                A · tocar para editar
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  marginTop: 2,
                  fontFamily: POPPINS.semibold,
                  fontSize: 15,
                  lineHeight: 20,
                  color: HERCOM_COLORS.text,
                }}
              >
                {formatServiceStopsLabel(
                  {
                    ...toServiceLocation(destination),
                    address: toPeopleAddress(destination.address),
                  },
                  extraDestinations.map((stop) => ({
                    ...toServiceLocation(stop),
                    address: toPeopleAddress(stop.address),
                  })),
                )}
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={{
              fontFamily: POPPINS.semibold,
              fontSize: 16,
              color: HERCOM_COLORS.text,
              marginBottom: 8,
            }}
          >
            ¿Para quién es el servicio?
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: forSelf ? 16 : 12 }}>
            {(
              [
                { value: true, label: "Para mí" },
                { value: false, label: "Otra persona" },
              ] as const
            ).map((option) => {
              const selected = forSelf === option.value;
              return (
                <TouchableOpacity
                  key={option.label}
                  onPress={() => setForSelf(option.value)}
                  style={{
                    flex: 1,
                    borderRadius: 16,
                    paddingVertical: 12,
                    backgroundColor: selected ? HERCOM_COLORS.primary : "#F3F4F6",
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      fontFamily: POPPINS.semibold,
                      fontSize: 15,
                      color: selected ? HERCOM_COLORS.white : HERCOM_COLORS.text,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {!forSelf && (
            <>
              <TacticalInput
                label="Nombre"
                value={passengerName}
                onChangeText={setPassengerName}
                placeholder="Nombre de la persona"
                autoCapitalize="words"
                containerClassName="mb-3"
              />
              <TacticalInput
                label="Teléfono"
                value={passengerPhone}
                onChangeText={setPassengerPhone}
                placeholder="Teléfono"
                keyboardType="phone-pad"
                containerClassName="mb-3"
              />
            </>
          )}

          <Text
            style={{
              fontFamily: POPPINS.semibold,
              fontSize: 16,
              color: HERCOM_COLORS.text,
              marginBottom: 4,
            }}
          >
            ¿Cuánto tiempo necesitas?
          </Text>
          <Text
            style={{
              fontFamily: POPPINS.regular,
              fontSize: 13,
              lineHeight: 18,
              color: HERCOM_COLORS.textMuted,
              marginBottom: 12,
            }}
          >
            Tarifa {currencySymbol}
            {hourlyRate}/h · mínimo {minServiceHours}h = {currencySymbol}
            {minServicePrice}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
            contentContainerStyle={{ gap: 8 }}
          >
            {SERVICE_HOUR_OPTIONS.map((hours) => {
              const selected = serviceHours === hours;
              return (
                <TouchableOpacity
                  key={hours}
                  onPress={() => setServiceHours(hours)}
                  style={{
                    backgroundColor: selected ? HERCOM_COLORS.primary : "#F3F4F6",
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    minWidth: 72,
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      fontFamily: POPPINS.bold,
                      fontSize: 16,
                      color: selected ? HERCOM_COLORS.white : HERCOM_COLORS.text,
                    }}
                  >
                    {hours}h
                  </Text>
                  <Text
                    style={{
                      marginTop: 2,
                      textAlign: "center",
                      fontFamily: POPPINS.medium,
                      fontSize: 13,
                      color: selected
                        ? "rgba(255,255,255,0.9)"
                        : HERCOM_COLORS.textMuted,
                    }}
                  >
                    {currencySymbol}
                    {hours * hourlyRate}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
              backgroundColor: HERCOM_COLORS.primarySoft,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 12,
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text
                style={{
                  fontFamily: POPPINS.medium,
                  fontSize: 13,
                  color: HERCOM_COLORS.textSecondary,
                }}
              >
                Tarifa estimada
              </Text>
              <Text
                style={{
                  marginTop: 2,
                  fontFamily: POPPINS.bold,
                  fontSize: 28,
                  lineHeight: 34,
                  color: HERCOM_COLORS.text,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {currencySymbol}
                {listPrice.toFixed(0)}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: POPPINS.medium,
                fontSize: 13,
                color: HERCOM_COLORS.textMuted,
                paddingBottom: 4,
              }}
            >
              {serviceHours}h × {currencySymbol}
              {hourlyRate}
            </Text>
          </View>

          {promoPreview !== undefined && promoPreview !== null && (
            <View
              style={{
                backgroundColor: "#E5F8EA",
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: POPPINS.semibold,
                  fontSize: 14,
                  color: HERCOM_COLORS.text,
                }}
              >
                Promo: {promoPreview.promotionName} (
                {(promoPreview.discountRate * 100).toFixed(0)}% off)
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontFamily: POPPINS.regular,
                  fontSize: 13,
                  lineHeight: 18,
                  color: HERCOM_COLORS.textSecondary,
                }}
              >
                Pagas {currencySymbol}
                {promoPreview.basePrice.toFixed(2)} (lista {currencySymbol}
                {promoPreview.catalogBasePrice.toFixed(2)}).
              </Text>
            </View>
          )}

          <TacticalInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notas (opcional)"
            multiline
            containerClassName="mb-3"
          />

          <UiButton
            label={`Solicitar servicio · ${currencySymbol}${listPrice.toFixed(0)}`}
            onPress={() => void handleSubmit()}
            disabled={submitting}
            loading={submitting}
          />

          {error !== null && (
            <TacticalText
              size={13}
              className="mt-3 text-center"
              style={{ color: TACTICAL_COLORS.danger }}
            >
              {error}
            </TacticalText>
          )}
            </ScrollView>
          </UberBottomSheet>
        }
      />
      {drawer}
    </View>
  );
}
