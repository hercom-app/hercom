import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import {
  TacticalButton,
  TacticalInput,
  TacticalLabel,
  TacticalPanel,
  TacticalText,
} from "./tactical";
import {
  MONO,
  TACTICAL_BORDER,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";

type RateServiceStarsProps = {
  submitting: boolean;
  error: string | null;
  onSubmit: (score: number, comment: string) => void;
};

export function RateServiceStars({
  submitting,
  error,
  onSubmit,
}: RateServiceStarsProps) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <TacticalPanel tone="sunken" className="mt-3">
      <TacticalLabel tone="accent">¿Cómo estuvo el servicio?</TacticalLabel>
      <TacticalText size={11} className="mb-3 mt-1">
        Tu valoración queda en el perfil del chofer.
      </TacticalText>

      <View className="mb-3 flex-row justify-between">
        {[1, 2, 3, 4, 5].map((value) => {
          const filled = value <= score;
          return (
            <TouchableOpacity
              key={value}
              onPress={() => setScore(value)}
              activeOpacity={0.75}
              accessibilityLabel={`Valorar con ${value}`}
              className="h-12 w-12 items-center justify-center"
              style={{
                backgroundColor: filled
                  ? "rgba(251, 191, 36, 0.12)"
                  : TACTICAL_COLORS.surface,
                borderRadius: TACTICAL_RADIUS.sharp,
                borderWidth: 1,
                borderColor: filled ? TACTICAL_COLORS.warning : TACTICAL_BORDER,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  color: filled
                    ? TACTICAL_COLORS.warning
                    : TACTICAL_COLORS.steel,
                }}
              >
                ★
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TacticalInput
        value={comment}
        onChangeText={setComment}
        placeholder="Comentario (opcional)"
        containerClassName="mb-3"
        style={{ minHeight: 56 }}
        textAlignVertical="top"
        multiline
      />

      {error !== null && (
        <Text
          className="mb-2 text-xs"
          style={{ fontFamily: MONO.medium, color: TACTICAL_COLORS.danger }}
        >
          {error}
        </Text>
      )}

      <TacticalButton
        label={submitting ? "Enviando..." : "Enviar valoración"}
        size="md"
        onPress={() => onSubmit(score, comment)}
        disabled={submitting || score < 1}
        loading={submitting}
      />
    </TacticalPanel>
  );
}
