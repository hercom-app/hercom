import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@proyecto/backend";
import type { Doc } from "@proyecto/backend/dataModel";

const MIN_SERVICE_PRICE = 40;

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
        <Text className="text-xs font-semibold uppercase text-hercom">
          {STATUS_LABELS[service.status]}
        </Text>
        <Text className="text-sm font-bold text-slate-900">
          S/{service.totalPrice.toFixed(2)}
        </Text>
      </View>
      <Text className="mb-1 text-xs text-slate-500">
        Base: S/{service.basePrice.toFixed(2)} · Propina: S/{service.tipAmount.toFixed(2)}
      </Text>
      <Text className="text-sm text-slate-700">
        {service.origin.address} → {service.destination.address}
      </Text>
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

/** Panel cliente: solicitar chofer y ver mis servicios (app móvil). */
export function ClientDashboard() {
  const { signOut } = useAuthActions();
  const services = useQuery(api.services.listForClient, {});
  const createService = useMutation(api.services.createService);
  const markAllNotificationsAsRead = useMutation(api.notifications.markAllAsRead);
  const notifications = useQuery(api.notifications.listMine, { limit: 8 });

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [tipAmount, setTipAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unreadNotifications = (notifications ?? []).filter(
    (notification) => notification.readAt === undefined,
  ).length;

  async function handleSubmit() {
    const requestedBasePrice = Number(basePrice);
    const tip = Number(tipAmount || "0");
    if (
      origin.trim() === "" ||
      destination.trim() === "" ||
      !Number.isFinite(requestedBasePrice) ||
      requestedBasePrice < MIN_SERVICE_PRICE ||
      !Number.isFinite(tip) ||
      tip < 0
    ) {
      setError(
        `Completa origen, destino, base mínima S/${MIN_SERVICE_PRICE} y propina válida.`,
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await createService({
        origin: { address: origin.trim(), lat: 0, lng: 0 },
        destination: { address: destination.trim(), lat: 0, lng: 0 },
        basePrice: requestedBasePrice,
        tipAmount: tip,
        ...(notes.trim() !== "" ? { notes: notes.trim() } : {}),
      });
      setOrigin("");
      setDestination("");
      setBasePrice("");
      setTipAmount("");
      setNotes("");
      setMessage("Solicitud enviada. Espera ofertas y elige un chofer.");
    } catch {
      setError("No se pudo crear la solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-100"
      contentContainerClassName="px-4 pb-8 pt-4"
      keyboardShouldPersistTaps="handled"
    >
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-slate-900">Hercom</Text>
          <Text className="text-sm text-slate-500">
            Cliente · solicita un chofer
          </Text>
        </View>
        <TouchableOpacity onPress={() => void signOut()}>
          <Text className="text-sm font-semibold text-slate-500">Salir</Text>
        </TouchableOpacity>
      </View>

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

      <View className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
        <Text className="mb-1 text-lg font-bold text-slate-900">
          Solicitar un chofer
        </Text>
        <Text className="mb-4 text-sm text-slate-500">
          Indica origen, destino, tarifa base y propina opcional.
        </Text>

        <View className="gap-3">
          <TextInput
            value={origin}
            onChangeText={setOrigin}
            placeholder="Dirección de origen"
            placeholderTextColor="#94A3B8"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
          />
          <TextInput
            value={destination}
            onChangeText={setDestination}
            placeholder="Dirección de destino"
            placeholderTextColor="#94A3B8"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
          />
          <TextInput
            value={basePrice}
            onChangeText={setBasePrice}
            placeholder="Tarifa base solicitada (mínimo S/40)"
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
          />
          <TextInput
            value={tipAmount}
            onChangeText={setTipAmount}
            placeholder="Propina (opcional)"
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
          />
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
              <Text className="text-base font-bold uppercase tracking-wide text-white">
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
      </View>

      <Text className="mb-3 text-lg font-bold text-slate-900">Mis servicios</Text>

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
  );
}
