import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { UiButton, UiInput } from "./ui";

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
    <View className="mt-3 rounded-2xl bg-slate-50 p-4">
      <Text className="mb-2 text-base font-bold text-slate-900">
        ¿Cómo estuvo el servicio?
      </Text>
      <Text className="mb-3 text-sm text-slate-500">
        Tu valoración queda en el perfil del chofer.
      </Text>
      <View className="mb-3 flex-row justify-between">
        {[1, 2, 3, 4, 5].map((value) => (
          <TouchableOpacity
            key={value}
            onPress={() => setScore(value)}
            className="h-12 w-12 items-center justify-center rounded-full bg-white"
          >
            <Text
              className={`text-2xl ${
                value <= score ? "text-amber-400" : "text-slate-300"
              }`}
            >
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <UiInput
        value={comment}
        onChangeText={setComment}
        placeholder="Comentario (opcional)"
        className="mb-3 min-h-[56px]"
        textAlignVertical="top"
        multiline
      />
      {error !== null && (
        <Text className="mb-2 text-sm font-medium text-red-600">{error}</Text>
      )}
      <UiButton
        label={submitting ? "Enviando..." : "Enviar valoración"}
        size="md"
        onPress={() => onSubmit(score, comment)}
        disabled={submitting || score < 1}
        loading={submitting}
      />
    </View>
  );
}
