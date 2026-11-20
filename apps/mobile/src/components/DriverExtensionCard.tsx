import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc, Id } from "@proyecto/backend/dataModel";
import { useAppTheme } from "../contexts/ThemeContext";
import { HERCOM_COLORS, POPPINS, TABULAR } from "../constants/theme";

export function DriverExtensionCard({ service }: { service: Doc<"services"> }) {
  const { colors, border } = useAppTheme();
  const active = useQuery(api.serviceExtensions.getActiveForService, {
    serviceId: service._id,
  });
  const respond = useMutation(api.serviceExtensions.respondAsDriver);
  const [counterDraft, setCounterDraft] = useState("");
  const [showCounter, setShowCounter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (active === undefined || active === null || active.status !== "pending_driver") {
    return null;
  }

  return (
    <View
      style={{
        marginTop: 12,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: colors.surfaceSunken,
        gap: 10,
      }}
    >
      <Text style={{ fontFamily: POPPINS.bold, fontSize: 16, color: colors.textStrong }}>
        Propuesta de extensión
      </Text>
      <Text style={{ fontFamily: POPPINS.regular, fontSize: 14, color: colors.text }}>
        {`El cliente pide +${active.extraHours} h por S/${active.clientAmount.toFixed(2)}. Al aceptar, se suma al total del servicio y a tu comisión.`}
      </Text>
      {showCounter ? (
        <>
          <TextInput
            value={counterDraft}
            onChangeText={setCounterDraft}
            keyboardType="decimal-pad"
            placeholder="Tu contraoferta (PEN)"
            style={{
              borderWidth: 1,
              borderColor: border,
              borderRadius: 12,
              padding: 12,
              fontFamily: POPPINS.semibold,
              fontSize: 16,
              ...TABULAR,
            }}
          />
          <TouchableOpacity
            disabled={loading}
            onPress={() => {
              const counterAmount = Number.parseFloat(counterDraft.replace(",", "."));
              if (!Number.isFinite(counterAmount)) {
                setError("Monto inválido.");
                return;
              }
              setLoading(true);
              setError(null);
              void respond({
                requestId: active._id as Id<"serviceExtensionRequests">,
                action: "counter",
                counterAmount,
              })
                .catch((err) => setError(err instanceof Error ? err.message : "Error"))
                .finally(() => setLoading(false));
            }}
            style={{
              height: 44,
              borderRadius: 12,
              backgroundColor: HERCOM_COLORS.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: POPPINS.bold, fontSize: 15, color: HERCOM_COLORS.white }}>
              Enviar contraoferta
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            disabled={loading}
            onPress={() => {
              setLoading(true);
              void respond({
                requestId: active._id as Id<"serviceExtensionRequests">,
                action: "accept",
              })
                .catch((err) => setError(err instanceof Error ? err.message : "Error"))
                .finally(() => setLoading(false));
            }}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              backgroundColor: HERCOM_COLORS.success,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: POPPINS.bold, fontSize: 15, color: HERCOM_COLORS.white }}>
              Aceptar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCounter(true)}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: colors.textStrong,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: POPPINS.semibold, fontSize: 15, color: colors.textStrong }}>
              Contraofertar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={loading}
            onPress={() => {
              setLoading(true);
              void respond({
                requestId: active._id as Id<"serviceExtensionRequests">,
                action: "reject",
              })
                .finally(() => setLoading(false));
            }}
            style={{
              paddingHorizontal: 12,
              height: 44,
              borderRadius: 12,
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: POPPINS.semibold, fontSize: 14, color: colors.danger }}>
              Rechazar
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {error !== null && (
        <Text style={{ fontFamily: POPPINS.medium, fontSize: 13, color: colors.danger }}>{error}</Text>
      )}
    </View>
  );
}