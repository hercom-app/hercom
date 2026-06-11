import { Text, TouchableOpacity, View } from "react-native";
import { useAuthActions } from "@convex-dev/auth/react";

type DriverApplicationPendingScreenProps = {
  dni?: string;
  fullName?: string;
};

/** Pantalla mientras la solicitud de chofer está en revisión. */
export function DriverApplicationPendingScreen({
  dni,
  fullName,
}: DriverApplicationPendingScreenProps) {
  const { signOut } = useAuthActions();

  return (
    <View className="flex-1 items-center justify-center bg-slate-100 px-6">
      <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-lg">
        <Text className="mb-2 text-center text-xl font-bold text-slate-900">
          Solicitud enviada
        </Text>
        <Text className="mb-4 text-center text-sm text-slate-600">
          Tu registro como chofer está en revisión. Te avisaremos cuando sea
          aprobado.
        </Text>
        {fullName !== undefined && (
          <Text className="text-center text-sm text-slate-700">{fullName}</Text>
        )}
        {dni !== undefined && (
          <Text className="mt-1 text-center text-sm text-slate-500">
            DNI: {dni}
          </Text>
        )}
        <TouchableOpacity
          onPress={() => void signOut()}
          className="mt-6 rounded-2xl border border-slate-200 py-3"
        >
          <Text className="text-center text-sm font-semibold text-slate-600">
            Cerrar sesión
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
