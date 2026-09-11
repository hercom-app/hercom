import { useMemo } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import {
  HERCOM_COLORS,
  MONO,
  TACTICAL_BORDER,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";
import { TacticalLabel, TacticalText, TacticalTitle } from "./tactical";
import { buildLiveShareMessage, buildLiveShareUrl } from "../lib/liveShareUrl";

type LiveTripMapModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Vista autenticada (cliente/chofer). */
  serviceId?: Id<"services">;
  /** Vista pública por enlace compartido. */
  shareToken?: string;
  title?: string;
};

function statusLabel(status: string): string {
  switch (status) {
    case "heading_to_pickup":
      return "Yendo al recojo";
    case "arrived_pickup":
      return "En el punto de partida";
    case "in_progress":
    case "en_route":
      return "En viaje";
    case "arrived_destination":
      return "En el destino";
    case "finished":
      return "Viaje finalizado";
    case "cancelled":
      return "Cancelado";
    default:
      return status;
  }
}

/**
 * Mapa en vivo del chofer + rastro + origen/destino.
 * Sirve para el cliente y para quien abre un enlace compartido.
 */
export function LiveTripMapModal({
  visible,
  onClose,
  serviceId,
  shareToken,
  title = "Viaje en vivo",
}: LiveTripMapModalProps) {
  const insets = useSafeAreaInsets();
  const byService = useQuery(
    api.serviceTracking.getForService,
    visible && serviceId !== undefined ? { serviceId } : "skip",
  );
  const byToken = useQuery(
    api.serviceTracking.getByShareToken,
    visible && shareToken !== undefined && shareToken.trim() !== ""
      ? { shareToken: shareToken.trim().toLowerCase() }
      : "skip",
  );

  const live = serviceId !== undefined ? byService : byToken;
  const loading = visible && live === undefined;

  const region = useMemo(() => {
    if (live === null || live === undefined) {
      return {
        latitude: -12.0464,
        longitude: -77.0428,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    const points: { latitude: number; longitude: number }[] = [];
    if (live.lat !== null && live.lng !== null) {
      points.push({ latitude: live.lat, longitude: live.lng });
    }
    points.push({
      latitude: live.origin.lat,
      longitude: live.origin.lng,
    });
    points.push({
      latitude: live.destination.lat,
      longitude: live.destination.lng,
    });
    for (const point of live.trail) {
      points.push({ latitude: point.lat, longitude: point.lng });
    }
    const lats = points.map((p) => p.latitude);
    const lngs = points.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.8, 0.02),
      longitudeDelta: Math.max((maxLng - minLng) * 1.8, 0.02),
    };
  }, [live]);

  const trailCoords = useMemo(
    () =>
      (live?.trail ?? []).map((point) => ({
        latitude: point.lat,
        longitude: point.lng,
      })),
    [live?.trail],
  );

  const lastUpdated =
    live?.updatedAt !== null && live?.updatedAt !== undefined
      ? new Date(live.updatedAt).toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : null;

  async function handleShare() {
    const token = live?.shareToken;
    if (token === null || token === undefined) {
      return;
    }
    const webUrl = buildLiveShareUrl(token);
    const message = buildLiveShareMessage(token);
    await Share.share(
      Platform.OS === "ios"
        ? { message, url: webUrl }
        : { message },
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View
        className="flex-1"
        style={{ backgroundColor: TACTICAL_COLORS.base, paddingTop: insets.top }}
      >
        <View
          className="flex-row items-center gap-3 px-4 pb-3"
          style={{
            borderBottomWidth: 1,
            borderBottomColor: TACTICAL_BORDER,
            backgroundColor: TACTICAL_COLORS.baseElevated,
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            className="h-11 w-11 items-center justify-center"
            style={{
              backgroundColor: TACTICAL_COLORS.surface,
              borderRadius: TACTICAL_RADIUS.sharp,
              borderWidth: 1,
              borderColor: TACTICAL_BORDER,
            }}
          >
            <Text
              style={{
                fontFamily: MONO.bold,
                fontSize: 18,
                color: TACTICAL_COLORS.accent,
              }}
            >
              ←
            </Text>
          </TouchableOpacity>
          <View className="flex-1">
            <TacticalTitle size={17}>{title}</TacticalTitle>
            {live !== null && live !== undefined && (
              <TacticalText size={11} className="mt-0.5">
                {statusLabel(live.status)}
                {lastUpdated !== null ? ` · act. ${lastUpdated}` : ""}
              </TacticalText>
            )}
          </View>
          {live?.shareToken !== null &&
            live?.shareToken !== undefined &&
            live.isLive && (
              <TouchableOpacity
                onPress={() => void handleShare()}
                className="px-3 py-2"
                style={{
                  backgroundColor: TACTICAL_COLORS.accent,
                  borderRadius: TACTICAL_RADIUS.sharp,
                }}
              >
                <TacticalLabel size={10} style={{ color: TACTICAL_COLORS.base }}>
                  Compartir
                </TacticalLabel>
              </TouchableOpacity>
            )}
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={TACTICAL_COLORS.accent} />
            <TacticalText size={13} className="mt-3">
              Cargando ubicación…
            </TacticalText>
          </View>
        ) : live == null ? (
          <View className="flex-1 items-center justify-center px-8">
            <TacticalTitle size={16} className="text-center">
              No encontramos este viaje
            </TacticalTitle>
            <TacticalText size={13} className="mt-2 text-center">
              El enlace puede haber expirado o el código es incorrecto.
            </TacticalText>
          </View>
        ) : (
          <View className="flex-1">
            <MapView
              style={{ flex: 1 }}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              initialRegion={region}
              showsUserLocation={false}
              loadingEnabled
            >
              <Marker
                coordinate={{
                  latitude: live.origin.lat,
                  longitude: live.origin.lng,
                }}
                title="Recojo"
                pinColor={HERCOM_COLORS.primary}
              />
              <Marker
                coordinate={{
                  latitude: live.destination.lat,
                  longitude: live.destination.lng,
                }}
                title="Destino"
                pinColor="#334155"
              />
              {trailCoords.length > 1 && (
                <Polyline
                  coordinates={trailCoords}
                  strokeColor={HERCOM_COLORS.primary}
                  strokeWidth={4}
                />
              )}
              {live.lat !== null && live.lng !== null && (
                <Marker
                  coordinate={{
                    latitude: live.lat,
                    longitude: live.lng,
                  }}
                  title="Chofer"
                  description="Ubicación en vivo"
                  pinColor="#16A34A"
                />
              )}
            </MapView>

            <View
              className="px-4 pt-3"
              style={{
                paddingBottom: insets.bottom + 12,
                backgroundColor: TACTICAL_COLORS.baseElevated,
                borderTopWidth: 1,
                borderTopColor: TACTICAL_BORDER,
              }}
            >
              {!live.isLive && (
                <TacticalText size={13} className="mb-2 text-center" tone="text">
                  {live.status === "finished"
                    ? "El viaje ya terminó. Se muestra el rastro recorrido."
                    : "El seguimiento en vivo no está activo."}
                </TacticalText>
              )}
              {live.lat === null && live.isLive && (
                <TacticalText size={13} className="mb-2 text-center">
                  Esperando la primera señal GPS del chofer…
                </TacticalText>
              )}
              <TacticalText size={11} numberOfLines={2}>
                De: {live.origin.address}
              </TacticalText>
              <TacticalText size={11} className="mt-1" numberOfLines={2}>
                A: {live.destination.address}
              </TacticalText>
              {live.shareToken !== null && (
                <TacticalLabel size={10} className="mt-2 text-center">
                  Código: {live.shareToken}
                </TacticalLabel>
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
