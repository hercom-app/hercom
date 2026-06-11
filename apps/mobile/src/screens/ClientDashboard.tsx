import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@proyecto/backend";
import type { Doc } from "@proyecto/backend/dataModel";

const STATUS_LABELS: Record<Doc<"services">["status"], string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  en_route: "En camino",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

function ClientServiceCard({ service }: { service: Doc<"services"> }) {
  const cancelService = useMutation(api.services.cancelService);
  const [cancelling, setCancelling] = useState(false);

  const canCancel =
    service.status === "pending" ||
    service.status === "assigned" ||
    service.status === "en_route";

  async function handleCancel() {
    setCancelling(true);
    try {
      await cancelService({ serviceId: service._id });
    } finally {
      setCancelling(false);
    }
  }

  return (
    <View className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase text-hercom">
          {STATUS_LABELS[service.status]}
        </Text>
        <Text className="text-sm font-bold text-slate-900">
          ${service.totalPrice.toFixed(2)}
        </Text>
      </View>
      <Text className="text-sm text-slate-700">
        {service.origin.address} → {service.destination.address}
      </Text>
      {canCancel && (
        <TouchableOpacity
          onPress={() => void handleCancel()}
          disabled={cancelling}
          className="mt-3 rounded-xl border border-red-200 py-2 disabled:opacity-60"
        >
          <Text className="text-center text-sm font-semibold text-red-600">
            {cancelling ? "Cancelando..." : "Cancelar solicitud"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Panel cliente: solicitar chofer y ver mis servicios (app móvil). */
export function ClientDashboard() {
  const { signOut } = useAuthActions();
  const services = useQuery(api.services.listForClient, {});
  const createService = useMutation(api.services.createService);

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const price = Number(totalPrice);
    if (origin.trim() === "" || destination.trim() === "" || price <= 0) {
      setError("Completa origen, destino y un precio válido.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await createService({
        origin: { address: origin.trim(), lat: 0, lng: 0 },
        destination: { address: destination.trim(), lat: 0, lng: 0 },
        totalPrice: price,
        ...(notes.trim() !== "" ? { notes: notes.trim() } : {}),
      });
      setOrigin("");
      setDestination("");
      setTotalPrice("");
      setNotes("");
      setMessage("Solicitud enviada. Te asignaremos un chofer pronto.");
    } catch {
      setError("No se pudo crear la solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-100"
      contentContainerClassName="px-4 pb-8 pt-4"
      keyboardShouldPersistTaps="handled"
    >
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-slate-900">Hercom</Text>
          <Text className="text-sm text-slate-500">
            Cliente · solicita un chofer
          </Text>
        </View>
        <TouchableOpacity onPress={() => void signOut()}>
          <Text className="text-sm font-semibold text-slate-500">Salir</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
        <Text className="mb-1 text-lg font-bold text-slate-900">
          Solicitar un chofer
        </Text>
        <Text className="mb-4 text-sm text-slate-500">
          Indica origen, destino y precio acordado.
        </Text>

        <View className="gap-3">
          <TextInput
            value={origin}
            onChangeText={setOrigin}
            placeholder="Dirección de origen"
            placeholderTextColor="#94A3B8"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
          />
          <TextInput
            value={destination}
            onChangeText={setDestination}
            placeholder="Dirección de destino"
            placeholderTextColor="#94A3B8"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
          />
          <TextInput
            value={totalPrice}
            onChangeText={setTotalPrice}
            placeholder="Precio acordado"
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
          />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notas (opcional)"
            placeholderTextColor="#94A3B8"
            multiline
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
          />
          <TouchableOpacity
            onPress={() => void handleSubmit()}
            disabled={submitting}
            className="items-center rounded-2xl bg-hercom py-3.5 active:opacity-90 disabled:opacity-60"
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-base font-bold uppercase tracking-wide text-white">
                Solicitar servicio
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {message !== null && (
          <Text className="mt-3 text-center text-sm text-green-700">
            {message}
          </Text>
        )}
        {error !== null && (
          <Text className="mt-3 text-center text-sm text-red-600">{error}</Text>
        )}
      </View>

      <Text className="mb-3 text-lg font-bold text-slate-900">Mis servicios</Text>

      {services === undefined ? (
        <ActivityIndicator color="#007AFF" />
      ) : services.length === 0 ? (
        <Text className="text-center text-sm text-slate-500">
          Aún no tienes solicitudes.
        </Text>
      ) : (
        services.map((service) => (
          <ClientServiceCard key={service._id} service={service} />
        ))
      )}
    </ScrollView>
  );
}
