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
import { HercomLogo } from "../components/HercomLogo";
import { RateServiceStars } from "../components/RateServiceStars";
import { SideDrawer } from "../components/SideDrawer";
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
import { HERCOM_COLORS } from "../constants/theme";
import { useAndroidBackHandler } from "../hooks/useAndroidBackHandler";
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
    <View className="mb-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-semibold uppercase text-hercom">
            {STATUS_LABELS[service.status]}
          </Text>
          {(service.serviceType ?? "app") === "app" && (
            <Text className="rounded-full bg-hercom-soft px-2 py-0.5 text-xs font-semibold text-hercom-dark">
              App
            </Text>
          )}
        </View>
        <Text className="text-base font-bold text-slate-900">
          {service.offeredPrice !== undefined
            ? `S/${agreedPrice.toFixed(2)}`
            : "Sin acordar"}
        </Text>
      </View>
      <Text className="mb-1 text-base text-slate-600">
        {service.offeredPrice !== undefined
          ? `Tarifa acordada: S/${service.offeredPrice.toFixed(2)}`
          : "Esperando acuerdo de tarifa"}
      </Text>
      <Text className="mb-1 text-base font-medium text-slate-800">
        {service.driverName !== undefined
          ? `Chofer: ${service.driverName}`
          : "Sin chofer asignado"}
      </Text>
      {service.promotionName !== undefined && (
        <Text className="mb-1 text-base font-semibold text-hercom-dark">
          Promo: {service.promotionName}
        </Text>
      )}
      <Text className="text-base text-slate-700">
        {service.origin.address} →{" "}
        {formatServiceStopsLabel(service.destination, service.extraDestinations)}
      </Text>
      {canShowLive && (
        <TouchableOpacity
          onPress={() => setLiveMapOpen(true)}
          className="mt-3 rounded-xl bg-hercom py-3"
        >
          <Text className="text-center text-base font-bold text-white">
            Ver chofer en vivo · Compartir viaje
          </Text>
        </TouchableOpacity>
      )}
      {inProgress && (
        <TouchableOpacity
          onPress={() => {
            setRouteError(null);
            setEditRouteOpen(true);
          }}
          className="mt-3 rounded-xl border border-hercom py-3"
        >
          <Text className="text-center text-base font-semibold text-hercom">
            Editar partida o destino
          </Text>
        </TouchableOpacity>
      )}
      {service.status === "assigned" && service.offeredPrice !== undefined && (
        <View className="mt-3 rounded-xl bg-surface-muted p-4">
          <Text className="text-lg font-bold text-slate-900">
            Anticipo: S/{advanceAmount.toFixed(2)}
          </Text>
          <Text className="mt-1 text-base text-slate-600">
            Transfiere el 25% de la tarifa al chofer antes de que salga.
          </Text>
          <TouchableOpacity
            onPress={() => setPayoutOpen(true)}
            className="mt-3 rounded-xl bg-white py-3"
          >
            <Text className="text-center text-base font-bold text-hercom">
              Ver datos para transferir
            </Text>
          </TouchableOpacity>
          {advanceConfirmed && (
            <Text className="mt-3 text-base font-semibold text-success">
              ✓ El chofer confirmó que recibió el anticipo
            </Text>
          )}
        </View>
      )}
      {service.securityCode !== undefined &&
        service.status !== "finished" &&
        service.status !== "cancelled" && (
          <View className="mt-3 rounded-xl bg-hercom-soft p-4">
            <Text className="text-base text-hercom-dark">
              Código de seguridad para iniciar viaje:{" "}
              <Text className="font-bold text-slate-900">{service.securityCode}</Text>
            </Text>
          </View>
        )}
      {service.status === "pending" && (
        <View className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <Text className="mb-2 text-base font-semibold text-slate-600">
            Ofertas de choferes
          </Text>
          {offers === undefined ? (
            <Text className="text-base text-slate-500">Cargando ofertas...</Text>
          ) : offers.length === 0 ? (
            <Text className="text-base text-slate-500">
              Aún no hay ofertas para este servicio.
            </Text>
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
                  className="mb-2 rounded-lg border border-slate-200 bg-white p-3"
                >
                  <Text className="text-base font-semibold text-slate-800">
                    {offer.driverName} · {offer.driverRating.toFixed(1)}★
                    {offer.driverTrips > 0
                      ? ` · ${offer.driverTrips} viajes`
                      : ""}
                  </Text>
                  <Text className="mt-1 text-lg font-bold text-slate-900">
                    S/{offer.offeredPrice.toFixed(2)}
                  </Text>
                  <Text className="mt-1 text-base font-semibold text-hercom">
                    Ver chofer
                  </Text>
                </TouchableOpacity>
              ))
          )}
          {offerError !== null && selectedOffer === null && (
            <Text className="mt-1 text-base font-medium text-red-600">{offerError}</Text>
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
        <Text className="mt-3 text-base font-semibold text-slate-700">
          Valoraste este viaje con {service.clientRating}★
        </Text>
      )}
      {canCancel && (
        <TouchableOpacity
          onPress={() => void handleCancel()}
          disabled={cancelling}
          className="mt-3 rounded-xl border border-red-200 py-3 disabled:opacity-60"
        >
          <Text className="text-center text-base font-semibold text-red-600">
            {cancelling ? "Cancelando..." : "Cancelar solicitud"}
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
            <Text className="mb-3 text-center text-sm text-success">
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
              ¿Dónde necesitas un chofer de remplazo?
            </Text>

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
                className="flex-row items-center justify-center rounded-2xl border border-hercom/30 bg-hercom-soft py-3 disabled:opacity-60"
              >
                {locationLoading ? (
                  <ActivityIndicator color={HERCOM_COLORS.primary} />
                ) : (
                  <Text className="text-sm font-semibold text-hercom-dark">
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
          <View
            className="flex-1 justify-end"
            style={{ paddingBottom: keyboardHeight }}
          >
            <View
              className="mx-2 overflow-hidden rounded-t-[28px] bg-white"
              style={{
                height: addressSheetHeight,
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
                  paddingBottom: insets.bottom + 24,
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
                    onPress={handleContinueToConfirm}
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

  // ——— Paso 2: mapa + horas / tarifa ———
  return (
    <View className="flex-1 bg-canvas">
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
          height: confirmSheetHeight,
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
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setFlowStep("compose");
                setError(null);
                setAddressSearchField("origin");
              }}
            >
              <Text className="text-[11px] font-semibold uppercase text-slate-500">
                De · tocar para editar
              </Text>
              <Text
                className="mt-0.5 text-sm font-medium text-slate-900"
                numberOfLines={2}
              >
                {origin}
              </Text>
            </TouchableOpacity>
            <View className="my-2 h-px bg-slate-200" />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setFlowStep("compose");
                setError(null);
                setAddressSearchField("destination");
              }}
            >
              <Text className="text-[11px] font-semibold uppercase text-slate-500">
                A · tocar para editar
              </Text>
              <Text
                className="mt-0.5 text-sm font-medium text-slate-900"
                numberOfLines={2}
              >
                {formatServiceStopsLabel(
                  toServiceLocation(destination),
                  extraDestinations.map((stop) => toServiceLocation(stop)),
                )}
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="mb-2 text-xs font-semibold text-slate-600">
            ¿Cuánto tiempo necesitas?
          </Text>
          <Text className="mb-3 text-xs text-slate-500">
            Tarifa {currencySymbol}
            {hourlyRate}/h · mínimo {minServiceHours}h = {currencySymbol}
            {minServicePrice}
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
                    {currencySymbol}
                    {hours * hourlyRate}
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
                {currencySymbol}
                {listPrice.toFixed(0)}
              </Text>
            </View>
            <Text className="pb-1 text-xs text-slate-400">
              {serviceHours}h × {currencySymbol}
              {hourlyRate}
            </Text>
          </View>

          {promoPreview !== undefined && promoPreview !== null && (
            <View className="mb-3 rounded-xl bg-hercom-soft px-3 py-2">
              <Text className="text-xs font-semibold text-hercom-dark">
                Promo: {promoPreview.promotionName} (
                {(promoPreview.discountRate * 100).toFixed(0)}% off)
              </Text>
              <Text className="mt-1 text-xs text-slate-600">
                Pagas {currencySymbol}
                {promoPreview.basePrice.toFixed(2)} (lista {currencySymbol}
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
                Solicitar servicio · {currencySymbol}
                {listPrice.toFixed(0)}
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
