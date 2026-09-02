import { useRef, useState } from "react";
import { PanResponder, Text, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@proyecto/backend";
import { UiCard } from "./ui";

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
    ? "En servicio — no puedes cambiar el estado"
    : isAvailable
      ? "Desliza para desconectarte"
      : "Desliza para ponerte disponible";

  return (
    <UiCard className="mb-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-slate-800">Estado</Text>
        <View
          className={`rounded-full px-3 py-1 ${
            isAvailable
              ? "bg-success-soft"
              : busy
                ? "bg-warning-soft"
                : "bg-slate-200"
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              isAvailable
                ? "text-success"
                : busy
                  ? "text-warning"
                  : "text-slate-600"
            }`}
          >
            {STATUS_LABELS[status]}
          </Text>
        </View>
      </View>

      {/* track = riel */}
      <View
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        className={`overflow-hidden rounded-full ${
          busy ? "bg-slate-300" : isAvailable ? "bg-success" : "bg-hercom"
        }`}
        style={{ height: TRACK_H, position: "relative" }}
      >
        <Text
          pointerEvents="none"
          className="absolute left-0 right-0 text-center text-sm font-semibold text-white/95"
          style={{
            top: 0,
            height: TRACK_H,
            lineHeight: TRACK_H,
            paddingLeft: THUMB + INSET,
            paddingRight: INSET,
          }}
        >
          {slideLabel}
        </Text>

        {/* thumb = control / perilla */}
        {!busy && (
          <View
            {...pan.panHandlers}
            className="absolute items-center justify-center rounded-full bg-white"
            style={{
              width: THUMB,
              height: THUMB,
              left: INSET + thumbX,
              top: INSET,
              elevation: 3,
              shadowColor: "#0F172A",
              shadowOpacity: 0.2,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
            }}
          >
            <Text className="text-base font-bold text-slate-600">››</Text>
          </View>
        )}
      </View>
    </UiCard>
  );
}
