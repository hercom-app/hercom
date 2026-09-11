import { useRef, useState } from "react";
import { PanResponder, Text, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@proyecto/backend";
import { TacticalLabel, TacticalPanel, TacticalStatus } from "./tactical";
import {
  MONO,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";

type DriverStatus = "available" | "busy" | "offline";

const STATUS_LABELS: Record<DriverStatus, string> = {
  available: "Disponible",
  busy: "En servicio",
  offline: "Desconectado",
};

/** Alto total del riel (track). */
const TRACK_H = 56;
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
export function AvailabilityToggle({ status }: { status: DriverStatus }) {
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
          void setStatus({ status: target });
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

  return (
    <TacticalPanel corners active={isAvailable} className="mb-3">
      <View className="mb-3 flex-row items-center justify-between">
        <TacticalLabel tone="accent">Estado operativo</TacticalLabel>
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
          borderRadius: TACTICAL_RADIUS.sharp,
          borderWidth: 1,
          borderColor: `${trackBorder}59`,
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
            fontSize: 11,
            letterSpacing: 1.5,
            color: busy ? TACTICAL_COLORS.steel : TACTICAL_COLORS.text,
          }}
        >
          {slideLabel.toUpperCase()}
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
              borderRadius: TACTICAL_RADIUS.sharp,
            }}
          >
            <Text
              style={{
                fontFamily: MONO.bold,
                fontSize: 15,
                color: TACTICAL_COLORS.base,
              }}
            >
              {"››"}
            </Text>
          </View>
        )}
      </View>
    </TacticalPanel>
  );
}
