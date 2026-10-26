import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc } from "@proyecto/backend/dataModel";
import { UberScreenHeader } from "../uber/UberScreenHeader";
import {
  TacticalButton,
  TacticalEmpty,
  TacticalInput,
  TacticalLabel,
  TacticalPanel,
  TacticalText,
  TacticalValue,
} from "../tactical";
import { useAppTheme } from "../../contexts/ThemeContext";
import { getDriverGpsForOffer } from "../../hooks/useDriverOfferLocation";
import { hasTripCreditForOffer } from "../../lib/offerWallet";
import {
  convexErrorMessage,
  isInsufficientBalanceError,
} from "../../lib/convexErrorMessage";
import { formatServiceStopsLabel } from "../../lib/wazeNavigation";
import {
  MONO,
  POPPINS,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../../constants/theme";

const MIN_OFFER_PRICE = 80;

type DriverRequestsTabProps = {
  isAvailable: boolean;
  openServices: Doc<"services">[];
  /** `undefined` mientras carga la consulta. */
  loaded: boolean;
  radiusKm: number;
  locationLoading: boolean;
  locationError: string | null;
  onRefreshLocation: () => void;
  myOfferByService: Record<string, number>;
  tripCredits: number;
  onGoToTopUp: () => void;
  onGoToService: () => void;
  onOpenRadius: () => void;
};

/** Pestaña Lista: solicitudes abiertas dentro del radio para ofertar. */
export function DriverRequestsTab({
  isAvailable,
  openServices,
  loaded,
  radiusKm,
  locationLoading,
  locationError,
  onRefreshLocation,
  myOfferByService,
  tripCredits,
  onGoToTopUp,
  onGoToService,
  onOpenRadius,
}: DriverRequestsTabProps) {
  const { colors } = useAppTheme();
  const submitMyOffer = useMutation(api.serviceOffers.submitMyOffer);
  const [offerByService, setOfferByService] = useState<Record<string, string>>({});
  const [offeringServiceId, setOfferingServiceId] = useState<string | null>(null);
  const [offerError, setOfferError] = useState<string | null>(null);

  const canAfford = hasTripCreditForOffer(tripCredits);
  const offersLocked = !isAvailable || (openServices.length > 0 && !canAfford);

  function submitOffer(
    service: Doc<"services">,
    floorPrice: number,
    maxOfferPrice: number,
    defaultOffer: string,
  ) {
    if (!isAvailable || !canAfford) {
      return;
    }
    const offeredPrice = Number(offerByService[service._id] ?? defaultOffer);
    if (!Number.isFinite(offeredPrice) || offeredPrice < floorPrice) {
      setOfferByService((prev) => ({ ...prev, [service._id]: defaultOffer }));
      setOfferError(`La oferta mínima es S/${floorPrice.toFixed(0)}.`);
      return;
    }
    if (offeredPrice > maxOfferPrice) {
      setOfferError(`La oferta no puede superar S/${maxOfferPrice.toFixed(2)}.`);
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
        return undefined;
      }
    })()
      .then((result) => {
        if (result === undefined || result.ok) {
          return;
        }
        setOfferError(result.message);
        if (isInsufficientBalanceError(result.message)) {
          Alert.alert("Saldo insuficiente", result.message, [
            { text: "Recargar", onPress: onGoToTopUp },
            { text: "OK" },
          ]);
          return;
        }
        Alert.alert("No se pudo ofertar", result.message);
      })
      .catch((error) => {
        const message = convexErrorMessage(error, "No se pudo enviar la oferta.");
        setOfferError(message);
        Alert.alert("No se pudo ofertar", message);
      })
      .finally(() => setOfferingServiceId(null));
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <UberScreenHeader
        title="Lista"
        subtitle="Solicitudes para ofertar"
        trailing={
          <TouchableOpacity
            onPress={onOpenRadius}
            accessibilityLabel={`Radio de búsqueda ${radiusKm} km. Cambiar`}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: colors.surfaceSunken,
            }}
          >
            <Text style={{ fontFamily: POPPINS.semibold, fontSize: 14, color: colors.textStrong }}>
              {`${radiusKm} km`}
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {!isAvailable ? (
          <View className="gap-3">
            <TacticalEmpty
              title="Estás desconectado"
              subtitle={`Conéctate en Servicio para ver solicitudes dentro de ${radiusKm} km.`}
            />
            <TacticalButton
              label="Ir a Servicio"
              variant="secondary"
              size="md"
              onPress={onGoToService}
            />
          </View>
        ) : (
          <>
            {locationLoading && !loaded ? (
              <ActivityIndicator color={TACTICAL_COLORS.accent} className="my-6" />
            ) : null}
            {locationError !== null ? (
              <View className="mb-3 gap-2">
                <TacticalText size={14} style={{ color: TACTICAL_COLORS.danger }}>
                  {locationError}
                </TacticalText>
                <TacticalButton
                  label="Actualizar ubicación"
                  variant="secondary"
                  size="md"
                  onPress={onRefreshLocation}
                />
              </View>
            ) : null}

            {!canAfford && openServices.length > 0 && (
              <TacticalPanel tone="sunken" className="mb-3 gap-2 p-4">
                <TacticalText size={14} tone="text">
                  No tienes viajes prepagados. Recarga para poder ofertar.
                </TacticalText>
                <TacticalButton
                  label="Recargar viajes"
                  variant="secondary"
                  size="md"
                  onPress={onGoToTopUp}
                />
              </TacticalPanel>
            )}

            {loaded && openServices.length === 0 ? (
              <TacticalEmpty
                title="Sin solicitudes cercanas"
                subtitle={`No hay pedidos dentro de ${radiusKm} km. Amplía tu radio o espera unos minutos.`}
              />
            ) : (
              <View
                pointerEvents={offersLocked ? "none" : "auto"}
                style={offersLocked ? { opacity: 0.4 } : undefined}
              >
                {openServices.map((service) => {
                  const minPrice = service.catalogBasePrice ?? service.basePrice;
                  const floorPrice = Math.max(MIN_OFFER_PRICE, minPrice);
                  const maxOfferPrice = Math.round(floorPrice * 1.5 * 100) / 100;
                  const defaultOffer = String(floorPrice);
                  const alreadyOffered = myOfferByService[service._id];
                  return (
                    <TacticalPanel key={service._id} className="mb-3 p-4">
                      <View className="flex-row items-center justify-between">
                        <TacticalLabel>Tarifa lista</TacticalLabel>
                        <TacticalValue size={18} tone="accent">
                          {`S/${minPrice.toFixed(2)}`}
                        </TacticalValue>
                      </View>
                      {service.discountRate !== undefined && service.discountRate > 0 && (
                        <TacticalText size={13} className="mt-0.5">
                          {`Cliente paga S/${service.basePrice.toFixed(2)}`}
                        </TacticalText>
                      )}
                      <TacticalText size={15} tone="text" className="mt-2">
                        {service.origin.address} →{" "}
                        {formatServiceStopsLabel(
                          service.destination,
                          service.extraDestinations,
                        )}
                      </TacticalText>
                      <TacticalText size={13} className="mt-1">
                        {`Oferta entre S/${floorPrice.toFixed(2)} y S/${maxOfferPrice.toFixed(2)}.`}
                      </TacticalText>
                      {alreadyOffered !== undefined ? (
                        <View
                          className="mt-3 px-3 py-2"
                          style={{
                            borderRadius: TACTICAL_RADIUS.sharp,
                            backgroundColor: TACTICAL_COLORS.dataBandBg,
                          }}
                        >
                          <TacticalValue size={15} tone="accent">
                            {`Ofertaste S/${alreadyOffered.toFixed(2)}`}
                          </TacticalValue>
                          <TacticalText size={13} className="mt-0.5">
                            Esperando respuesta del cliente
                          </TacticalText>
                        </View>
                      ) : (
                        <View className="mt-3 flex-row items-center gap-2">
                          <TacticalInput
                            mono
                            value={offerByService[service._id] ?? defaultOffer}
                            onChangeText={(value) =>
                              setOfferByService((prev) => ({
                                ...prev,
                                [service._id]: value,
                              }))
                            }
                            onBlur={() => {
                              const parsed = Number(
                                offerByService[service._id] ?? defaultOffer,
                              );
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
                          <TacticalButton
                            label="Ofertar"
                            size="md"
                            onPress={() =>
                              submitOffer(service, floorPrice, maxOfferPrice, defaultOffer)
                            }
                            disabled={
                              offeringServiceId === service._id || !canAfford || !isAvailable
                            }
                            loading={offeringServiceId === service._id}
                          />
                        </View>
                      )}
                    </TacticalPanel>
                  );
                })}
              </View>
            )}

            {offerError !== null && (
              <Text
                className="mt-2"
                style={{ fontFamily: MONO.medium, fontSize: 14, color: TACTICAL_COLORS.danger }}
              >
                {offerError}
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
