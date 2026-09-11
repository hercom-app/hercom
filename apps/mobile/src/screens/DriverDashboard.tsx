import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { AvailabilityToggle } from "../components/AvailabilityToggle";
import { DriverPayoutConfig } from "../components/DriverPayoutConfig";
import { DriverEarningsView } from "../components/DriverEarningsView";
import { HamburgerButton } from "../components/HamburgerButton";
import { ServiceCard } from "../components/ServiceCard";
import { SideDrawer } from "../components/SideDrawer";
import { SupportChatScreen } from "./SupportChatScreen";
import { useAppMode } from "../contexts/AppModeContext";
import { useAndroidBackHandler } from "../hooks/useAndroidBackHandler";
import { canCoverOfferCommission } from "../lib/offerWallet";
import {
  convexErrorMessage,
  isInsufficientBalanceError,
} from "../lib/convexErrorMessage";
import { formatServiceStopsLabel } from "../lib/wazeNavigation";
import type { Id } from "@proyecto/backend/dataModel";
import { ChecklistRecojoScreen } from "./ChecklistRecojoScreen";
import { useDriverLiveTracking } from "../hooks/useDriverLiveTracking";
import { LiveTripMapModal } from "../components/LiveTripMapModal";
import {
  GridBackdrop,
  TacticalButton,
  TacticalEmpty,
  TacticalInput,
  TacticalLabel,
  TacticalPanel,
  TacticalStatus,
  TacticalText,
  TacticalTitle,
  TacticalValue,
} from "../components/tactical";
import {
  MONO,
  TACTICAL_BORDER,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";

const MIN_OFFER_PRICE = 80;

export function DriverDashboard() {
  const insets = useSafeAreaInsets();
  const { userName } = useAppMode();
  const topUpMine = useMutation(api.driverWallets.topUpMine);
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
    driver === undefined || driver === null ? "skip" : { limit: 8 },
  );
  const services = useQuery(
    api.services.listForDriver,
    driver === undefined || driver === null ? "skip" : {},
  );
  const openServices = useQuery(
    api.services.listOpenForOffers,
    driver === undefined || driver === null ? "skip" : {},
  );
  const myPendingOffers = useQuery(
    api.serviceOffers.listMinePending,
    driver === undefined || driver === null ? "skip" : {},
  );
  const notifications = useQuery(
    api.notifications.listMine,
    driver === undefined || driver === null ? "skip" : { limit: 8 },
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuSection, setMenuSection] = useState("servicios");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpSubmitting, setTopUpSubmitting] = useState(false);
  const [topUpMessage, setTopUpMessage] = useState<string | null>(null);
  const [topUpError, setTopUpError] = useState<string | null>(null);
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
    if (menuSection !== "servicios") {
      setMenuSection("servicios");
      return true;
    }
    return false;
  }, [liveMapServiceId, menuOpen, checklistServiceId, menuSection]);

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

  const activeServices = (services ?? []).filter(
    (s) =>
      s.status === "assigned" ||
      s.status === "heading_to_pickup" ||
      s.status === "arrived_pickup" ||
      s.status === "in_progress" ||
      s.status === "arrived_destination" ||
      s.status === "en_route",
  );
  const unreadNotifications = (notifications ?? []).filter(
    (notification) => notification.readAt === undefined,
  ).length;
  const myOfferByService = Object.fromEntries(
    (myPendingOffers ?? []).map((offer) => [offer.serviceId, offer.offeredPrice]),
  );
  const isAvailable = driver.status === "available";
  const walletBalance = wallet?.balance ?? 0;
  const canAffordAnyOpen = (openServices ?? []).some((service) =>
    canCoverOfferCommission(
      walletBalance,
      service.catalogBasePrice ?? service.basePrice,
    ),
  );
  const lacksBalance =
    (openServices ?? []).length > 0 && !canAffordAnyOpen;
  const offersLocked = !isAvailable || lacksBalance;
  const offersLockReason = !isAvailable
    ? "Desliza para ponerte disponible y poder ofertar."
    : "Saldo insuficiente para cubrir la comisión. Recarga desde el menú.";


  const title =
    menuSection === "saldo"
      ? "Recargar saldo"
      : menuSection === "ganancias"
        ? "Ganancias"
        : menuSection === "notificaciones"
          ? "Notificaciones"
          : menuSection === "configuracion"
            ? "Datos de cobro"
            : menuSection === "ayuda"
              ? "Ayuda"
              : menuSection === "ofertas"
                ? "Solicitudes abiertas"
                : "Servicios";

  async function handleTopUp() {
    const amount = Number(topUpAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setTopUpError("Ingresa un monto de recarga válido.");
      setTopUpMessage(null);
      return;
    }
    setTopUpSubmitting(true);
    setTopUpError(null);
    setTopUpMessage(null);
    try {
      await topUpMine({
        amount,
        note: "Recarga desde app de chofer",
      });
      setTopUpAmount("");
      setTopUpMessage("Recarga aplicada correctamente.");
    } catch (error) {
      setTopUpError(
        error instanceof Error ? error.message : "No se pudo registrar la recarga.",
      );
    } finally {
      setTopUpSubmitting(false);
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
        paddingTop: insets.top + 8,
        backgroundColor: TACTICAL_COLORS.base,
      }}
    >
      <GridBackdrop />
      <View className="mb-4 flex-row items-center gap-3 px-4">
        <HamburgerButton onPress={() => setMenuOpen(true)} variant="tactical" />
        <View className="flex-1">
          <TacticalLabel size={9}>Panel de conductor</TacticalLabel>
          <TacticalTitle size={19}>{title}</TacticalTitle>
        </View>
      </View>

      <View className="flex-1 px-4">
        {menuSection === "ganancias" ? (
          <DriverEarningsView />
        ) : menuSection === "saldo" ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <TacticalPanel corners>
              <TacticalLabel tone="accent">Saldo de app</TacticalLabel>
              <TacticalValue size={30} className="mt-1">
                {`S/${(wallet?.balance ?? 0).toFixed(2)}`}
              </TacticalValue>
              <TacticalText size={11} className="mt-1">
                La app descuenta 25% por servicio finalizado. Límite mínimo:
                S/-10.
              </TacticalText>
              {(wallet?.balance ?? 0) <= -10 && (
                <View className="mt-2">
                  <TacticalStatus
                    label="Saldo al límite · recarga"
                    tone="danger"
                  />
                </View>
              )}

              <View className="mt-4">
                <TacticalLabel className="mb-2">Monto a recargar</TacticalLabel>
                <View className="mb-3 flex-row gap-2">
                  {[10, 20, 50].map((quickAmount) => (
                    <TouchableOpacity
                      key={quickAmount}
                      activeOpacity={0.8}
                      onPress={() => setTopUpAmount(String(quickAmount))}
                      className="px-3.5 py-2"
                      style={{
                        borderRadius: TACTICAL_RADIUS.sharp,
                        borderWidth: 1,
                        borderColor:
                          topUpAmount === String(quickAmount)
                            ? TACTICAL_COLORS.accent
                            : TACTICAL_BORDER,
                        backgroundColor:
                          topUpAmount === String(quickAmount)
                            ? "rgba(161, 196, 253, 0.14)"
                            : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: MONO.bold,
                          fontSize: 12,
                          letterSpacing: 1,
                          color:
                            topUpAmount === String(quickAmount)
                              ? TACTICAL_COLORS.accent
                              : TACTICAL_COLORS.steel,
                        }}
                      >
                        {`S/${quickAmount}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TacticalInput
                  mono
                  value={topUpAmount}
                  onChangeText={setTopUpAmount}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  containerClassName="mb-3"
                />
                <TacticalButton
                  label="Recargar"
                  onPress={() => void handleTopUp()}
                  disabled={topUpSubmitting}
                  loading={topUpSubmitting}
                />
                {topUpMessage !== null && (
                  <Text
                    className="mt-2 text-xs"
                    style={{
                      fontFamily: MONO.medium,
                      color: TACTICAL_COLORS.success,
                    }}
                  >
                    {topUpMessage}
                  </Text>
                )}
                {topUpError !== null && (
                  <Text
                    className="mt-2 text-xs"
                    style={{
                      fontFamily: MONO.medium,
                      color: TACTICAL_COLORS.danger,
                    }}
                  >
                    {topUpError}
                  </Text>
                )}
              </View>

              {(walletTransactions ?? []).length > 0 && (
                <View className="mt-5">
                  <TacticalLabel className="mb-2" size={10}>
                    Movimientos recientes
                  </TacticalLabel>
                  {(walletTransactions ?? []).map((tx) => (
                    <View
                      key={tx._id}
                      className="flex-row items-center justify-between py-1.5"
                    >
                      <TacticalText size={11}>
                        {tx.type === "top_up" ? "Recarga" : "Comisión"}
                      </TacticalText>
                      <TacticalValue
                        size={12}
                        tone={tx.type === "commission_debit" ? "steel" : "accent"}
                      >
                        {`${tx.type === "commission_debit" ? "-" : "+"} S/${tx.amount.toFixed(2)}`}
                      </TacticalValue>
                    </View>
                  ))}
                </View>
              )}
            </TacticalPanel>
          </ScrollView>
        ) : menuSection === "configuracion" ? (
          <DriverPayoutConfig driver={driver} fallbackName={userName} />
        ) : menuSection === "notificaciones" ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <TacticalPanel corners>
              <View className="mb-3 flex-row items-center justify-between">
                <TacticalStatus
                  label={`${unreadNotifications} sin leer`}
                  tone={unreadNotifications > 0 ? "active" : "idle"}
                />
                <TouchableOpacity onPress={() => void markAllNotificationsAsRead()}>
                  <TacticalLabel size={9} tone="accent">
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
                    className="mb-2 p-3"
                    style={{
                      borderLeftWidth: 2,
                      borderLeftColor:
                        notification.readAt === undefined
                          ? TACTICAL_COLORS.accent
                          : TACTICAL_COLORS.steel,
                    }}
                  >
                    <TacticalLabel size={9} tone="text">
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
            <AvailabilityToggle status={driver.status} />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMenuSection("saldo")}
              className="mb-3 flex-row items-center justify-between px-4 py-3"
              style={{
                backgroundColor: TACTICAL_COLORS.baseElevated,
                borderRadius: TACTICAL_RADIUS.sharp,
                borderWidth: 1,
                borderColor: TACTICAL_BORDER,
              }}
            >
              <TacticalLabel size={10}>Saldo disponible</TacticalLabel>
              <TacticalValue size={15} tone="accent">
                {`S/${(wallet?.balance ?? 0).toFixed(2)} ›`}
              </TacticalValue>
            </TouchableOpacity>

            {(menuSection === "ofertas" || menuSection === "servicios") && (
              <View className="mb-4 overflow-hidden">
                <TacticalPanel corners>
                  <TacticalLabel tone="accent" className="mb-2">
                    Solicitudes para ofertar
                  </TacticalLabel>
                {(openServices ?? []).length === 0 ? (
                  <TacticalEmpty title="Sin solicitudes abiertas" />
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
                        const defaultOffer = String(floorPrice);
                        const alreadyOffered = myOfferByService[service._id];
                        const canAfford = canCoverOfferCommission(
                          walletBalance,
                          minPrice,
                        );
                        return (
                          <TacticalPanel
                            key={service._id}
                            tone="sunken"
                            className="mb-2 p-3"
                          >
                            <View className="flex-row items-center justify-between">
                              <TacticalLabel size={9}>Tarifa lista</TacticalLabel>
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
                                    if (
                                      !Number.isFinite(parsed) ||
                                      parsed < floorPrice
                                    ) {
                                      setOfferByService((prev) => ({
                                        ...prev,
                                        [service._id]: defaultOffer,
                                      }));
                                    }
                                  }}
                                  editable={canAfford && isAvailable}
                                  placeholder={`Oferta >= S/${floorPrice.toFixed(0)}`}
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
                                    setOfferingServiceId(service._id);
                                    setOfferError(null);
                                    void submitMyOffer({
                                      serviceId: service._id,
                                      offeredPrice,
                                    })
                                      .then((result) => {
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
                        {lacksBalance && isAvailable && (
                          <View className="mt-3">
                            <TacticalButton
                              label="Recargar saldo"
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

            {menuSection === "servicios" && (
              <FlatList
                data={activeServices}
                keyExtractor={(item) => item._id}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="none"
                removeClippedSubviews={false}
                renderItem={({ item }) => (
                  <ServiceCard
                    service={item}
                    onOpenChecklist={setChecklistServiceId}
                    onOpenLiveMap={setLiveMapServiceId}
                  />
                )}
                ListEmptyComponent={
                  <TacticalEmpty
                    title="Sin servicios activos"
                    subtitle="Cuando acepten una oferta, el viaje aparece aquí."
                  />
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
