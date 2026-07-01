import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@proyecto/backend";
import { AvailabilityToggle } from "../components/AvailabilityToggle";
import { ServiceCard } from "../components/ServiceCard";
import { formatServiceStopsLabel } from "../lib/wazeNavigation";

export function DriverDashboard() {
  const { signOut } = useAuthActions();
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
    driver === undefined || driver === null ? "skip" : { limit: 5 },
  );
  const services = useQuery(
    api.services.listForDriver,
    driver === undefined || driver === null ? "skip" : {},
  );
  const openServices = useQuery(
    api.services.listOpenForOffers,
    driver === undefined || driver === null ? "skip" : {},
  );
  const notifications = useQuery(
    api.notifications.listMine,
    driver === undefined || driver === null ? "skip" : { limit: 8 },
  );
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
        note: "Recarga demo desde app de chofer",
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
    <View className="flex-1 bg-slate-100 px-4 pt-4">
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-slate-900">Mis viajes</Text>
          <Text className="text-sm text-slate-500">Chofer · atiende servicios</Text>
        </View>
        <TouchableOpacity onPress={() => void signOut()}>
          <Text className="text-sm font-semibold text-slate-500">Salir</Text>
        </TouchableOpacity>
      </View>

      <AvailabilityToggle status={driver.status} />

      <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm font-bold text-slate-900">
            Notificaciones ({unreadNotifications} sin leer)
          </Text>
          <TouchableOpacity onPress={() => void markAllNotificationsAsRead()}>
            <Text className="text-xs font-semibold text-slate-500">
              Marcar todo leído
            </Text>
          </TouchableOpacity>
        </View>
        {(notifications ?? []).length === 0 ? (
          <Text className="text-xs text-slate-500">Aún no tienes notificaciones.</Text>
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

      <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <Text className="text-xs font-semibold uppercase text-slate-500">
          Saldo de app
        </Text>
        <Text className="mt-1 text-2xl font-bold text-slate-900">
          S/{(wallet?.balance ?? 0).toFixed(2)}
        </Text>
        <Text className="mt-1 text-xs text-slate-500">
          La app descuenta 25% por servicio finalizado. Límite mínimo de saldo: S/-10.
        </Text>
        {(wallet?.balance ?? 0) <= -10 && (
          <Text className="mt-1 text-xs font-semibold text-red-600">
            Saldo al límite. Debes recargar para seguir ofertando servicios.
          </Text>
        )}
        <View className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <Text className="mb-2 text-xs font-semibold text-slate-600">
            Recargar saldo (demo)
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
                <Text className="text-xs font-bold uppercase text-white">Recargar</Text>
              )}
            </TouchableOpacity>
          </View>
          {topUpMessage !== null && (
            <Text className="mt-2 text-xs font-medium text-green-700">{topUpMessage}</Text>
          )}
          {topUpError !== null && (
            <Text className="mt-2 text-xs font-medium text-red-600">{topUpError}</Text>
          )}
        </View>
        {(walletTransactions ?? []).length > 0 && (
          <View className="mt-3">
            <Text className="mb-1 text-xs font-semibold text-slate-500">
              Movimientos recientes
            </Text>
            {(walletTransactions ?? []).map((tx) => (
              <View key={tx._id} className="flex-row justify-between py-0.5">
                <Text className="text-xs text-slate-600">
                  {tx.type === "top_up"
                    ? "Recarga"
                    : "Comisión app"}
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

      <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <Text className="mb-2 text-sm font-bold text-slate-900">
          Solicitudes para ofertar
        </Text>
        {(openServices ?? []).length === 0 ? (
          <Text className="text-xs text-slate-500">
            No hay solicitudes pendientes para ofertar.
          </Text>
        ) : (
          (openServices ?? []).map((service) => (
            <View
              key={service._id}
              className="mb-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <Text className="text-xs text-slate-600">
                Tarifa lista: S/
                {(service.catalogBasePrice ?? service.basePrice).toFixed(2)}
                {service.discountRate !== undefined && service.discountRate > 0
                  ? ` · Cliente paga S/${service.basePrice.toFixed(2)}`
                  : ""}
              </Text>
              <Text className="mt-1 text-xs text-slate-700">
                {service.origin.address} →{" "}
                {formatServiceStopsLabel(service.destination, service.extraDestinations)}
              </Text>
              <View className="mt-2 flex-row items-center gap-2">
                <TextInput
                  value={offerByService[service._id] ?? ""}
                  onChangeText={(value) =>
                    setOfferByService((prev) => ({ ...prev, [service._id]: value }))
                  }
                  placeholder={`Oferta >= S/${(service.catalogBasePrice ?? service.basePrice).toFixed(0)}`}
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                />
                <TouchableOpacity
                  onPress={() => {
                    const offeredPrice = Number(offerByService[service._id] ?? "0");
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
                  disabled={offeringServiceId === service._id}
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
            </View>
          ))
        )}
        {offerError !== null && (
          <Text className="mt-2 text-xs font-medium text-red-600">{offerError}</Text>
        )}
      </View>

      <FlatList
        data={activeServices}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ServiceCard service={item} />}
        ListEmptyComponent={
          <Text className="mt-8 text-center text-sm text-slate-500">
            No tienes viajes activos por ahora.
          </Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
