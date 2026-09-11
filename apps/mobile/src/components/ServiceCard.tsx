import { memo, useState } from "react";
import { Text, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc, Id } from "@proyecto/backend/dataModel";
import { HelpFab } from "./HelpFab";
import { SlideToConfirm } from "./SlideToConfirm";
import {
  TacticalButton,
  TacticalInput,
  TacticalLabel,
  TacticalPanel,
  TacticalStatus,
  TacticalText,
  TacticalValue,
} from "./tactical";
import { formatServiceStopsLabel, openWazeNavigation } from "../lib/wazeNavigation";
import { MONO, TACTICAL_COLORS } from "../constants/theme";

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
  onOpenLiveMap?: (serviceId: Id<"services">) => void;
};

export const ServiceCard = memo(function ServiceCard({
  service,
  onOpenChecklist,
  onOpenLiveMap,
}: Props) {
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
  const canShowLive =
    service.status === "heading_to_pickup" ||
    service.status === "arrived_pickup" ||
    service.status === "in_progress" ||
    service.status === "en_route" ||
    service.status === "arrived_destination";

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

  const isRunning =
    service.status === "in_progress" || service.status === "en_route";

  return (
    <TacticalPanel corners active={isRunning} className="mb-3">
      <View className="mb-3 flex-row items-center justify-between gap-2">
        <TacticalStatus
          label={STATUS_LABELS[service.status]}
          tone={isRunning ? "active" : "idle"}
        />
        <TacticalValue size={14} tone="accent">
          {`S/${(service.offeredPrice ?? service.totalPrice).toFixed(2)}`}
        </TacticalValue>
      </View>

      {canShowLive ? (
        <View className="mb-3 items-end">
          <HelpFab
            fallbackCenter={{
              lat: service.origin.lat,
              lng: service.origin.lng,
            }}
          />
        </View>
      ) : null}

      <View className="mb-3">
        <View className="flex-row">
          <TacticalLabel size={9} className="w-16">
            Origen
          </TacticalLabel>
          <TacticalText size={12} tone="text" className="flex-1">
            {service.origin.address}
          </TacticalText>
        </View>
        <View className="mt-1.5 flex-row">
          <TacticalLabel size={9} className="w-16">
            {totalStops > 1 ? "Paradas" : "Destino"}
          </TacticalLabel>
          <TacticalText size={12} tone="text" className="flex-1">
            {formatServiceStopsLabel(
              service.destination,
              service.extraDestinations,
            )}
          </TacticalText>
        </View>
      </View>

      {isRunning && (
        <TacticalPanel tone="sunken" className="mb-3 p-2.5">
          <TacticalLabel size={9} tone="accent">
            {`Navegando ${currentStopIndex + 1} / ${totalStops}`}
          </TacticalLabel>
          <TacticalText size={12} tone="text" className="mt-1">
            {currentStop.address}
          </TacticalText>
        </TacticalPanel>
      )}

      {canShowLive && onOpenLiveMap !== undefined && (
        <View className="mb-3">
          <TacticalButton
            label="Ubicación en vivo"
            variant="secondary"
            size="md"
            onPress={() => onOpenLiveMap(service._id)}
          />
        </View>
      )}

      {service.securityCode !== undefined && service.status !== "finished" && (
        <View className="mb-3 flex-row items-center justify-between px-3 py-2.5"
          style={{
            backgroundColor: "rgba(161, 196, 253, 0.1)",
            borderLeftWidth: 2,
            borderLeftColor: TACTICAL_COLORS.accent,
          }}
        >
          <TacticalLabel size={9}>Código de seguridad</TacticalLabel>
          <TacticalValue size={15} tone="accent">
            {service.securityCode}
          </TacticalValue>
        </View>
      )}

      {service.status === "assigned" && (
        <View className="gap-2">
          <TacticalPanel tone="sunken" className="p-3">
            <View className="flex-row items-center justify-between">
              <TacticalLabel size={9}>Anticipo requerido</TacticalLabel>
              <TacticalValue size={14} tone="accent">
                {`S/${advanceAmount.toFixed(2)}`}
              </TacticalValue>
            </View>
            <TacticalText size={11} className="mt-1.5">
              El cliente debe pagarte antes de que salgas. Confirma cuando lo
              recibas.
            </TacticalText>
            {advanceConfirmed && (
              <View className="mt-2">
                <TacticalStatus label="Anticipo confirmado" tone="success" />
              </View>
            )}
          </TacticalPanel>

          {!advanceConfirmed && (
            <TacticalButton
              label={
                advanceConfirming ? "Confirmando..." : "Confirmo que lo recibí"
              }
              size="md"
              onPress={() => void handleConfirmAdvance()}
              disabled={advanceConfirming}
              loading={advanceConfirming}
            />
          )}

          <TacticalButton
            label="Salir a recoger"
            size="md"
            onPress={() => void handleHeadingToPickup()}
            disabled={!advanceConfirmed}
          />
        </View>
      )}

      {service.status === "heading_to_pickup" && (
        <TacticalButton
          label="Llegué al punto de partida"
          size="md"
          onPress={() => void handleArrivedPickup()}
        />
      )}

      {service.status === "arrived_pickup" && (
        <View className="gap-2">
          <TacticalButton
            label="Abrir checklist"
            variant="secondary"
            size="md"
            onPress={() => onOpenChecklist?.(service._id)}
          />

          <View className="items-center">
            <TacticalStatus
              label={checklistComplete ? "Checklist listo" : "Checklist pendiente"}
              tone={checklistComplete ? "success" : "warning"}
            />
          </View>

          <TacticalInput
            label="Código del cliente"
            mono
            value={securityCodeInput}
            onChangeText={setSecurityCodeInput}
            keyboardType="number-pad"
            placeholder="000000"
            maxLength={6}
            blurOnSubmit={false}
            autoCorrect={false}
            autoComplete="off"
          />
          <SlideToConfirm
            label="Desliza para iniciar viaje"
            onSlideComplete={handleSlideStartTrip}
            disabled={!checklistComplete}
            loading={tripStarting}
            resetSignal={slideResetCounter}
          />
        </View>
      )}

      {isRunning && (
        <View className="gap-2">
          <TacticalButton
            label={`Waze · parada ${currentStopIndex + 1}`}
            variant="secondary"
            size="md"
            onPress={() => void openWazeNavigation(currentStop)}
          />
          <TacticalButton
            label={
              currentStopIndex < totalStops - 1
                ? `Llegué a parada ${currentStopIndex + 1}`
                : "Llegué al destino final"
            }
            size="md"
            onPress={() => void handleArriveAtCurrentStop()}
          />
        </View>
      )}

      {service.status === "arrived_destination" && (
        <TacticalButton
          label="Finalizar viaje"
          size="md"
          onPress={() =>
            void updateStatus({ serviceId: service._id, status: "finished" })
          }
        />
      )}

      {actionError !== null && (
        <Text
          className="mt-2 text-xs"
          style={{ fontFamily: MONO.medium, color: TACTICAL_COLORS.danger }}
        >
          {actionError}
        </Text>
      )}
    </TacticalPanel>
  );
});
