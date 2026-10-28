import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc, Id } from "@proyecto/backend/dataModel";
import { useAppTheme } from "../contexts/ThemeContext";
import { HERCOM_COLORS, POPPINS, UBER_RADIUS } from "../constants/theme";
import {
  canClientExtendTrip,
  formatRemainingTime,
  msUntilServiceEnd,
} from "../lib/tripExtension";

type Props = {
  service: Doc<"services">;
};

/** Aviso de extensión: registra +1 h en el sistema; el pago extra es directo al chofer. */
export function ExtendTripPanel({ service }: Props) {
  const { colors } = useAppTheme();
  const extendService = useMutation(api.services.extendService);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!canClientExtendTrip(service.status)) {
    return null;
  }

  const remaining = msUntilServiceEnd(service, now);
  const hours = service.serviceHours ?? 2;

  async function handleNotifyExtend() {
    setLoading(true);
    setError(null);
    try {
      await extendService({ serviceId: service._id as Id<"services"> });
      setAcknowledged(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo avisar la extensión.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      style={{
        backgroundColor: colors.surfaceSunken,
        borderRadius: UBER_RADIUS.card,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 10,
      }}
    >
      <Text style={{ fontFamily: POPPINS.semibold, fontSize: 16, color: colors.textStrong }}>
        ¿Necesitas más tiempo?
      </Text>
      <Text style={{ fontFamily: POPPINS.regular, fontSize: 14, lineHeight: 20, color: colors.text }}>
        {remaining !== null && remaining > 0
          ? `Quedan ${formatRemainingTime(remaining)} de las ${hours} h del servicio contratado.`
          : `Horas registradas del servicio: ${hours}.`}
        {" "}
        Avisa aquí para que el chofer siga en servicio. Las horas extra las pagas directo a él.
      </Text>
      {acknowledged ? (
        <Text style={{ fontFamily: POPPINS.medium, fontSize: 14, color: HERCOM_COLORS.success }}>
          Chofer avisado. Coordina el pago de la hora extra con él.
        </Text>
      ) : (
        <TouchableOpacity
          onPress={() => void handleNotifyExtend()}
          disabled={loading}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Avisar extensión de una hora"
          style={{
            height: 48,
            borderRadius: 999,
            backgroundColor: loading ? colors.steel : HERCOM_COLORS.primary,
            alignItems: "center",
            justifyContent: "center",
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Text style={{ fontFamily: POPPINS.bold, fontSize: 16, color: HERCOM_COLORS.white }}>
            {loading ? "Enviando aviso…" : "Avisar extensión (+1 h)"}
          </Text>
        </TouchableOpacity>
      )}
      {error !== null && (
        <Text style={{ fontFamily: POPPINS.medium, fontSize: 14, color: colors.danger }}>
          {error}
        </Text>
      )}
    </View>
  );
}
