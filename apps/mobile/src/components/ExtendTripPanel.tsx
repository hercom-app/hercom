import { useEffect, useState } from "react";
import { View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc, Id } from "@proyecto/backend/dataModel";
import { UiButton } from "./ui";
import { TacticalPanel, TacticalText, TacticalTitle } from "./tactical";
import { TACTICAL_COLORS } from "../constants/theme";
import {
  canClientExtendTrip,
  formatRemainingTime,
  msUntilServiceEnd,
  shouldPromptExtendService,
} from "../lib/tripExtension";

type Props = {
  service: Doc<"services">;
};

export function ExtendTripPanel({ service }: Props) {
  const extendService = useMutation(api.services.extendService);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedPrompt, setDismissedPrompt] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!canClientExtendTrip(service.status)) {
    return null;
  }

  const remaining = msUntilServiceEnd(service, now);
  const showPrompt =
    !dismissedPrompt && shouldPromptExtendService(service, now);
  const hours = service.serviceHours ?? 2;

  async function handleExtend() {
    setLoading(true);
    setError(null);
    try {
      await extendService({ serviceId: service._id as Id<"services"> });
      setDismissedPrompt(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo extender el servicio.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="mb-3">
      {showPrompt ? (
        <TacticalPanel
          className="mb-3 gap-2 p-3"
          style={{
            borderColor: TACTICAL_COLORS.warning,
            backgroundColor: "rgba(245, 158, 11, 0.08)",
          }}
        >
          <TacticalTitle size={15}>
            Tu servicio termina pronto
          </TacticalTitle>
          <TacticalText size={13} tone="text">
            {remaining !== null
              ? `Quedan ${formatRemainingTime(remaining)} de las ${hours} h contratadas. ¿Necesitas más tiempo?`
              : "¿Necesitas más tiempo con el chofer?"}
          </TacticalText>
          <UiButton
            label={loading ? "Extendiendo…" : "Extender 1 hora"}
            onPress={() => void handleExtend()}
            disabled={loading}
            loading={loading}
            size="md"
          />
          <UiButton
            label="Ahora no"
            variant="ghost"
            onPress={() => setDismissedPrompt(true)}
            size="md"
          />
        </TacticalPanel>
      ) : null}

      <TacticalPanel tone="sunken" className="gap-2 p-3">
        <TacticalText size={12} tone="text">
          {remaining !== null && remaining > 0
            ? `Tiempo contratado: ${formatRemainingTime(remaining)} restantes (${hours} h total).`
            : `Horas contratadas: ${hours}.`}
        </TacticalText>
        <UiButton
          label="Extender servicio (+1 h)"
          variant="secondary"
          onPress={() => void handleExtend()}
          disabled={loading}
          loading={loading}
          size="md"
        />
        {error !== null ? (
          <TacticalText size={12} style={{ color: TACTICAL_COLORS.danger }}>
            {error}
          </TacticalText>
        ) : null}
      </TacticalPanel>
    </View>
  );
}
