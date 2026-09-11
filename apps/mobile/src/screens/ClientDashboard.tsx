import { useCallback, useEffect, useRef, useState } from "react";
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
import { AdvancePayoutModal } from "../components/AdvancePayoutModal";
import { DriverOfferModal, type DriverOfferInfo } from "../components/DriverOfferModal";
import { EditTripLocationsModal } from "../components/EditTripLocationsModal";
import { HamburgerButton } from "../components/HamburgerButton";
import { HelpFab } from "../components/HelpFab";
import { RateServiceStars } from "../components/RateServiceStars";
import { SideDrawer } from "../components/SideDrawer";
import { ClientSecurityScreen } from "./ClientSecurityScreen";
import { ClientSettingsScreen } from "./ClientSettingsScreen";
import { ClientIdentityForm } from "./ClientIdentityForm";
import { SupportChatScreen } from "./SupportChatScreen";
import { UiButton, UiCard, UiChip, UiEmpty, SHEET_SHADOW } from "../components/ui";
import {
  TacticalInput,
  TacticalLabel,
  TacticalPanel,
  TacticalStatus,
  TacticalText,
  TacticalTitle,
  TacticalValue,
} from "../components/tactical";
import { LiveTripMapModal } from "../components/LiveTripMapModal";
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

const STATUS_LABELS: Record<Doc<"services">["status"], string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  heading_to_pickup: "Yendo a recoger",
  arrived_pickup: "Chofer en punto de partida",
  in_progress: "En curso",
  arrived_destination: "Llegada al destino",
  en_route: "En camino",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

function ClientServiceCard({
  service,
}: {
  service: Doc<"services"> & { driverName?: string; clientRating?: number };
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

  return (
    <UiCard className="mb-3">
      <View className="mb-3 flex-row items-center justify-between gap-2">
        <View className="flex-row flex-wrap items-center gap-2">
          <UiChip label={STATUS_LABELS[service.status]} />
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
      {service.promotionName !== undefined && (
        <TacticalLabel size={10} className="mb-1">
          {`Promo: ${service.promotionName}`}
        </TacticalLabel>
      )}
      <TacticalText size={12} tone="text">
        {service.origin.address} →{" "}
        {formatServiceStopsLabel(service.destination, service.extraDestinations)}
      </TacticalText>
      {canShowLive && (
        <View className="mt-3">
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
      {service.status === "assigned" && service.offeredPrice !== undefined && (
        <View
          className="mt-3 p-4"
          style={{
            backgroundColor: TACTICAL_COLORS.surfaceSunken,
            borderRadius: TACTICAL_RADIUS.sharp,
            borderLeftWidth: 2,
            borderLeftColor: TACTICAL_COLORS.accent,
          }}
        >
          <TacticalValue size={18} tone="accent">
            {`Anticipo: S/${advanceAmount.toFixed(2)}`}
          </TacticalValue>
          <TacticalText size={12} className="mt-1">
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
      {service.securityCode !== undefined &&
        service.status !== "finished" &&
        service.status !== "cancelled" && (
          <View
            className="mt-3 p-4"
            style={{
              backgroundColor: "rgba(161, 196, 253, 0.1)",
              borderRadius: TACTICAL_RADIUS.sharp,
              borderLeftWidth: 2,
              borderLeftColor: TACTICAL_COLORS.accent,
            }}
          >
            <TacticalLabel size={9}>Código de seguridad</TacticalLabel>
            <TacticalValue size={20} tone="accent" className="mt-1">
              {service.securityCode}
            </TacticalValue>
          </View>
        )}
      {service.status === "pending" && (
        <View
          className="mt-3 p-3"
          style={{
            backgroundColor: TACTICAL_COLORS.surfaceSunken,
            borderRadius: TACTICAL_RADIUS.sharp,
          }}
        >
          <TacticalLabel size={10} className="mb-2">
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
                      driverPlate: offer.driverPlate,
                      driverVehicle: offer.driverVehicle,
                      driverColor: offer.driverColor,
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
                  <TacticalLabel size={10} tone="text">
                    {`${offer.driverName} · ${offer.driverRating.toFixed(1)}★${
                      offer.driverTrips > 0
                        ? ` · ${offer.driverTrips} viajes`
                        : ""
                    }`}
                  </TacticalLabel>
                  <TacticalValue size={18} tone="accent" className="mt-1">
                    {`S/${offer.offeredPrice.toFixed(2)}`}
                  </TacticalValue>
                  <TacticalLabel size={9} tone="accent" className="mt-1">
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
              fontSize: 12,
              letterSpacing: 1.4,
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
    </UiCard>
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
  const listPrice = serviceHours * hourlyRate;
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
          Math.max(280, screenHeight - keyboardHeight - insets.top - 72),
        )
      : Math.round(Math.min(520, Math.max(360, screenHeight * 0.52)));
  /** Preview: altura fija razonable (mapa visible arriba). */
  const confirmSheetHeight = Math.round(
    Math.min(440, Math.max(320, screenHeight * 0.42)),
  );

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

  const handleAndroidBack = useCallback(() => {
    if (menuOpen) {
      setMenuOpen(false);
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
    if (menuSection !== "ciudad") {
      setMenuSection("ciudad");
      setFlowStep("compose");
      return true;
    }
    return false;
  }, [menuOpen, addressSearchField, flowStep, menuSection]);

  useAndroidBackHandler(handleAndroidBack);

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
    setFlowStep("compose");
  }

  async function handleSubmit() {
    if (
      origin.trim() === "" ||
      destination.address.trim() === "" ||
      department === "" ||
      listPrice < minServicePrice
    ) {
      setError(
        `Completa origen, destino y al menos ${minServiceHours}h (${currencySymbol}${minServicePrice}).`,
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
      });
      resetComposeForm();
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
        <View
          className="flex-row items-center gap-3 px-4"
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: TACTICAL_BORDER,
            backgroundColor: TACTICAL_COLORS.baseElevated,
          }}
        >
          <HamburgerButton onPress={() => setMenuOpen(true)} variant="tactical" />
          <TacticalTitle size={17} className="flex-1">
            {menuSection === "notificaciones"
              ? "Notificaciones"
              : "Mis servicios"}
          </TacticalTitle>
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
                  <TacticalLabel size={9} tone="accent">
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
                    <TacticalLabel size={9} tone="text">
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
          ) : services.length === 0 ? (
            <UiEmpty
              title="Aún no tienes solicitudes."
              subtitle="Cuando pidas un servicio, aparece aquí."
            />
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

  if (me !== null && me.identityComplete !== true) {
    return (
      <View className="flex-1">
        <ClientIdentityForm onOpenMenu={() => setMenuOpen(true)} />
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
        <TacticalLabel size={9} className="mb-1.5">
          {label}
        </TacticalLabel>
        <Pressable
          onPress={onPress}
          disabled={submitting}
          className="px-4 py-3.5"
          style={{
            backgroundColor: TACTICAL_COLORS.surfaceSunken,
            borderRadius: TACTICAL_RADIUS.sharp,
            borderWidth: 1,
            borderColor: TACTICAL_BORDER,
          }}
        >
          <Text
            style={{
              fontFamily: POPPINS.regular,
              fontSize: 15,
              color:
                value.trim() !== ""
                  ? TACTICAL_COLORS.textStrong
                  : TACTICAL_COLORS.steel,
            }}
            numberOfLines={2}
          >
            {value.trim() !== "" ? value : placeholder}
          </Text>
        </Pressable>
      </View>
    );

    return (
      <View className="flex-1" style={{ backgroundColor: TACTICAL_COLORS.base }}>
        <View
          style={{ paddingTop: insets.top + 8 }}
          className="z-10 flex-row items-center px-4 pb-2"
        >
          <HamburgerButton onPress={() => setMenuOpen(true)} variant="tactical" />
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
            <TacticalTitle size={22} className="mb-6">
              Nuevo servicio
            </TacticalTitle>

            <UiCard className="gap-3 overflow-hidden pb-0">
              {addressFieldButton(
                "Punto de recojo",
                origin,
                "¿De dónde te recogemos?",
                () => openAddressSearch("origin"),
              )}
              <UiButton
                label="Usar mi ubicación actual"
                onPress={() => void handleUseMyLocationForOrigin()}
                disabled={locationLoading || submitting}
                loading={locationLoading}
                variant="secondary"
              />

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
                    className="mt-6 h-12 w-12 items-center justify-center"
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
                        color: TACTICAL_COLORS.steel,
                      }}
                    >
                      ✕
                    </Text>
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
                className="rounded-2xl py-2.5 disabled:opacity-60"
              >
                <TacticalLabel size={10} className="text-center">
                  + Agregar parada
                </TacticalLabel>
              </TouchableOpacity>

              <UiButton
                label="Continuar"
                onPress={handleContinueToConfirm}
                disabled={!canContinue || submitting}
              />

            </UiCard>

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
        ) : (
          <View
            className="flex-1 justify-end"
            style={{ paddingBottom: keyboardHeight }}
          >
            <View
              className="mx-2 overflow-hidden"
              style={[
                {
                  height: addressSheetHeight,
                  backgroundColor: TACTICAL_COLORS.base,
                  borderTopWidth: 1,
                  borderTopColor: TACTICAL_COLORS.accent,
                },
                SHEET_SHADOW,
              ]}
            >
              <View className="flex-row items-center justify-between px-4 pb-1 pt-3">
                <View className="w-10" />
                <View
                  className="h-1 w-10"
                  style={{
                    backgroundColor: TACTICAL_COLORS.steel,
                    borderRadius: TACTICAL_RADIUS.sharp,
                  }}
                />
                <TouchableOpacity
                  onPress={closeAddressSearch}
                  className="h-10 w-10 items-center justify-center"
                  hitSlop={8}
                >
                  <Text
                    style={{
                      fontFamily: MONO.bold,
                      fontSize: 16,
                      color: TACTICAL_COLORS.steel,
                    }}
                  >
                    ✕
                  </Text>
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
                <TacticalTitle size={18} className="mb-3">
                  Dirección
                </TacticalTitle>

                <View className="mb-3">
                  <TacticalLabel size={10} className="mb-1.5">
                    Punto de recojo
                  </TacticalLabel>
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
                  <TacticalLabel size={10} className="mb-1.5">
                    Destino
                  </TacticalLabel>
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
            </View>
          </View>
        )}
        {drawer}
      </View>
    );
  }

  // ——— Paso 2: mapa + horas / tarifa ———
  return (
    <View className="flex-1" style={{ backgroundColor: TACTICAL_COLORS.base }}>
      <MapView
        key={`map-${originLat}-${originLng}-${destination.lat}-${destination.lng}`}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={confirmMapRegion}
        mapType="standard"
        showsUserLocation={showsBlueDot}
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
            className="h-12 w-12 items-center justify-center"
            style={{
              backgroundColor: TACTICAL_COLORS.surface,
              borderRadius: TACTICAL_RADIUS.sharp,
              borderWidth: 1,
              borderColor: TACTICAL_BORDER,
            }}
          >
            <Text
              style={{
                fontFamily: MONO.bold,
                fontSize: 18,
                color: TACTICAL_COLORS.accent,
              }}
            >
              ←
            </Text>
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
        className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden"
        style={[
          {
            backgroundColor: TACTICAL_COLORS.base,
            borderTopWidth: 1,
            borderTopColor: TACTICAL_COLORS.accent,
          },
          {
            height: confirmSheetHeight,
            paddingBottom: insets.bottom + 8,
          },
          SHEET_SHADOW,
        ]}
      >
        <View className="items-center pb-1 pt-3">
          <View
            className="h-1 w-10"
            style={{
              backgroundColor: TACTICAL_COLORS.steel,
              borderRadius: TACTICAL_RADIUS.sharp,
            }}
          />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 20,
          }}
        >
          <TacticalTitle size={18} className="mb-3">
            Confirmar
          </TacticalTitle>

          <TacticalPanel tone="sunken" className="mb-4">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setFlowStep("compose");
                setError(null);
                setAddressSearchField("origin");
              }}
            >
              <TacticalLabel size={10}>De · tocar para editar</TacticalLabel>
              <TacticalText size={13} tone="text" className="mt-0.5" numberOfLines={2}>
                {origin}
              </TacticalText>
            </TouchableOpacity>
            <View
              className="my-2 h-px"
              style={{ backgroundColor: TACTICAL_BORDER }}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setFlowStep("compose");
                setError(null);
                setAddressSearchField("destination");
              }}
            >
              <TacticalLabel size={10}>A · tocar para editar</TacticalLabel>
              <TacticalText size={13} tone="text" className="mt-0.5" numberOfLines={2}>
                {formatServiceStopsLabel(
                  toServiceLocation(destination),
                  extraDestinations.map((stop) => toServiceLocation(stop)),
                )}
              </TacticalText>
            </TouchableOpacity>
          </TacticalPanel>

          <TacticalLabel size={10} className="mb-2">
            ¿Cuánto tiempo necesitas?
          </TacticalLabel>
          <TacticalText size={11} className="mb-3">
            Tarifa {currencySymbol}
            {hourlyRate}/h · mínimo {minServiceHours}h = {currencySymbol}
            {minServicePrice}
          </TacticalText>

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
                  className="px-4 py-3"
                  style={{
                    backgroundColor: selected
                      ? TACTICAL_COLORS.accent
                      : TACTICAL_COLORS.surfaceSunken,
                    borderRadius: TACTICAL_RADIUS.panel,
                    borderWidth: 1,
                    borderColor: selected
                      ? TACTICAL_COLORS.accent
                      : TACTICAL_BORDER,
                  }}
                >
                  <TacticalValue
                    size={14}
                    tone={selected ? "steel" : "text"}
                    className="text-center"
                    style={{
                      color: selected
                        ? TACTICAL_COLORS.base
                        : TACTICAL_COLORS.textStrong,
                    }}
                  >
                    {hours}h
                  </TacticalValue>
                  <TacticalText
                    size={11}
                    className="mt-0.5 text-center"
                    style={{
                      color: selected
                        ? TACTICAL_COLORS.base
                        : TACTICAL_COLORS.steel,
                    }}
                  >
                    {currencySymbol}
                    {hours * hourlyRate}
                  </TacticalText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TacticalPanel active className="mb-3 flex-row items-end justify-between">
            <View>
              <TacticalLabel size={10} tone="accent">
                Tarifa estimada
              </TacticalLabel>
              <TacticalValue size={26} tone="accent" className="mt-0.5">
                {currencySymbol}
                {listPrice.toFixed(0)}
              </TacticalValue>
            </View>
            <TacticalText size={11} className="pb-1">
              {serviceHours}h × {currencySymbol}
              {hourlyRate}
            </TacticalText>
          </TacticalPanel>

          {promoPreview !== undefined && promoPreview !== null && (
            <TacticalPanel tone="sunken" className="mb-3">
              <TacticalLabel size={10} tone="accent">
                Promo: {promoPreview.promotionName} (
                {(promoPreview.discountRate * 100).toFixed(0)}% off)
              </TacticalLabel>
              <TacticalText size={11} className="mt-1">
                Pagas {currencySymbol}
                {promoPreview.basePrice.toFixed(2)} (lista {currencySymbol}
                {promoPreview.catalogBasePrice.toFixed(2)}).
              </TacticalText>
            </TacticalPanel>
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
      </View>
      {drawer}
    </View>
  );
}
