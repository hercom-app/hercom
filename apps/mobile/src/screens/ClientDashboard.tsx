import { useEffect, useRef, useState } from "react";
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
import { RegionPicker } from "../components/RegionPicker";
import {
  applyPickupLocationResult,
  detectPickupLocation,
} from "../lib/pickupLocation";
import { formatServiceStopsLabel } from "../lib/wazeNavigation";

const HOURLY_SERVICE_RATE = 40;
const MIN_SERVICE_HOURS = 2;
const MIN_SERVICE_PRICE = HOURLY_SERVICE_RATE * MIN_SERVICE_HOURS;
const CLIENT_ADVANCE_RATE = 0.25;

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
    <View className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
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
          S/{service.totalPrice.toFixed(2)}
        </Text>
      </View>
      <Text className="mb-1 text-xs text-slate-500">
        Tarifa base: S/{service.basePrice.toFixed(2)}
        {service.catalogBasePrice !== undefined &&
        service.catalogBasePrice > service.basePrice ? (
          <Text className="text-violet-700">
            {" "}
            (lista S/{service.catalogBasePrice.toFixed(2)}
            {service.discountRate !== undefined
              ? ` · -${(service.discountRate * 100).toFixed(0)}%`
              : ""}
            )
          </Text>
        ) : null}
        {service.offeredPrice !== undefined
          ? ` · Acordada: S/${service.offeredPrice.toFixed(2)}`
          : ""}
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
            Entrégalo al chofer antes de que salga a recogerte.
          </Text>
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
  const [originLat, setOriginLat] = useState<number | null>(null);
  const [originLng, setOriginLng] = useState<number | null>(null);
  const [detectedRegionLabel, setDetectedRegionLabel] = useState("");
  const [destination, setDestination] = useState("");
  const [extraDestinations, setExtraDestinations] = useState<string[]>([]);
  const [basePrice, setBasePrice] = useState("");
  const [department, setDepartment] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoLocationAttempted = useRef(false);
  const unreadNotifications = (notifications ?? []).filter(
    (notification) => notification.readAt === undefined,
  ).length;
  const requestedBasePrice = Number(basePrice);
  const promoPreview = useQuery(
    api.promotions.previewForRegion,
    department !== "" &&
      Number.isFinite(requestedBasePrice) &&
      requestedBasePrice >= MIN_SERVICE_PRICE
      ? {
          department,
          ...(province !== "" ? { province } : {}),
          ...(district !== "" ? { district } : {}),
          listPrice: requestedBasePrice,
        }
      : "skip",
  );

  async function handleUseMyLocation() {
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
        setDetectedRegionLabel,
      });
    } catch (locationError) {
      setError(
        locationError instanceof Error
          ? locationError.message
          : "No se pudo obtener tu ubicación.",
      );
    } finally {
      setLocationLoading(false);
    }
  }

  useEffect(() => {
    if (autoLocationAttempted.current) {
      return;
    }
    autoLocationAttempted.current = true;
    void handleUseMyLocation();
  }, []);

  async function handleSubmit() {
    if (
      origin.trim() === "" ||
      destination.trim() === "" ||
      department === "" ||
      !Number.isFinite(requestedBasePrice) ||
      requestedBasePrice < MIN_SERVICE_PRICE
    ) {
      setError(
        `Completa región, origen, destino y tarifa base mínima S/${MIN_SERVICE_PRICE}.`,
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const cleanedExtraDestinations = extraDestinations
        .map((stop) => stop.trim())
        .filter((stop) => stop !== "")
        .map((address) => ({ address, lat: 0, lng: 0 }));

      await createService({
        origin: {
          address: origin.trim(),
          lat: originLat ?? 0,
          lng: originLng ?? 0,
          department,
          ...(province !== "" ? { province } : {}),
          ...(district !== "" ? { district } : {}),
        },
        destination: { address: destination.trim(), lat: 0, lng: 0 },
        ...(cleanedExtraDestinations.length > 0
          ? { extraDestinations: cleanedExtraDestinations }
          : {}),
        basePrice: requestedBasePrice,
        ...(notes.trim() !== "" ? { notes: notes.trim() } : {}),
      });
      setOrigin("");
      setOriginLat(null);
      setOriginLng(null);
      setDetectedRegionLabel("");
      setDestination("");
      setExtraDestinations([]);
      setBasePrice("");
      setDepartment("");
      setProvince("");
      setDistrict("");
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
          Indica origen, al menos un destino y tarifa base (S/{HOURLY_SERVICE_RATE}/h, mínimo{" "}
          {MIN_SERVICE_HOURS}h = S/{MIN_SERVICE_PRICE}). Puedes agregar paradas extra
          opcionales.
        </Text>

        <View className="gap-3">
          {locationLoading && (
            <View className="flex-row items-center gap-2 rounded-xl bg-sky-50 px-3 py-2">
              <ActivityIndicator color="#0369A1" size="small" />
              <Text className="text-xs text-sky-800">
                Detectando ubicación, departamento, provincia y distrito...
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => void handleUseMyLocation()}
            disabled={locationLoading || submitting}
            className="flex-row items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 py-3 disabled:opacity-60"
          >
            {locationLoading ? (
              <ActivityIndicator color="#0369A1" />
            ) : (
              <Text className="text-sm font-semibold text-sky-800">
                Volver a detectar mi ubicación
              </Text>
            )}
          </TouchableOpacity>
          <TextInput
            value={origin}
            onChangeText={setOrigin}
            placeholder="Dirección de origen"
            placeholderTextColor="#94A3B8"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
          />
          <RegionPicker
            department={department}
            province={province}
            district={district}
            onDepartmentChange={(value) => {
              setDepartment(value);
              setDetectedRegionLabel("");
            }}
            onProvinceChange={(value) => {
              setProvince(value);
              setDetectedRegionLabel("");
            }}
            onDistrictChange={(value) => {
              setDistrict(value);
              setDetectedRegionLabel("");
            }}
            detectedRegionLabel={detectedRegionLabel}
          />
          <TextInput
            value={destination}
            onChangeText={setDestination}
            placeholder="Destino principal"
            placeholderTextColor="#94A3B8"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
          />
          {extraDestinations.map((stop, index) => (
            <View key={`extra-destination-${index}`} className="flex-row items-center gap-2">
              <TextInput
                value={stop}
                onChangeText={(value) => {
                  setExtraDestinations((previous) =>
                    previous.map((item, itemIndex) =>
                      itemIndex === index ? value : item,
                    ),
                  );
                }}
                placeholder={`Destino adicional ${index + 2} (opcional)`}
                placeholderTextColor="#94A3B8"
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
              />
              <TouchableOpacity
                onPress={() => {
                  setExtraDestinations((previous) =>
                    previous.filter((_, itemIndex) => itemIndex !== index),
                  );
                }}
                className="rounded-xl border border-red-200 px-3 py-3"
              >
                <Text className="text-sm font-semibold text-red-600">✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setExtraDestinations((previous) => [...previous, ""])}
            disabled={submitting}
            className="rounded-2xl border border-dashed border-slate-300 py-2.5 disabled:opacity-60"
          >
            <Text className="text-center text-sm font-semibold text-slate-600">
              + Agregar otro destino (opcional)
            </Text>
          </TouchableOpacity>
          <TextInput
            value={basePrice}
            onChangeText={setBasePrice}
            placeholder={`Tarifa base (mín. S/${MIN_SERVICE_PRICE} = S/${HOURLY_SERVICE_RATE}/h × ${MIN_SERVICE_HOURS}h)`}
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
          />
          {promoPreview !== undefined && promoPreview !== null && (
            <View className="rounded-xl bg-violet-50 px-3 py-2">
              <Text className="text-xs font-semibold text-violet-800">
                Promo: {promoPreview.promotionName} (
                {(promoPreview.discountRate * 100).toFixed(0)}% off)
              </Text>
              <Text className="mt-1 text-xs text-violet-700">
                Pagas S/{promoPreview.basePrice.toFixed(2)} (lista S/
                {promoPreview.catalogBasePrice.toFixed(2)}). El chofer mantiene
                su tarifa de lista.
              </Text>
            </View>
          )}
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
