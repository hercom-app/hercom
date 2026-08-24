import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

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
    <View className="mt-3 rounded-2xl bg-surface-muted p-4">
      <Text className="mb-2 text-lg font-bold text-slate-900">
        ¿Cómo estuvo el servicio?
      </Text>
      <Text className="mb-3 text-base text-slate-600">
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
                value <= score ? "text-hercom" : "text-slate-300"
              }`}
            >
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Comentario (opcional)"
        className="mb-3 min-h-[56px] rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900"
        textAlignVertical="top"
        multiline
      />
      {error !== null && (
        <Text className="mb-2 text-base font-medium text-red-600">{error}</Text>
      )}
      <TouchableOpacity
        onPress={() => onSubmit(score, comment)}
        disabled={submitting || score < 1}
        className="rounded-2xl bg-hercom py-3 disabled:opacity-50"
      >
        <Text className="text-center text-lg font-bold text-white">
          {submitting ? "Enviando..." : "Enviar valoración"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
