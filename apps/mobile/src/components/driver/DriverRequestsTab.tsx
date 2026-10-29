import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@proyecto/backend";
import { TacticalButton } from "../tactical";
import { DrawerIcon } from "../DrawerIcons";
import { DriverSheet } from "./DriverSheet";
import { useAppTheme } from "../../contexts/ThemeContext";
import { getDriverGpsForOffer } from "../../hooks/useDriverOfferLocation";
import { toPeopleAddress } from "../../lib/googleGeocoding";
import { hasTripCreditForOffer } from "../../lib/offerWallet";
import {
  convexErrorMessage,
  isInsufficientBalanceError,
} from "../../lib/convexErrorMessage";
import { HERCOM_COLORS, POPPINS, TABULAR, UBER_RADIUS } from "../../constants/theme";

export type OpenOfferService = FunctionReturnType<
  typeof api.services.listOpenForOffers
>["services"][number];

const MIN_OFFER_PRICE = 80;
const OFFER_STEP = 5;
const VISIBLE_CARDS = 5;
const CARD_GAP = 10;
const TITLE_BLOCK_HEIGHT = 72;
const TAB_BAR_HEIGHT = 64;

type DriverRequestsTabProps = {
  isAvailable: boolean;
  openServices: OpenOfferService[];
  /** `false` mientras carga la consulta. */
  loaded: boolean;
  locationLoading: boolean;
  locationError: string | null;
  onRefreshLocation: () => void;
  myOfferByService: Record<string, number>;
  tripCredits: number;
  onGoToTopUp: () => void;
  onGoToService: () => void;
};

function soles(amount: number): string {
  return Number.isInteger(amount) ? `S/ ${amount}` : `S/ ${amount.toFixed(2)}`;
}

function hoursLabel(hours: number): string {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
}

function offerBounds(service: OpenOfferService) {
  const floor = Math.max(MIN_OFFER_PRICE, service.offerCard.listPrice);
  const max = Math.round(floor * 1.5 * 100) / 100;
  return { floor, max };
}

/** Pestaña Lista: solicitudes abiertas dentro del radio (estilo lista minimalista). */
export function DriverRequestsTab({
  isAvailable,
  openServices,
  loaded,
  locationLoading,
  locationError,
  onRefreshLocation,
  myOfferByService,
  tripCredits,
  onGoToTopUp,
  onGoToService,
}: DriverRequestsTabProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const submitMyOffer = useMutation(api.serviceOffers.submitMyOffer);
  const [selected, setSelected] = useState<OpenOfferService | null>(null);
  const [offerPrice, setOfferPrice] = useState(MIN_OFFER_PRICE);
  const [submitting, setSubmitting] = useState(false);

  const canAfford = hasTripCreditForOffer(tripCredits);
  const listHeight =
    height - insets.top - insets.bottom - TITLE_BLOCK_HEIGHT - TAB_BAR_HEIGHT - 16;
  const cardHeight = Math.min(
    170,
    Math.max(124, Math.floor((listHeight - CARD_GAP * (VISIBLE_CARDS - 1)) / VISIBLE_CARDS)),
  );

  function openOffer(service: OpenOfferService) {
    if (!canAfford) {
      Alert.alert("Sin viajes prepagados", "Recarga para poder ofertar.", [
        { text: "Recargar", onPress: onGoToTopUp },
        { text: "Ahora no" },
      ]);
      return;
    }
    setOfferPrice(offerBounds(service).floor);
    setSelected(service);
  }

  function submitOffer() {
    if (selected === null) {
      return;
    }
    const service = selected;
    setSubmitting(true);
    void (async () => {
      try {
        const gps = await getDriverGpsForOffer();
        const result = await submitMyOffer({
          serviceId: service._id,
          offeredPrice: offerPrice,
          driverLat: gps.lat,
          driverLng: gps.lng,
        });
        if (result.ok) {
          setSelected(null);
          return;
        }
        if (isInsufficientBalanceError(result.message)) {
          setSelected(null);
          Alert.alert("Saldo insuficiente", result.message, [
            { text: "Recargar", onPress: onGoToTopUp },
            { text: "OK" },
          ]);
          return;
        }
        Alert.alert("No se pudo ofertar", result.message);
      } catch (error) {
        Alert.alert(
          "No se pudo ofertar",
          convexErrorMessage(error, "Activa la ubicación e inténtalo de nuevo."),
        );
      } finally {
        setSubmitting(false);
      }
    })();
  }

  const title = (
    <Text
      style={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 16,
        paddingBottom: 12,
        fontFamily: POPPINS.bold,
        fontSize: 30,
        color: colors.textStrong,
      }}
    >
      Lista de solicitudes
    </Text>
  );

  if (!isAvailable) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.base }}>
        {title}
        <EmptyState
          title="Estás desconectado"
          subtitle="Conéctate en Servicio para recibir pedidos de viaje."
          actionLabel="Ir a Servicio"
          onAction={onGoToService}
        />
      </View>
    );
  }

  const showEmpty = loaded && openServices.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      {title}

      {!canAfford && (
        <TouchableOpacity
          onPress={onGoToTopUp}
          activeOpacity={0.8}
          style={{
            marginHorizontal: 16,
            marginBottom: 10,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: UBER_RADIUS.card,
            backgroundColor: HERCOM_COLORS.warningSoft,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              flex: 1,
              fontFamily: POPPINS.medium,
              fontSize: 15,
              color: HERCOM_COLORS.text,
            }}
          >
            No tienes viajes prepagados. Recarga para ofertar.
          </Text>
          <DrawerIcon name="chevron" color={HERCOM_COLORS.text} />
        </TouchableOpacity>
      )}

      {locationError !== null ? (
        <EmptyState
          title="No pudimos ubicarte"
          subtitle={locationError}
          actionLabel="Actualizar"
          onAction={onRefreshLocation}
          loading={locationLoading}
        />
      ) : !loaded ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : showEmpty ? (
        <EmptyState
          title="No hay pedidos de viaje en este momento"
          subtitle="Aparecerán nuevos viajes, ¡vuelve pronto!"
          actionLabel="Actualizar"
          onAction={onRefreshLocation}
          loading={locationLoading}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: CARD_GAP }}
        >
          {openServices.map((service) => (
            <RequestCard
              key={service._id}
              service={service}
              height={cardHeight}
              myOffer={myOfferByService[service._id]}
              onPress={() => openOffer(service)}
            />
          ))}
        </ScrollView>
      )}

      <OfferSheet
        service={selected}
        price={offerPrice}
        onChangePrice={setOfferPrice}
        submitting={submitting}
        onSubmit={submitOffer}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

function RequestCard({
  service,
  height,
  myOffer,
  onPress,
}: {
  service: OpenOfferService;
  height: number;
  myOffer: number | undefined;
  onPress: () => void;
}) {
  const { colors, border } = useAppTheme();
  const card = service.offerCard;
  const offered = myOffer !== undefined;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={offered}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${soles(card.listPrice)}, ${hoursLabel(card.serviceHours)}, ${card.clientFirstName}. Recojo a ${card.pickup.km} kilómetros.`}
      style={{
        height,
        borderRadius: UBER_RADIUS.card,
        backgroundColor: colors.surfaceSunken,
        borderWidth: offered ? 1.5 : 0,
        borderColor: colors.accent,
        paddingHorizontal: 16,
        paddingVertical: 12,
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{ fontFamily: POPPINS.bold, fontSize: 26, color: colors.textStrong, ...TABULAR }}
          >
            {soles(card.listPrice)}
            <Text style={{ fontFamily: POPPINS.medium, fontSize: 17, color: colors.steel }}>
              {`  ·  ${hoursLabel(card.serviceHours)}`}
            </Text>
          </Text>
          {offered && (
            <Text
              numberOfLines={1}
              style={{ fontFamily: POPPINS.semibold, fontSize: 13, color: colors.accent }}
            >
              {`Ofertaste ${soles(myOffer)} · esperando al cliente`}
            </Text>
          )}
        </View>
        <View style={{ alignItems: "flex-end", marginRight: 10, maxWidth: "40%" }}>
          <Text
            numberOfLines={1}
            style={{ fontFamily: POPPINS.semibold, fontSize: 16, color: colors.textStrong }}
          >
            {service.forSelf === false && (service.passengerName?.trim() ?? "") !== ""
              ? service.passengerName
              : card.clientFirstName}
          </Text>
          <Text
            numberOfLines={1}
            style={{ fontFamily: POPPINS.regular, fontSize: 13, color: colors.steel }}
          >
            {service.forSelf === false
              ? `Pedido por ${card.clientFirstName}`
              : card.clientTrips === 0
                ? "Nuevo"
                : `${card.clientTrips} ${card.clientTrips === 1 ? "viaje" : "viajes"}`}
          </Text>
        </View>
        <Avatar uri={card.clientPhotoUrl} />
      </View>

      <View style={{ height: 1, backgroundColor: border }} />

      <View style={{ gap: 4 }}>
        <LegLine km={card.pickup.km} minutes={card.pickup.minutes} address={toPeopleAddress(service.origin.address)} />
        <LegLine km={card.trip.km} minutes={card.trip.minutes} address={toPeopleAddress(card.destinationAddress)} />
      </View>
    </TouchableOpacity>
  );
}

function LegLine({ km, minutes, address }: { km: number; minutes: number; address: string }) {
  const { colors } = useAppTheme();
  return (
    <Text
      numberOfLines={1}
      style={{ fontFamily: POPPINS.regular, fontSize: 15, color: colors.textStrong }}
    >
      <Text style={{ fontFamily: POPPINS.bold }}>{`${km} km · ${minutes} min  `}</Text>
      {address}
    </Text>
  );
}

function Avatar({ uri, size = 40 }: { uri: string | null; size?: number }) {
  const { colors } = useAppTheme();
  if (uri !== null) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surface }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <DrawerIcon name="user" color={colors.steel} size={size * 0.5} />
    </View>
  );
}

function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
  loading = false,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  loading?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
      <View
        style={{
          width: 112,
          height: 112,
          borderRadius: 56,
          backgroundColor: colors.surfaceSunken,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <DrawerIcon name="list" color={colors.accent} size={52} />
      </View>
      <Text
        style={{
          fontFamily: POPPINS.bold,
          fontSize: 20,
          lineHeight: 26,
          color: colors.textStrong,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          marginTop: 6,
          fontFamily: POPPINS.regular,
          fontSize: 16,
          color: colors.text,
          textAlign: "center",
        }}
      >
        {subtitle}
      </Text>
      <TouchableOpacity
        onPress={onAction}
        disabled={loading}
        activeOpacity={0.8}
        style={{
          marginTop: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 22,
          paddingVertical: 12,
          borderRadius: 16,
          backgroundColor: colors.surfaceSunken,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.textStrong} />
        ) : (
          <Text style={{ fontSize: 20, color: colors.textStrong, marginTop: -2 }}>↻</Text>
        )}
        <Text style={{ fontFamily: POPPINS.medium, fontSize: 17, color: colors.textStrong }}>
          {actionLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function OfferSheet({
  service,
  price,
  onChangePrice,
  submitting,
  onSubmit,
  onClose,
}: {
  service: OpenOfferService | null;
  price: number;
  onChangePrice: (price: number) => void;
  submitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  if (service === null) {
    return null;
  }
  const card = service.offerCard;
  const { floor, max } = offerBounds(service);
  const step = (delta: number) =>
    onChangePrice(Math.min(max, Math.max(floor, Math.round((price + delta) * 100) / 100)));

  return (
    <DriverSheet visible title="Tu oferta" onClose={onClose}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Avatar uri={card.clientPhotoUrl} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: POPPINS.semibold, fontSize: 17, color: colors.textStrong }}>
            {`${
              service.forSelf === false && (service.passengerName?.trim() ?? "") !== ""
                ? service.passengerName
                : card.clientFirstName
            } · ${hoursLabel(card.serviceHours)}`}
          </Text>
          <Text
            numberOfLines={1}
            style={{ fontFamily: POPPINS.regular, fontSize: 14, color: colors.steel }}
          >
            {`${toPeopleAddress(service.origin.address)} → ${toPeopleAddress(card.destinationAddress)}`}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 8,
        }}
      >
        <StepButton label="−" onPress={() => step(-OFFER_STEP)} disabled={price <= floor} />
        <Text
          style={{ fontFamily: POPPINS.bold, fontSize: 40, color: colors.textStrong, ...TABULAR }}
        >
          {soles(price)}
        </Text>
        <StepButton label="+" onPress={() => step(OFFER_STEP)} disabled={price >= max} />
      </View>
      <Text
        style={{
          textAlign: "center",
          fontFamily: POPPINS.regular,
          fontSize: 14,
          color: colors.steel,
          marginBottom: 16,
        }}
      >
        {`Entre ${soles(floor)} y ${soles(max)}`}
      </Text>

      <TacticalButton
        label={`Ofertar ${soles(price)}`}
        onPress={onSubmit}
        loading={submitting}
        disabled={submitting}
      />
    </DriverSheet>
  );
}

function StepButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label === "+" ? "Subir oferta" : "Bajar oferta"}
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.surfaceSunken,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Text style={{ fontFamily: POPPINS.bold, fontSize: 28, color: colors.textStrong }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
