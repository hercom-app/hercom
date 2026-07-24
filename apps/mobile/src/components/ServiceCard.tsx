import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc, Id } from "@proyecto/backend/dataModel";
import { SlideToConfirm } from "./SlideToConfirm";
import { formatServiceStopsLabel, openWazeNavigation } from "../lib/wazeNavigation";

const CLIENT_ADVANCE_RATE = 0.25;

const STATUS_LABELS: Record<Doc<"services">["status"], string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  heading_to_pickup: "Yendo a recoger",
  arrived_pickup: "Llegó al punto",
  in_progress: "En viaje",
  arrived_destination: "Llegó al destino",
  en_route: "En camino",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

type Props = {
  service: Doc<"services">;
  onOpenChecklist?: (serviceId: Id<"services">) => void;
};

export function ServiceCard({ service, onOpenChecklist }: Props) {
  const [securityCodeInput, setSecurityCodeInput] = useState("");
  const [tripStarting, setTripStarting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [advanceConfirming, setAdvanceConfirming] = useState(false);
  const [slideResetCounter, setSlideResetCounter] = useState(0);

  const updateStatus = useMutation(api.services.updateStatus);
  const confirmAdvanceReceived = useMutation(api.services.confirmAdvanceReceived);
  const startTripWithCode = useMutation(api.services.startTripWithCode);
  const arriveAtCurrentStop = useMutation(api.services.arriveAtCurrentStop);
  const pickupChecklist = useQuery(api.serviceChecklists.getForMyService, {
    serviceId: service._id,
  });

  const canStartTrip = securityCodeInput.trim().length > 0;
  const checklistComplete =
    pickupChecklist !== null &&
    pickupChecklist !== undefined &&
    pickupChecklist.hasPropertyCard &&
    pickupChecklist.hasSoat &&
    pickupChecklist.hasTechnicalInspection === true &&
    (!pickupChecklist.hasVehicleDamage ||
      (pickupChecklist.damageNotes ?? "").trim().length > 0);

  const advanceAmount =
    service.advanceAmount ??
    (service.offeredPrice !== undefined
      ? Math.round(service.offeredPrice * CLIENT_ADVANCE_RATE * 100) / 100
      : 0);
  const advanceConfirmed = service.advanceConfirmedAt !== undefined;
  const serviceStops = [
    service.destination,
    ...(service.extraDestinations ?? []),
  ];
  const currentStopIndex = service.currentStopIndex ?? 0;
  const currentStop = serviceStops[Math.min(currentStopIndex, serviceStops.length - 1)]!;
  const totalStops = serviceStops.length;

  async function handleConfirmAdvance() {
    setActionError(null);
    setAdvanceConfirming(true);
    try {
      await confirmAdvanceReceived({ serviceId: service._id });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "No se pudo confirmar el anticipo.",
      );
    } finally {
      setAdvanceConfirming(false);
    }
  }

  async function handleHeadingToPickup() {
    setActionError(null);
    try {
      await updateStatus({
        serviceId: service._id,
        status: "heading_to_pickup",
      });
      await openWazeNavigation(service.origin);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo avanzar.");
    }
  }

  async function handleArrivedPickup() {
    setActionError(null);
    try {
      await updateStatus({
        serviceId: service._id,
        status: "arrived_pickup",
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo avanzar.");
    }
  }

  async function handleSlideStartTrip() {
    if (!canStartTrip || !checklistComplete) {
      setActionError(
        checklistComplete
          ? "Ingresa el código de seguridad del cliente."
          : "Completá el checklist antes de iniciar.",
      );
      setSlideResetCounter((prev) => prev + 1);
      return;
    }
    setActionError(null);
    setTripStarting(true);
    try {
      await startTripWithCode({
        serviceId: service._id,
        code: securityCodeInput,
      });
      await openWazeNavigation(service.destination);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "No se pudo iniciar el viaje.",
      );
      setSlideResetCounter((prev) => prev + 1);
    } finally {
      setTripStarting(false);
    }
  }

  async function handleArriveAtCurrentStop() {
    setActionError(null);
    try {
      const result = await arriveAtCurrentStop({ serviceId: service._id });
      if (result.hasMoreStops) {
        await openWazeNavigation(result.navigationTarget);
      }
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "No se pudo registrar la parada.",
      );
    }
  }

  return (
    <View className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase text-brand">
          {STATUS_LABELS[service.status]}
        </Text>
        <Text className="text-sm font-bold text-slate-900">
          Comisión app S/{service.driverCommission.toFixed(2)}
        </Text>
      </View>

      <Text className="text-sm text-slate-700">
        Origen: {service.origin.address}
      </Text>
      <Text
        className={`text-sm text-slate-700 ${
          service.status === "in_progress" || service.status === "en_route"
            ? "mb-1"
            : "mb-3"
        }`}
      >
        {totalStops > 1 ? "Paradas:" : "Destino:"}{" "}
        {formatServiceStopsLabel(service.destination, service.extraDestinations)}
      </Text>
      {(service.status === "in_progress" || service.status === "en_route") && (
        <Text className="mb-3 text-xs font-semibold text-blue-700">
          Navegando parada {currentStopIndex + 1} de {totalStops}: {currentStop.address}
        </Text>
      )}

      {service.securityCode !== undefined && service.status !== "finished" && (
        <View className="mb-3 rounded-xl bg-indigo-50 p-3">
          <Text className="text-xs text-indigo-700">
            Código de seguridad:{" "}
            <Text className="font-bold text-indigo-900">{service.securityCode}</Text>
          </Text>
        </View>
      )}

      {service.status === "assigned" && (
        <View className="gap-2">
          <View className="rounded-xl bg-amber-50 p-3">
            <Text className="text-xs font-semibold text-amber-900">
              Anticipo requerido: S/{advanceAmount.toFixed(2)}
            </Text>
            <Text className="mt-1 text-xs text-amber-800">
              El cliente debe pagarte antes de que salgas. Confirma cuando lo
              recibas.
            </Text>
            {advanceConfirmed && (
              <Text className="mt-2 text-xs font-semibold text-emerald-700">
                ✓ Anticipo confirmado
              </Text>
            )}
          </View>

          {!advanceConfirmed && (
            <TouchableOpacity
              onPress={() => void handleConfirmAdvance()}
              disabled={advanceConfirming}
              className="rounded-xl bg-emerald-600 py-2 active:bg-emerald-700 disabled:opacity-60"
            >
              <Text className="text-center text-sm font-semibold text-white">
                {advanceConfirming
                  ? "Confirmando..."
                  : "Confirmo que recibí el anticipo"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => void handleHeadingToPickup()}
            disabled={!advanceConfirmed}
            className={`rounded-xl py-2 ${
              advanceConfirmed
                ? "bg-brand active:bg-brand-dark"
                : "bg-slate-300"
            }`}
          >
            <Text className="text-center text-sm font-semibold text-white">
              Salir a recoger
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {service.status === "heading_to_pickup" && (
        <TouchableOpacity
          onPress={() => void handleArrivedPickup()}
          className="rounded-xl bg-amber-600 py-2 active:bg-amber-700"
        >
          <Text className="text-center text-sm font-semibold text-white">
            Llegué al punto de partida
          </Text>
        </TouchableOpacity>
      )}

      {service.status === "arrived_pickup" && (
        <View className="gap-2">
          <TouchableOpacity
            onPress={() => onOpenChecklist?.(service._id)}
            className="rounded-xl bg-brand py-3 active:bg-brand-dark"
          >
            <Text className="text-center text-sm font-bold text-white">
              Abrir checklist
            </Text>
          </TouchableOpacity>

          {checklistComplete ? (
            <Text className="text-center text-xs font-semibold text-emerald-700">
              ✓ Checklist listo
            </Text>
          ) : (
            <Text className="text-center text-xs text-slate-500">
              Completá el checklist para poder iniciar
            </Text>
          )}

          <TextInput
            value={securityCodeInput}
            onChangeText={setSecurityCodeInput}
            keyboardType="number-pad"
            placeholder="Ingresa código del cliente"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            maxLength={6}
          />
          <SlideToConfirm
            label="Desliza para iniciar viaje"
            onSlideComplete={handleSlideStartTrip}
            disabled={!canStartTrip || !checklistComplete}
            loading={tripStarting}
            resetSignal={slideResetCounter}
          />
        </View>
      )}

      {(service.status === "in_progress" || service.status === "en_route") && (
        <View className="gap-2">
          <TouchableOpacity
            onPress={() => void openWazeNavigation(currentStop)}
            className="rounded-xl border border-blue-300 bg-blue-50 py-2"
          >
            <Text className="text-center text-sm font-semibold text-blue-800">
              Abrir Waze a parada {currentStopIndex + 1}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => void handleArriveAtCurrentStop()}
            className="rounded-xl bg-blue-600 py-2 active:bg-blue-700"
          >
            <Text className="text-center text-sm font-semibold text-white">
              {currentStopIndex < totalStops - 1
                ? `Llegué a parada ${currentStopIndex + 1} · ir a la siguiente`
                : "Llegué al destino final"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {service.status === "arrived_destination" && (
        <TouchableOpacity
          onPress={() =>
            void updateStatus({ serviceId: service._id, status: "finished" })
          }
          className="rounded-xl bg-green-600 py-2 active:bg-green-700"
        >
          <Text className="text-center text-sm font-semibold text-white">
            Finalizar viaje
          </Text>
        </TouchableOpacity>
      )}

      {actionError !== null && (
        <Text className="mt-2 text-xs font-semibold text-red-600">{actionError}</Text>
      )}
    </View>
  );
}
