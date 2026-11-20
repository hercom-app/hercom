import { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc, Id } from "@proyecto/backend/dataModel";
import { useAppTheme } from "../contexts/ThemeContext";
import { HERCOM_COLORS, POPPINS, TABULAR, UBER_RADIUS } from "../constants/theme";
import {
  canClientExtendTrip,
  formatRemainingTime,
  msUntilServiceEnd,
} from "../lib/tripExtension";

type Props = {
  service: Doc<"services">;
};

/** Cliente propone horas extra y monto; el chofer acepta o negocia. */
export function ExtendTripPanel({ service }: Props) {
  const { colors } = useAppTheme();
  const requestExtension = useMutation(api.serviceExtensions.requestExtension);
  const acceptCounter = useMutation(api.serviceExtensions.acceptCounterAsClient);
  const rejectCounter = useMutation(api.serviceExtensions.rejectCounterAsClient);
  const active = useQuery(api.serviceExtensions.getActiveForService, {
    serviceId: service._id,
  });
  const [extraHours, setExtraHours] = useState(1);
  const [amountDraft, setAmountDraft] = useState("");
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quote = useQuery(
    api.serviceExtensions.quoteForClient,
    canClientExtendTrip(service.status) ? { serviceId: service._id, extraHours } : "skip",
  );

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (quote?.clientExtra !== undefined && amountDraft === "") {
      setAmountDraft(quote.clientExtra.toFixed(2));
    }
  }, [quote?.clientExtra, amountDraft]);

  if (!canClientExtendTrip(service.status)) {
    return null;
  }

  const remaining = msUntilServiceEnd(service, now);
  const hours = service.serviceHours ?? 2;

  async function handleRequest() {
    const clientAmount = Number.parseFloat(amountDraft.replace(",", "."));
    if (!Number.isFinite(clientAmount) || clientAmount <= 0) {
      setError("Indica un monto válido.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await requestExtension({
        serviceId: service._id as Id<"services">,
        extraHours,
        clientAmount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la propuesta.");
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
        Extender el servicio
      </Text>
      <Text style={{ fontFamily: POPPINS.regular, fontSize: 14, lineHeight: 20, color: colors.text }}>
        {remaining !== null && remaining > 0
          ? `Quedan ${formatRemainingTime(remaining)} de ${hours} h contratadas.`
          : `Horas del servicio: ${hours}.`}
        {" "}
        Elige cuánto tiempo más necesitas y el monto (con tu descuento). El chofer puede aceptar o contraofertar.
      </Text>

      {active === undefined ? null : active !== null ? (
        <ActiveRequestView
          active={active}
          loading={loading}
          onAccept={() => {
            setLoading(true);
            setError(null);
            void acceptCounter({ requestId: active._id })
              .catch((err) => setError(err instanceof Error ? err.message : "Error"))
              .finally(() => setLoading(false));
          }}
          onReject={() => {
            setLoading(true);
            void rejectCounter({ requestId: active._id })
              .catch((err) => setError(err instanceof Error ? err.message : "Error"))
              .finally(() => setLoading(false));
          }}
        />
      ) : (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Text style={{ fontFamily: POPPINS.medium, fontSize: 15, color: colors.text }}>Horas extra</Text>
            <TouchableOpacity onPress={() => setExtraHours((h) => Math.max(1, h - 1))}>
              <Text style={{ fontFamily: POPPINS.bold, fontSize: 22, color: colors.textStrong }}>−</Text>
            </TouchableOpacity>
            <Text style={{ fontFamily: POPPINS.bold, fontSize: 18, color: colors.textStrong, ...TABULAR }}>
              {extraHours}
            </Text>
            <TouchableOpacity onPress={() => setExtraHours((h) => Math.min(12, h + 1))}>
              <Text style={{ fontFamily: POPPINS.bold, fontSize: 22, color: colors.textStrong }}>+</Text>
            </TouchableOpacity>
          </View>
          {quote !== undefined && quote !== null && (
            <Text style={{ fontFamily: POPPINS.regular, fontSize: 13, color: colors.steel }}>
              {`Sugerido con descuento: S/${quote.clientExtra.toFixed(2)} (lista S/${quote.listExtra.toFixed(2)})`}
            </Text>
          )}
          <Text style={{ fontFamily: POPPINS.medium, fontSize: 14, color: colors.text }}>
            Monto que propones pagar (PEN)
          </Text>
          <TextInput
            value={amountDraft}
            onChangeText={setAmountDraft}
            keyboardType="decimal-pad"
            style={{
              borderWidth: 1,
              borderColor: colors.steel,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              fontFamily: POPPINS.semibold,
              fontSize: 18,
              color: colors.textStrong,
              ...TABULAR,
            }}
          />
          <TouchableOpacity
            onPress={() => void handleRequest()}
            disabled={loading}
            style={{
              height: 48,
              borderRadius: 999,
              backgroundColor: loading ? colors.steel : HERCOM_COLORS.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: POPPINS.bold, fontSize: 16, color: HERCOM_COLORS.white }}>
              {loading ? "Enviando…" : "Enviar propuesta al chofer"}
            </Text>
          </TouchableOpacity>
        </>
      )}
      {error !== null && (
        <Text style={{ fontFamily: POPPINS.medium, fontSize: 14, color: colors.danger }}>{error}</Text>
      )}
    </View>
  );
}

function ActiveRequestView({
  active,
  loading,
  onAccept,
  onReject,
}: {
  active: {
    _id: Id<"serviceExtensionRequests">;
    status: string;
    extraHours: number;
    clientAmount: number;
    driverAmount?: number;
  };
  loading: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const { colors } = useAppTheme();
  if (active.status === "pending_driver") {
    return (
      <Text style={{ fontFamily: POPPINS.medium, fontSize: 14, color: HERCOM_COLORS.primary }}>
        {`Esperando al chofer: +${active.extraHours} h por S/${active.clientAmount.toFixed(2)}.`}
      </Text>
    );
  }
  if (active.status === "countered" && active.driverAmount !== undefined) {
    return (
      <View style={{ gap: 8 }}>
        <Text style={{ fontFamily: POPPINS.semibold, fontSize: 15, color: colors.textStrong }}>
          {`Contraoferta: S/${active.driverAmount.toFixed(2)} por +${active.extraHours} h`}
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={onAccept}
            disabled={loading}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              backgroundColor: HERCOM_COLORS.primaryDark,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: POPPINS.bold, fontSize: 15, color: HERCOM_COLORS.white }}>
              Aceptar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onReject}
            disabled={loading}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: colors.steel,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: POPPINS.semibold, fontSize: 15, color: colors.textStrong }}>
              Rechazar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  return null;
}