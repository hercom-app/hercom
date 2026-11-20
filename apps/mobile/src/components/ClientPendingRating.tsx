import { useState } from "react";
import { Modal, ScrollView, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import { RateServiceStars } from "./RateServiceStars";
import { TripSummaryModal } from "./TripSummaryModal";
import { BalancePaymentPicker } from "./TripPaymentMethodPicker";
import { TacticalButton, TacticalLabel, TacticalText } from "./tactical";
import { TACTICAL_BORDER, TACTICAL_COLORS } from "../constants/theme";
import { convexErrorMessage } from "../lib/convexErrorMessage";
import type { TripPaymentMethod } from "../lib/tripPaymentMethods";

/** Si el cliente cerró la app sin valorar, la valoración vuelve a aparecer. */
export function ClientPendingRating() {
  const pending = useQuery(api.serviceRatings.pendingForMe, {});
  const rateService = useMutation(api.serviceRatings.rateService);
  const confirmBalancePaid = useMutation(api.payments.confirmBalancePaid);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratedId, setRatedId] = useState<string | null>(null);
  const [summaryId, setSummaryId] = useState<Id<"services"> | null>(null);
  const [balanceMethod, setBalanceMethod] = useState<TripPaymentMethod | null>(null);
  const [balanceSending, setBalanceSending] = useState(false);
  const pendingId = pending?.clientServiceId ?? null;
  const serviceId =
    pendingId !== null && pendingId !== ratedId && summaryId === null ? pendingId : null;
  const balanceContext = useQuery(
    api.payments.balanceContextForMyService,
    serviceId !== null ? { serviceId: serviceId as Id<"services"> } : "skip",
  );
  const balanceDue = balanceContext?.balanceDue ?? 0;
  const balanceConfirmed = balanceContext?.clientPaidAt != null;

  return (
    <>
      <Modal visible={serviceId !== null} animationType="slide" onRequestClose={() => {}}>
        <View style={{ flex: 1, backgroundColor: TACTICAL_COLORS.base, paddingTop: 24 }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            {balanceDue > 0.01 && !balanceConfirmed && (
              <View
                className="mb-3 p-3"
                style={{
                  backgroundColor: TACTICAL_COLORS.surfaceSunken,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: TACTICAL_BORDER,
                }}
              >
                <TacticalLabel tone="accent" className="mb-1">
                  Saldo del viaje
                </TacticalLabel>
                <View style={{ marginBottom: 12 }}>
                  <BalancePaymentPicker
                    balanceDue={balanceDue}
                    advanceMethod={balanceContext?.advancePaymentMethod ?? null}
                    value={balanceMethod}
                    onChange={setBalanceMethod}
                  />
                </View>
                <TacticalButton
                  label={balanceSending ? "Guardando…" : "Confirmé el pago del saldo"}
                  size="md"
                  disabled={balanceMethod === null || balanceSending}
                  loading={balanceSending}
                  onPress={() => {
                    if (balanceMethod === null || serviceId === null) {
                      return;
                    }
                    setBalanceSending(true);
                    setError(null);
                    void confirmBalancePaid({
                      serviceId: serviceId as Id<"services">,
                      method: balanceMethod,
                    })
                      .catch((balanceError) =>
                        setError(convexErrorMessage(balanceError, "No se pudo registrar el saldo.")),
                      )
                      .finally(() => setBalanceSending(false));
                  }}
                />
              </View>
            )}
            <RateServiceStars
              title="Valora tu viaje"
              subtitle={
                pending?.clientLabel !== null && pending?.clientLabel !== undefined
                  ? pending.clientLabel
                  : "Cuéntanos cómo fue el servicio."
              }
              submitting={submitting}
              error={error}
              submitBlocked={
                balanceContext !== undefined && balanceDue > 0.01 && !balanceConfirmed
              }
              onSubmit={(score, comment) => {
                if (serviceId === null) {
                  return;
                }
                setSubmitting(true);
                setError(null);
                void rateService({
                  serviceId: serviceId as Id<"services">,
                  score,
                  ...(comment.trim() !== "" ? { comment: comment.trim() } : {}),
                })
                  .then(() => {
                    setRatedId(serviceId);
                    setSummaryId(serviceId as Id<"services">);
                  })
                  .catch((rateError) => {
                    setError(
                      rateError instanceof Error
                        ? rateError.message
                        : "No se pudo enviar la valoración.",
                    );
                  })
                  .finally(() => setSubmitting(false));
              }}
            />
          </ScrollView>
        </View>
      </Modal>
      <TripSummaryModal serviceId={summaryId} onClose={() => setSummaryId(null)} />
    </>
  );
}