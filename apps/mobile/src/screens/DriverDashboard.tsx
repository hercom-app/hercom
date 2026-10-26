import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { AvailabilityToggle } from "../components/AvailabilityToggle";
import { DriverMyData } from "../components/DriverMyData";
import { DriverEarningsView } from "../components/DriverEarningsView";
import { ServiceCard } from "../components/ServiceCard";
import { SideDrawer } from "../components/SideDrawer";
import { SupportChatScreen } from "./SupportChatScreen";
import { useAppMode } from "../contexts/AppModeContext";
import { useAndroidBackHandler } from "../hooks/useAndroidBackHandler";
import { hasTripCreditForOffer } from "../lib/offerWallet";
import { formatTripCreditsShort } from "../lib/driverWalletDisplay";
import {
  convexErrorMessage,
  isInsufficientBalanceError,
} from "../lib/convexErrorMessage";
import { isActiveServiceStatus } from "../lib/serviceStatus";
import { formatServiceStopsLabel } from "../lib/wazeNavigation";
import type { Id } from "@proyecto/backend/dataModel";
import { ChecklistRecojoScreen } from "./ChecklistRecojoScreen";
import { useDriverLiveTracking } from "../hooks/useDriverLiveTracking";
import {
  getDriverGpsForOffer,
  useDriverOfferLocation,
} from "../hooks/useDriverOfferLocation";
import { HelpFab } from "../components/HelpFab";
import { LiveTripMapModal } from "../components/LiveTripMapModal";
import { UberScreenHeader } from "../components/uber/UberScreenHeader";
import { DriverWalletBalanceView } from "../components/wallet/DriverWalletBalanceView";
import { DriverWalletTopUpView } from "../components/wallet/DriverWalletTopUpView";
import { WalletScreenTransition } from "../components/wallet/WalletScreenTransition";
import {
  FieldDataBand,
  TacticalButton,
  TacticalEmpty,
  TacticalInput,
  TacticalLabel,
  TacticalPanel,
  TacticalStatus,
  TacticalText,
  TacticalValue,
} from "../components/tactical";
import { useAppTheme } from "../contexts/ThemeContext";
import {
  HERCOM_COLORS,
  MONO,
  TACTICAL_BORDER,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";

const MIN_OFFER_PRICE = 80;

export function DriverDashboard() {
  const { userName } = useAppMode();
  const { colors: themeColors } = useAppTheme();
  const submitMyOffer = useMutation(api.serviceOffers.submitMyOffer);
  const markAllNotificationsAsRead = useMutation(api.notifications.markAllAsRead);
  const [checklistServiceId, setChecklistServiceId] =
    useState<Id<"services"> | null>(null);
  const me = useQuery(api.users.getMe);
  const driver = useQuery(api.drivers.getMyDriverProfile);
  const wallet = useQuery(
    api.driverWallets.getMine,
    driver === undefined || driver === null ? "skip" : {},
  );
  const walletTransactions = useQuery(
    api.driverWallets.listMyTransactions,
    driver === undefined || driver === null ? "skip" : { limit: 25 },
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuSection, setMenuSection] = useState("servicios");
  const [walletFlow, setWalletFlow] = useState<"balance" | "topup">("balance");

  const services = useQuery(
    api.services.listForDriver,
    driver === undefined || driver === null ? "skip" : {},
  );
  const offersLocationEnabled =
    driver?.status === "available" && menuSection === "ofertas";
  const {
    coords: offerCoords,
    error: offerLocationError,
    loading: offerLocationLoading,
    refresh: refreshOfferLocation,
  } = useDriverOfferLocation(offersLocationEnabled);

  const openOffersPayload = useQuery(
    api.services.listOpenForOffers,
    driver === undefined || driver === null || menuSection !== "ofertas"
      ? "skip"
      : driver.status !== "available"
        ? {}
        : offerCoords !== null
          ? { driverLat: offerCoords.lat, driverLng: offerCoords.lng }
          : "skip",
  );
  const openServices = openOffersPayload?.services ?? [];
  const maxOfferDistanceKm = openOffersPayload?.maxDistanceKm ?? 10;
  const myPendingOffers = useQuery(
    api.serviceOffers.listMinePending,
    driver === undefined || driver === null ? "skip" : {},
  );
  const notifications = useQuery(
    api.notifications.listMine,
    driver === undefined || driver === null ? "skip" : { limit: 8 },
  );
  const [offerByService, setOfferByService] = useState<Record<string, string>>({});
  const [offeringServiceId, setOfferingServiceId] = useState<string | null>(null);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [liveMapServiceId, setLiveMapServiceId] =
    useState<Id<"services"> | null>(null);

  const handleAndroidBack = useCallback(() => {
    if (liveMapServiceId !== null) {
      setLiveMapServiceId(null);
      return true;
    }
    if (menuOpen) {
      setMenuOpen(false);
      return true;
    }
    if (checklistServiceId !== null) {
      setChecklistServiceId(null);
      return true;
    }
    if (menuSection === "saldo" && walletFlow === "topup") {
      setWalletFlow("balance");
      return true;
    }
    if (menuSection !== "servicios") {
      setMenuSection("servicios");
      return true;
    }
    return false;
  }, [liveMapServiceId, menuOpen, checklistServiceId, menuSection, walletFlow]);

  useEffect(() => {
    if (menuSection !== "saldo") {
      setWalletFlow("balance");
    }
  }, [menuSection]);

  useAndroidBackHandler(handleAndroidBack);
  useDriverLiveTracking(services);

  if (driver === undefined) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: TACTICAL_COLORS.base }}
      >
        <ActivityIndicator color={TACTICAL_COLORS.accent} />
      </View>
    );
  }

  if (driver === null) {
    return null;
  }

  if (checklistServiceId !== null) {
    return (
      <ChecklistRecojoScreen
        serviceId={checklistServiceId}
        onBack={() => setChecklistServiceId(null)}
      />
    );
  }

  const activeServices = (services ?? []).filter((s) =>
    isActiveServiceStatus(s.status),
  );
  const hasActiveService = activeServices.length > 0;
  const unreadNotifications = (notifications ?? []).filter(
    (notification) => notification.readAt === undefined,
  ).length;
  const myOfferByService = Object.fromEntries(
    (myPendingOffers ?? []).map((offer) => [offer.serviceId, offer.offeredPrice]),
  );
  const isAvailable = driver.status === "available";
  const tripCredits = wallet?.tripCredits ?? 0;
  const hasTripsForOffer = hasTripCreditForOffer(tripCredits);
  const lacksTrips =
    (openServices ?? []).length > 0 && !hasTripsForOffer;
  const offersLocked = !isAvailable || lacksTrips;
  const offersLockReason = !isAvailable
    ? "Desliza para ponerte disponible y poder ofertar."
    : "No tienes viajes prepagados. Recarga desde el menú.";


  const title =
    menuSection === "ganancias"
        ? "Ganancias"
        : menuSection === "notificaciones"
          ? "Notificaciones"
          : menuSection === "configuracion"
            ? "Mis datos"
            : menuSection === "ayuda"
              ? "Ayuda"
              : menuSection === "ofertas"
                ? "Solicitudes abiertas"
                : "Servicios";

  const drawer = (
    <SideDrawer
      visible={menuOpen}
      onClose={() => setMenuOpen(false)}
      userName={userName}
      avatarUrl={me?.selfieUrl}
      unreadCount={unreadNotifications}
      activeItem={menuSection}
      onSelectItem={(key) => {
        if (
          key === "servicios" ||
          key === "ofertas" ||
          key === "saldo" ||
          key === "ganancias" ||
          key === "notificaciones" ||
          key === "configuracion" ||
          key === "ayuda"
        ) {
          setMenuSection(key);
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

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: themeColors.base,
      }}
    >
      {menuSection !== "saldo" ? (
        <UberScreenHeader
          title={title}
          subtitle="Mis viajes y solicitudes"
          onOpenMenu={() => setMenuOpen(true)}
        />
      ) : null}

      <View
        className={`flex-1 ${menuSection === "saldo" ? "" : "px-4 pt-4"}`}
        style={menuSection === "servicios" ? { position: "relative" } : undefined}
      >
        {menuSection === "ganancias" ? (
          <DriverEarningsView />
        ) : menuSection === "saldo" ? (
          <WalletScreenTransition screenKey={walletFlow}>
            {walletFlow === "balance" ? (
              <DriverWalletBalanceView
                tripCredits={tripCredits}
                transactions={walletTransactions}
                onBack={() => setMenuSection("servicios")}
                onRecargar={() => setWalletFlow("topup")}
              />
            ) : (
              <DriverWalletTopUpView
                onBack={() => setWalletFlow("balance")}
                onTopUpComplete={() => setWalletFlow("balance")}
              />
            )}
          </WalletScreenTransition>
        ) : menuSection === "configuracion" ? (
          <DriverMyData driver={driver} fallbackName={userName} />
        ) : menuSection === "notificaciones" ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <TacticalPanel corners>
              <View className="mb-3 flex-row items-center justify-between">
                <TacticalStatus
                  label={`${unreadNotifications} sin leer`}
                  tone={unreadNotifications > 0 ? "active" : "idle"}
                />
                <TouchableOpacity onPress={() => void markAllNotificationsAsRead()}>
                  <TacticalLabel tone="accent">
                    Marcar todo leído
                  </TacticalLabel>
                </TouchableOpacity>
              </View>
              {(notifications ?? []).length === 0 ? (
                <TacticalEmpty title="Sin notificaciones" />
              ) : (
                (notifications ?? []).map((notification) => (
                  <TacticalPanel
                    key={notification._id}
                    tone="sunken"
                    className="mb-2 p-4"
                    style={
                      notification.readAt === undefined
                        ? { backgroundColor: TACTICAL_COLORS.dataBandBg }
                        : undefined
                    }
                  >
                    <TacticalLabel tone="text">
                      {notification.title}
                    </TacticalLabel>
                    <TacticalText size={11} className="mt-1">
                      {notification.message}
                    </TacticalText>
                  </TacticalPanel>
                ))
              )}
            </TacticalPanel>
          </ScrollView>
        ) : (
          <>
            {!(menuSection === "servicios" && hasActiveService) && (
              <>
                <AvailabilityToggle status={driver.status} />

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setMenuSection("saldo")}
                  accessibilityRole="button"
                  accessibilityLabel={`Viajes disponibles, ${formatTripCreditsShort(tripCredits)}. Abrir recargas`}
                  className="mb-3 flex-row items-center justify-between px-5 py-4"
                  style={{
                    backgroundColor: TACTICAL_COLORS.surface,
                    borderRadius: TACTICAL_RADIUS.panel,
                    shadowColor: "#0F172A",
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 2,
                    minHeight: 48,
                  }}
                >
                  <TacticalLabel>Saldo disponible</TacticalLabel>
                  <TacticalValue size={15} tone="accent">
                    {`${formatTripCreditsShort(tripCredits)} ›`}
                  </TacticalValue>
                </TouchableOpacity>
              </>
            )}

            {menuSection === "ofertas" && (
              <View className="mb-4 overflow-hidden">
                <TacticalPanel corners>
                  <TacticalLabel tone="accent" className="mb-2">
                    Solicitudes para ofertar
                  </TacticalLabel>
                  <TacticalPanel tone="sunken" className="mb-2 px-3 py-2">
                    <TacticalLabel tone="accent">
                      {`Radio de búsqueda: ${maxOfferDistanceKm} km`}
                    </TacticalLabel>
                    <TacticalText size={11} className="mt-1">
                      Estás viendo solicitudes cuyo origen está como máximo a{" "}
                      {maxOfferDistanceKm} km de tu ubicación actual. Este tope
                      lo define Hercom por mercado (configurable en admin).
                    </TacticalText>
                  </TacticalPanel>
                  {offerLocationLoading ? (
                    <ActivityIndicator
                      color={TACTICAL_COLORS.accent}
                      className="my-3"
                    />
                  ) : null}
                  {offerLocationError !== null ? (
                    <View className="mb-2 gap-2">
                      <TacticalText size={12} style={{ color: TACTICAL_COLORS.danger }}>
                        {offerLocationError}
                      </TacticalText>
                      <TacticalButton
                        label="Actualizar ubicación"
                        variant="secondary"
                        size="md"
                        onPress={() => void refreshOfferLocation()}
                      />
                    </View>
                  ) : null}
                {(openServices ?? []).length === 0 ? (
                  <TacticalEmpty
                    title="Sin solicitudes cercanas"
                    subtitle={
                      driver?.status === "available"
                        ? `No hay pedidos pending dentro de ${maxOfferDistanceKm} km. Prueba actualizar tu ubicación.`
                        : "Conéctate como disponible para ver solicitudes."
                    }
                  />
                ) : (
                  <View className="relative">
                    <View
                      pointerEvents={offersLocked ? "none" : "auto"}
                      style={offersLocked ? { opacity: 0.4 } : undefined}
                    >
                      {(openServices ?? []).map((service) => {
                        const minPrice =
                          service.catalogBasePrice ?? service.basePrice;
                        const floorPrice = Math.max(MIN_OFFER_PRICE, minPrice);
                        const maxOfferPrice =
                          Math.round(floorPrice * 1.5 * 100) / 100;
                        const defaultOffer = String(floorPrice);
                        const alreadyOffered = myOfferByService[service._id];
                        const canAfford = hasTripCreditForOffer(tripCredits);
                        return (
                          <TacticalPanel
                            key={service._id}
                            tone="sunken"
                            className="mb-2 p-3"
                          >
                            <View className="flex-row items-center justify-between">
                              <TacticalLabel>Tarifa lista</TacticalLabel>
                              <TacticalValue size={13} tone="accent">
                                {`S/${minPrice.toFixed(2)}`}
                              </TacticalValue>
                            </View>
                            {service.discountRate !== undefined &&
                              service.discountRate > 0 && (
                                <TacticalText size={10} className="mt-0.5">
                                  {`Cliente paga S/${service.basePrice.toFixed(2)}`}
                                </TacticalText>
                              )}
                            <TacticalText size={11} tone="text" className="mt-1.5">
                              {service.origin.address} →{" "}
                              {formatServiceStopsLabel(
                                service.destination,
                                service.extraDestinations,
                              )}
                            </TacticalText>
                            <TacticalText size={10} className="mt-1">
                              {`Oferta entre S/${floorPrice.toFixed(2)} y S/${maxOfferPrice.toFixed(2)} (tope +50% sobre tarifa base).`}
                            </TacticalText>
                            {alreadyOffered !== undefined ? (
                              <View
                                className="mt-2 px-3 py-2"
                                style={{
                                  borderRadius: TACTICAL_RADIUS.sharp,
                                  borderWidth: 1,
                                  borderColor: TACTICAL_COLORS.accent,
                                  backgroundColor: "rgba(161, 196, 253, 0.1)",
                                }}
                              >
                                <TacticalValue size={12} tone="accent">
                                  {`Ofertaste S/${alreadyOffered.toFixed(2)}`}
                                </TacticalValue>
                                <TacticalText size={10} className="mt-0.5">
                                  Esperando respuesta del cliente
                                </TacticalText>
                              </View>
                            ) : (
                              <View className="mt-2 flex-row items-center gap-2">
                                <TacticalInput
                                  mono
                                  value={
                                    offerByService[service._id] ?? defaultOffer
                                  }
                                  onChangeText={(value) =>
                                    setOfferByService((prev) => ({
                                      ...prev,
                                      [service._id]: value,
                                    }))
                                  }
                                  onBlur={() => {
                                    const raw =
                                      offerByService[service._id] ??
                                      defaultOffer;
                                    const parsed = Number(raw);
                                    if (!Number.isFinite(parsed)) {
                                      setOfferByService((prev) => ({
                                        ...prev,
                                        [service._id]: defaultOffer,
                                      }));
                                      return;
                                    }
                                    const clamped = Math.min(
                                      Math.max(parsed, floorPrice),
                                      maxOfferPrice,
                                    );
                                    if (clamped !== parsed) {
                                      setOfferByService((prev) => ({
                                        ...prev,
                                        [service._id]: String(clamped),
                                      }));
                                    }
                                  }}
                                  editable={canAfford && isAvailable}
                                  placeholder={`S/${floorPrice.toFixed(0)} – S/${maxOfferPrice.toFixed(0)}`}
                                  keyboardType="decimal-pad"
                                  containerClassName="flex-1"
                                />
                                <View>
                                  <TacticalButton
                                    label="Ofertar"
                                    size="md"
                                    onPress={() => {
                                    if (!isAvailable || !canAfford) {
                                      return;
                                    }
                                    const offeredPrice = Number(
                                      offerByService[service._id] ??
                                        defaultOffer,
                                    );
                                    if (
                                      !Number.isFinite(offeredPrice) ||
                                      offeredPrice < floorPrice
                                    ) {
                                      setOfferByService((prev) => ({
                                        ...prev,
                                        [service._id]: defaultOffer,
                                      }));
                                      setOfferError(
                                        `La oferta mínima es S/${floorPrice.toFixed(0)}.`,
                                      );
                                      return;
                                    }
                                    if (offeredPrice > maxOfferPrice) {
                                      setOfferError(
                                        `La oferta no puede superar S/${maxOfferPrice.toFixed(2)}.`,
                                      );
                                      return;
                                    }
                                    setOfferingServiceId(service._id);
                                    setOfferError(null);
                                    void (async () => {
                                      try {
                                        const gps = await getDriverGpsForOffer();
                                        return submitMyOffer({
                                          serviceId: service._id,
                                          offeredPrice,
                                          driverLat: gps.lat,
                                          driverLng: gps.lng,
                                        });
                                      } catch (gpsError) {
                                        const message =
                                          gpsError instanceof Error
                                            ? gpsError.message
                                            : "Activa la ubicación para ofertar.";
                                        setOfferError(message);
                                        Alert.alert("Ubicación", message);
                                        return { ok: false as const, message };
                                      }
                                    })()
                                      .then((result) => {
                                        if (result === undefined) {
                                          return;
                                        }
                                        if (result.ok) {
                                          return;
                                        }
                                        setOfferError(result.message);
                                        if (
                                          isInsufficientBalanceError(
                                            result.message,
                                          )
                                        ) {
                                          Alert.alert(
                                            "Saldo insuficiente",
                                            result.message,
                                            [
                                              {
                                                text: "Recargar",
                                                onPress: () =>
                                                  setMenuSection("saldo"),
                                              },
                                              { text: "OK" },
                                            ],
                                          );
                                          return;
                                        }
                                        Alert.alert(
                                          "No se pudo ofertar",
                                          result.message,
                                        );
                                      })
                                      .catch((error) => {
                                        const message = convexErrorMessage(
                                          error,
                                          "No se pudo enviar la oferta.",
                                        );
                                        setOfferError(message);
                                        Alert.alert(
                                          "No se pudo ofertar",
                                          message,
                                        );
                                      })
                                      .finally(() => setOfferingServiceId(null));
                                    }}
                                    disabled={
                                      offeringServiceId === service._id ||
                                      !canAfford ||
                                      !isAvailable
                                    }
                                    loading={offeringServiceId === service._id}
                                  />
                                </View>
                              </View>
                            )}
                          </TacticalPanel>
                        );
                      })}
                    </View>
                    {offersLocked && (
                      <View
                        className="absolute inset-0 items-center justify-center px-4"
                        style={{
                          backgroundColor: "rgba(17, 22, 34, 0.86)",
                          borderRadius: TACTICAL_RADIUS.sharp,
                        }}
                      >
                        <TacticalLabel
                          size={10}
                          tone="text"
                          className="text-center"
                        >
                          {offersLockReason}
                        </TacticalLabel>
                        {lacksTrips && isAvailable && (
                          <View className="mt-3">
                            <TacticalButton
                              label="Recargar viajes"
                              variant="secondary"
                              size="md"
                              onPress={() => setMenuSection("saldo")}
                            />
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}
                {offerError !== null && (
                  <Text
                    className="mt-2 text-xs"
                    style={{
                      fontFamily: MONO.medium,
                      color: TACTICAL_COLORS.danger,
                    }}
                  >
                    {offerError}
                  </Text>
                )}
                </TacticalPanel>
              </View>
            )}

            {menuSection === "servicios" && hasActiveService ? (
              <View
                pointerEvents="box-none"
                style={{
                  position: "absolute",
                  top: 4,
                  right: 0,
                  zIndex: 30,
                }}
              >
                <HelpFab
                  fallbackCenter={{
                    lat: activeServices[0]!.origin.lat,
                    lng: activeServices[0]!.origin.lng,
                  }}
                />
              </View>
            ) : null}

            {menuSection === "servicios" && (
              <FlatList
                data={activeServices}
                keyExtractor={(item) => item._id}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="none"
                removeClippedSubviews={false}
                contentContainerStyle={{ paddingBottom: 32 }}
                renderItem={({ item }) => (
                  <ServiceCard
                    service={item}
                    onOpenChecklist={setChecklistServiceId}
                    onOpenLiveMap={setLiveMapServiceId}
                  />
                )}
                ListEmptyComponent={
                  <View className="gap-3">
                    <TacticalEmpty
                      title="Sin viaje activo"
                      subtitle="Aquí verás solo el servicio en curso. Las solicitudes para ofertar están en la pestaña Ofertas."
                    />
                    <TacticalButton
                      label="Ver solicitudes para ofertar"
                      variant="secondary"
                      size="md"
                      accessibilityLabel="Ir a solicitudes para ofertar"
                      onPress={() => setMenuSection("ofertas")}
                    />
                  </View>
                }
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        )}
      </View>

      {drawer}

      <LiveTripMapModal
        visible={liveMapServiceId !== null}
        serviceId={liveMapServiceId ?? undefined}
        onClose={() => setLiveMapServiceId(null)}
        title="Mi ubicación en vivo"
      />
    </View>
  );
}
