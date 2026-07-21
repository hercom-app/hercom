import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { AvailabilityToggle } from "../components/AvailabilityToggle";
import { DriverPayoutConfig } from "../components/DriverPayoutConfig";
import { HamburgerButton } from "../components/HamburgerButton";
import { HelpFab } from "../components/HelpFab";
import { ServiceCard } from "../components/ServiceCard";
import { SideDrawer } from "../components/SideDrawer";
import { useAppMode } from "../contexts/AppModeContext";
import { canCoverOfferCommission } from "../lib/offerWallet";
import { formatServiceStopsLabel } from "../lib/wazeNavigation";

export function DriverDashboard() {
  const insets = useSafeAreaInsets();
  const { userName } = useAppMode();
  const topUpMine = useMutation(api.driverWallets.topUpMine);
  const submitMyOffer = useMutation(api.serviceOffers.submitMyOffer);
  const markAllNotificationsAsRead = useMutation(api.notifications.markAllAsRead);
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

  if (driver === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <ActivityIndicator color="#007AFF" />
      </View>
    );
  }

  if (driver === null) {
    return null;
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
      : menuSection === "notificaciones"
        ? "Notificaciones"
        : menuSection === "configuracion"
          ? "Datos de cobro"
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

  return (
    <View className="flex-1 bg-slate-100" style={{ paddingTop: insets.top + 8 }}>
      <View className="mb-4 flex-row items-center gap-3 px-4">
        <HamburgerButton onPress={() => setMenuOpen(true)} />
        <View className="flex-1">
          <Text className="text-xl font-bold text-slate-900">{title}</Text>
        </View>
        <HelpFab />
      </View>

      <View className="flex-1 px-4">
        {menuSection === "saldo" ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
              <Text className="text-xs font-semibold uppercase text-slate-500">
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

              <View className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <Text className="mb-2 text-xs font-semibold text-slate-600">
                  Monto a recargar
                </Text>
                <View className="mb-2 flex-row gap-2">
                  {[10, 20, 50].map((quickAmount) => (
                    <TouchableOpacity
                      key={quickAmount}
                      onPress={() => setTopUpAmount(String(quickAmount))}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1"
                    >
                      <Text className="text-xs font-semibold text-slate-700">
                        S/{quickAmount}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View className="flex-row items-center gap-2">
                  <TextInput
                    value={topUpAmount}
                    onChangeText={setTopUpAmount}
                    placeholder="Monto en S/"
                    placeholderTextColor="#94A3B8"
                    keyboardType="decimal-pad"
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                  <TouchableOpacity
                    onPress={() => void handleTopUp()}
                    disabled={topUpSubmitting}
                    className="rounded-xl bg-hercom px-3 py-2 active:opacity-90 disabled:opacity-60"
                  >
                    {topUpSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="text-xs font-bold uppercase text-white">
                        Recargar
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
                {topUpMessage !== null && (
                  <Text className="mt-2 text-xs font-medium text-green-700">
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
                <View className="mt-4">
                  <Text className="mb-1 text-xs font-semibold text-slate-500">
                    Movimientos recientes
                  </Text>
                  {(walletTransactions ?? []).map((tx) => (
                    <View key={tx._id} className="flex-row justify-between py-0.5">
                      <Text className="text-xs text-slate-600">
                        {tx.type === "top_up" ? "Recarga" : "Comisión app"}
                      </Text>
                      <Text className="text-xs font-semibold text-slate-700">
                        {tx.type === "commission_debit" ? "- " : "+ "}S/
                        {tx.amount.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        ) : menuSection === "configuracion" ? (
          <DriverPayoutConfig driver={driver} fallbackName={userName} />
        ) : menuSection === "notificaciones" ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
              <View className="mb-2 flex-row items-center justify-between">
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
                <Text className="text-xs text-slate-500">
                  Aún no tienes notificaciones.
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
          </ScrollView>
        ) : (
          <>
            <AvailabilityToggle status={driver.status} />

            <View className="mb-3 flex-row items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
              <Text className="text-sm text-slate-600">Saldo</Text>
              <TouchableOpacity onPress={() => setMenuSection("saldo")}>
                <Text className="text-base font-bold text-slate-900">
                  S/{(wallet?.balance ?? 0).toFixed(2)} ›
                </Text>
              </TouchableOpacity>
            </View>

            {(menuSection === "ofertas" || menuSection === "servicios") && (
              <View className="mb-4 overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
                <Text className="mb-2 text-sm font-bold text-slate-900">
                  Solicitudes para ofertar
                </Text>
                {(openServices ?? []).length === 0 ? (
                  <Text className="text-xs text-slate-500">
                    No hay solicitudes pendientes para ofertar.
                  </Text>
                ) : (
                  <View className="relative">
                    <View
                      pointerEvents={offersLocked ? "none" : "auto"}
                      style={offersLocked ? { opacity: 0.4 } : undefined}
                    >
                      {(openServices ?? []).map((service) => {
                        const minPrice =
                          service.catalogBasePrice ?? service.basePrice;
                        const alreadyOffered = myOfferByService[service._id];
                        const canAfford = canCoverOfferCommission(
                          walletBalance,
                          minPrice,
                        );
                        return (
                          <View
                            key={service._id}
                            className="mb-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
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
                              <View className="mt-2 rounded-xl border border-hercom/30 bg-white px-3 py-2">
                                <Text className="text-xs font-semibold text-hercom">
                                  Ya ofertaste S/{alreadyOffered.toFixed(2)}
                                </Text>
                                <Text className="mt-0.5 text-[11px] text-slate-500">
                                  Esperando respuesta del cliente
                                </Text>
                              </View>
                            ) : (
                              <View className="mt-2 flex-row items-center gap-2">
                                <TextInput
                                  value={offerByService[service._id] ?? ""}
                                  onChangeText={(value) =>
                                    setOfferByService((prev) => ({
                                      ...prev,
                                      [service._id]: value,
                                    }))
                                  }
                                  editable={canAfford && isAvailable}
                                  placeholder={`Oferta >= S/${minPrice.toFixed(0)}`}
                                  placeholderTextColor="#94A3B8"
                                  keyboardType="decimal-pad"
                                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                                />
                                <TouchableOpacity
                                  onPress={() => {
                                    if (!isAvailable || !canAfford) {
                                      return;
                                    }
                                    const offeredPrice = Number(
                                      offerByService[service._id] ?? "0",
                                    );
                                    setOfferingServiceId(service._id);
                                    setOfferError(null);
                                    void submitMyOffer({
                                      serviceId: service._id,
                                      offeredPrice,
                                    })
                                      .catch((error) =>
                                        setOfferError(
                                          error instanceof Error
                                            ? error.message
                                            : "No se pudo enviar la oferta.",
                                        ),
                                      )
                                      .finally(() => setOfferingServiceId(null));
                                  }}
                                  disabled={
                                    offeringServiceId === service._id ||
                                    !canAfford ||
                                    !isAvailable
                                  }
                                  className="rounded-xl bg-hercom px-3 py-2 disabled:opacity-60"
                                >
                                  {offeringServiceId === service._id ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                  ) : (
                                    <Text className="text-xs font-bold uppercase text-white">
                                      Ofertar
                                    </Text>
                                  )}
                                </TouchableOpacity>
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
                          <TouchableOpacity
                            onPress={() => setMenuSection("saldo")}
                            className="mt-3 rounded-xl bg-white px-4 py-2"
                          >
                            <Text className="text-xs font-bold text-slate-900">
                              Ir a recargar saldo
                            </Text>
                          </TouchableOpacity>
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
              </View>
            )}

            {menuSection === "servicios" && (
              <FlatList
                data={activeServices}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <ServiceCard service={item} />}
                ListEmptyComponent={
                  <Text className="mt-8 text-center text-sm text-slate-500">
                    No tienes servicios activos por ahora.
                  </Text>
                }
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        )}
      </View>

      <SideDrawer
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        userName={userName}
        unreadCount={unreadNotifications}
        activeItem={menuSection}
        onSelectItem={(key) => {
          if (
            key === "servicios" ||
            key === "ofertas" ||
            key === "saldo" ||
            key === "notificaciones" ||
            key === "configuracion"
          ) {
            setMenuSection(key);
          }
        }}
      />
    </View>
  );
}
