import { useState } from "react";
import { Modal, ScrollView, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import { RateServiceStars } from "./RateServiceStars";
import { TACTICAL_COLORS } from "../constants/theme";

/** Si el cliente cerró la app sin valorar, la valoración vuelve a aparecer. */
export function ClientPendingRating() {
  const pending = useQuery(api.serviceRatings.pendingForMe, {});
  const rateService = useMutation(api.serviceRatings.rateService);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratedId, setRatedId] = useState<string | null>(null);
  const pendingId = pending?.clientServiceId ?? null;
  const serviceId = pendingId !== null && pendingId !== ratedId ? pendingId : null;

  return (
    <Modal visible={serviceId !== null} animationType="slide" onRequestClose={() => {}}>
      <View style={{ flex: 1, backgroundColor: TACTICAL_COLORS.base, paddingTop: 24 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <RateServiceStars
            title="Valora tu viaje"
            subtitle={
              pending?.clientLabel !== null && pending?.clientLabel !== undefined
                ? pending.clientLabel
                : "Cuéntanos cómo fue el servicio."
            }
            submitting={submitting}
            error={error}
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
  );
}
