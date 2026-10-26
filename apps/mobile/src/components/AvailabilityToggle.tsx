import { useRef, useState } from "react";
import { Alert, PanResponder, Text, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@proyecto/backend";
import { getDriverGpsForOffer } from "../hooks/useDriverOfferLocation";
import { TacticalLabel, TacticalPanel, TacticalStatus } from "./tactical";
import {
  HERCOM_COLORS,
  MONO,
  POPPINS,
  TACTICAL_COLORS,
} from "../constants/theme";

type DriverStatus = "available" | "busy" | "offline";

const STATUS_LABELS: Record<DriverStatus, string> = {
  available: "Disponible",
  busy: "En servicio",
  offline: "Desconectado",
};

/** Alto total del riel (track). */
const TRACK_H = 64;
/** Margen interno entre riel y control (thumb). */
const INSET = 4;
/** Diámetro del control = alto del riel menos márgenes (encaja exacto). */
const THUMB = TRACK_H - INSET * 2;

/**
 * Deslizador tipo Yango: hay que arrastrar el control para cambiar
 * disponible ↔ desconectado (evita toques accidentales).
 *
 * Anatomía (React Native, no HTML):
 * - track (riel): View horizontal redondeada de fondo
 * - thumb (control / perilla): View circular que el usuario arrastra
 */
export function AvailabilityToggle({
  status,
  variant = "panel",
}: {
  status: DriverStatus;
  /** `pill`: solo el riel, botón grande al pie del mapa (pestaña Servicio). */
  variant?: "panel" | "pill";
}) {
  const setStatus = useMutation(api.drivers.setStatus);
  const [trackWidth, setTrackWidth] = useState(0);
  const [thumbX, setThumbX] = useState(0);
  const maxXRef = useRef(0);
  const statusRef = useRef(status);
  statusRef.current = status;
  maxXRef.current = Math.max(0, trackWidth - THUMB - INSET * 2);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => statusRef.current !== "busy",
      onMoveShouldSetPanResponder: () => statusRef.current !== "busy",
      onPanResponderMove: (_, gesture) => {
        const next = Math.min(maxXRef.current, Math.max(0, gesture.dx));
        setThumbX(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const next = Math.min(maxXRef.current, Math.max(0, gesture.dx));
        const threshold = maxXRef.current * 0.72;
        const current = statusRef.current;
        if (next >= threshold && maxXRef.current > 0 && current !== "busy") {
          const target: DriverStatus =
            current === "available" ? "offline" : "available";
          setThumbX(0);
          if (target === "available") {
            void (async () => {
              try {
                const gps = await getDriverGpsForOffer();
                await setStatus({
                  status: target,
                  lat: gps.lat,
                  lng: gps.lng,
                });
              } catch (error) {
                Alert.alert(
                  "Ubicación requerida",
                  error instanceof Error
                    ? error.message
                    : "Activa el GPS para conectarte y ver solicitudes cercanas.",
                );
              }
            })();
          } else {
            void setStatus({ status: target });
          }
          return;
        }
        setThumbX(0);
      },
    }),
  ).current;

  const busy = status === "busy";
  const isAvailable = status === "available";
  const slideLabel = busy
    ? "En servicio — estado bloqueado"
    : isAvailable
      ? "Desliza para desconectarte"
      : "Desliza para activar";

  const trackColor = busy
    ? "rgba(91, 132, 177, 0.18)"
    : isAvailable
      ? "rgba(74, 222, 128, 0.16)"
      : "rgba(161, 196, 253, 0.14)";
  const trackBorder = busy
    ? TACTICAL_COLORS.steel
    : isAvailable
      ? TACTICAL_COLORS.success
      : TACTICAL_COLORS.accent;

  if (variant === "pill") {
    const pillBg = busy
      ? HERCOM_COLORS.surfaceMuted
      : isAvailable
        ? HERCOM_COLORS.success
        : HERCOM_COLORS.primary;
    const pillText = busy ? HERCOM_COLORS.textMuted : HERCOM_COLORS.white;
    const pillLabel = busy
      ? "En servicio"
      : isAvailable
        ? "Desliza para desconectarte"
        : "Conéctate";
    return (
      <View
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        accessibilityRole="adjustable"
        accessibilityLabel={slideLabel}
        accessibilityHint="Desliza el control hacia la derecha para cambiar tu estado"
        style={{
          height: TRACK_H,
          borderRadius: 999,
          backgroundColor: pillBg,
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: THUMB + INSET * 2,
            right: INSET * 2,
            alignItems: "center",
          }}
        >
          {!busy && !isAvailable && (
            <Text
              style={{
                fontFamily: POPPINS.medium,
                fontSize: 13,
                color: "rgba(255,255,255,0.85)",
              }}
            >
              Desliza para recibir solicitudes
            </Text>
          )}
          <Text
            numberOfLines={1}
            style={{
              fontFamily: POPPINS.bold,
              fontSize: isAvailable ? 16 : 18,
              color: pillText,
            }}
          >
            {pillLabel}
          </Text>
        </View>
        {!busy && (
          <View
            {...pan.panHandlers}
            style={{
              position: "absolute",
              width: THUMB,
              height: THUMB,
              left: INSET + thumbX,
              top: INSET,
              borderRadius: 999,
              backgroundColor: HERCOM_COLORS.white,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: POPPINS.bold,
                fontSize: 24,
                lineHeight: 28,
                color: pillBg,
              }}
            >
              →
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <TacticalPanel corners active={isAvailable} className="mb-3">
      <View className="mb-3 flex-row items-center justify-between">
        <TacticalLabel>Tu disponibilidad</TacticalLabel>
        <TacticalStatus
          label={STATUS_LABELS[status]}
          tone={isAvailable ? "success" : busy ? "warning" : "idle"}
        />
      </View>

      {/* track = riel */}
      <View
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        className="overflow-hidden"
        style={{
          height: TRACK_H,
          position: "relative",
          backgroundColor: trackColor,
          borderRadius: 999,
          borderWidth: 0,
        }}
      >
        <Text
          pointerEvents="none"
          className="absolute left-0 right-0 text-center"
          style={{
            top: 0,
            height: TRACK_H,
            lineHeight: TRACK_H,
            paddingLeft: THUMB + INSET,
            paddingRight: INSET,
            fontFamily: MONO.medium,
            fontSize: 16,
            color: busy ? TACTICAL_COLORS.steel : TACTICAL_COLORS.text,
          }}
        >
          {slideLabel}
        </Text>

        {/* thumb = control / perilla */}
        {!busy && (
          <View
            {...pan.panHandlers}
            className="absolute items-center justify-center"
            style={{
              width: THUMB,
              height: THUMB,
              left: INSET + thumbX,
              top: INSET,
              backgroundColor: isAvailable
                ? TACTICAL_COLORS.success
                : TACTICAL_COLORS.accent,
              borderRadius: 999,
              shadowColor: "#0F172A",
              shadowOpacity: 0.15,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3,
            }}
          >
            <Text
              style={{
                fontFamily: MONO.bold,
                fontSize: 18,
                color: "#FFFFFF",
              }}
            >
              {"›"}
            </Text>
          </View>
        )}
      </View>
    </TacticalPanel>
  );
}
