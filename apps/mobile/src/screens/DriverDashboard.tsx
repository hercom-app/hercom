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
import { HelpFab } from "../components/HelpFab";
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
  UiButton,
  UiCard,
  UiChip,
  UiEmpty,
  UiInput,
} from "../components/ui";

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
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color="#64748B" />
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
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top + 8 }}>
      <View className="mb-4 flex-row items-center gap-3 px-4">
        <HamburgerButton onPress={() => setMenuOpen(true)} />
        <View className="flex-1">
          <Text className="text-xl font-bold text-slate-900">{title}</Text>
        </View>
        <HelpFab />
      </View>

      <View className="flex-1 px-4">
        {menuSection === "ganancias" ? (
          <DriverEarningsView />
        ) : menuSection === "saldo" ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <UiCard>
              <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Saldo de app
              </Text>
              <Text className="mt-1 text-2xl font-bold text-slate-900">
                S/{(wallet?.balance ?? 0).toFixed(2)}
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                La app descuenta 25% por servicio finalizado. Límite mínimo: S/-10.
              </Text>
              {(wallet?.balance ?? 0) <= -10 && (
                <Text className="mt-1 text-xs font-semibold text-red-600">
                  Saldo al límite. Recarga para seguir ofertando.
                </Text>
              )}

              <View className="mt-4">
                <Text className="mb-2 text-xs font-semibold text-slate-500">
                  Monto a recargar
                </Text>
                <View className="mb-3 flex-row gap-2">
                  {[10, 20, 50].map((quickAmount) => (
                    <UiChip
                      key={quickAmount}
                      label={`S/${quickAmount}`}
                      selected={topUpAmount === String(quickAmount)}
                      onPress={() => setTopUpAmount(String(quickAmount))}
                    />
                  ))}
                </View>
                <UiInput
                  value={topUpAmount}
                  onChangeText={setTopUpAmount}
                  placeholder="Monto en S/"
                  keyboardType="decimal-pad"
                  className="mb-3"
                />
                <UiButton
                  label="Recargar"
                  onPress={() => void handleTopUp()}
                  disabled={topUpSubmitting}
                  loading={topUpSubmitting}
                />
                {topUpMessage !== null && (
                  <Text className="mt-2 text-xs font-medium text-success">
                    {topUpMessage}
                  </Text>
                )}
                {topUpError !== null && (
                  <Text className="mt-2 text-xs font-medium text-red-600">
                    {topUpError}
                  </Text>
                )}
              </View>

              {(walletTransactions ?? []).length > 0 && (
                <View className="mt-5">
                  <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Movimientos recientes
                  </Text>
                  {(walletTransactions ?? []).map((tx) => (
                    <View key={tx._id} className="flex-row justify-between py-1.5">
                      <Text className="text-xs text-slate-600">
                        {tx.type === "top_up" ? "Recarga" : "Comisión"}
                      </Text>
                      <Text className="text-xs font-semibold text-slate-800">
                        {tx.type === "commission_debit" ? "- " : "+ "}S/
                        {tx.amount.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </UiCard>
          </ScrollView>
        ) : menuSection === "configuracion" ? (
          <DriverPayoutConfig driver={driver} fallbackName={userName} />
        ) : menuSection === "notificaciones" ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <UiCard>
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-sm font-bold text-slate-900">
                  {unreadNotifications} sin leer
                </Text>
                <TouchableOpacity onPress={() => void markAllNotificationsAsRead()}>
                  <Text className="text-xs font-semibold text-slate-500">
                    Marcar todo leído
                  </Text>
                </TouchableOpacity>
              </View>
              {(notifications ?? []).length === 0 ? (
                <UiEmpty title="Aún no tienes notificaciones." />
              ) : (
                (notifications ?? []).map((notification) => (
                  <View
                    key={notification._id}
                    className="mb-2 rounded-2xl bg-slate-50 p-3"
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
            </UiCard>
          </ScrollView>
        ) : (
          <>
            <AvailabilityToggle status={driver.status} />

            <View className="mb-3 flex-row items-center justify-between rounded-3xl bg-white px-4 py-3">
              <Text className="text-sm text-slate-500">Saldo</Text>
              <TouchableOpacity onPress={() => setMenuSection("saldo")}>
                <Text className="text-base font-bold text-slate-900">
                  S/{(wallet?.balance ?? 0).toFixed(2)} ›
                </Text>
              </TouchableOpacity>
            </View>

            {(menuSection === "ofertas" || menuSection === "servicios") && (
              <View className="mb-4 overflow-hidden">
                <UiCard>
                  <Text className="mb-2 text-sm font-bold text-slate-900">
                    Solicitudes para ofertar
                  </Text>
                {(openServices ?? []).length === 0 ? (
                  <UiEmpty title="No hay solicitudes pendientes para ofertar." />
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
                          <View
                            key={service._id}
                            className="mb-2 rounded-2xl bg-slate-50 p-3"
                          >
                            <Text className="text-xs text-slate-600">
                              Tarifa lista: S/{minPrice.toFixed(2)}
                              {service.discountRate !== undefined &&
                              service.discountRate > 0
                                ? ` · Cliente paga S/${service.basePrice.toFixed(2)}`
                                : ""}
                            </Text>
                            <Text className="mt-1 text-xs text-slate-700">
                              {service.origin.address} →{" "}
                              {formatServiceStopsLabel(
                                service.destination,
                                service.extraDestinations,
                              )}
                            </Text>
                            {alreadyOffered !== undefined ? (
                              <View className="mt-2 rounded-2xl border border-hercom/30 bg-hercom-soft px-3 py-2">
                                <Text className="text-xs font-semibold text-hercom">
                                  Ya ofertaste S/{alreadyOffered.toFixed(2)}
                                </Text>
                                <Text className="mt-0.5 text-[11px] text-slate-500">
                                  Esperando respuesta del cliente
                                </Text>
                              </View>
                            ) : (
                              <View className="mt-2 flex-row items-center gap-2">
                                <UiInput
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
                                  className="flex-1 py-2.5"
                                />
                                <View>
                                  <UiButton
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
                          </View>
                        );
                      })}
                    </View>
                    {offersLocked && (
                      <View className="absolute inset-0 items-center justify-center rounded-xl bg-slate-900/55 px-4">
                        <Text className="text-center text-sm font-semibold text-white">
                          {offersLockReason}
                        </Text>
                        {lacksBalance && isAvailable && (
                          <View className="mt-3">
                            <UiButton
                              label="Ir a recargar saldo"
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
                  <Text className="mt-2 text-xs font-medium text-red-600">
                    {offerError}
                  </Text>
                )}
                </UiCard>
              </View>
            )}

            {menuSection === "servicios" && (
              <FlatList
                data={activeServices}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <ServiceCard
                    service={item}
                    onOpenChecklist={setChecklistServiceId}
                    onOpenLiveMap={setLiveMapServiceId}
                  />
                )}
                ListEmptyComponent={
                  <UiEmpty
                    title="No tienes servicios activos por ahora."
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
