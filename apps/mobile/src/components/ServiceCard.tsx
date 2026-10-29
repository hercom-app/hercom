import { memo, useRef, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Doc, Id } from "@proyecto/backend/dataModel";
import { PassengerBanner } from "./PassengerBanner";
import { SlideToConfirm } from "./SlideToConfirm";
import { TripSecurityPin } from "./uber/TripSecurityPin";
import { DrawerIcon } from "./DrawerIcons";
import {
  ErrorText,
  PillButton,
  RoundAction,
  SoftGroup,
  StatusPill,
} from "./driver/driverUi";
import { toPeopleAddress } from "../lib/googleGeocoding";
import { hasReliableCoordinates, openWazeNavigation } from "../lib/wazeNavigation";
import { useAppTheme } from "../contexts/ThemeContext";
import { HERCOM_COLORS, POPPINS, TABULAR } from "../constants/theme";

const CLIENT_ADVANCE_RATE = 0.25;

const HEADLINES: Partial<Record<Doc<"services">["status"], string>> = {
  assigned: "Viaje confirmado",
  heading_to_pickup: "Ve al punto de recojo",
  arrived_pickup: "Estás en el punto de recojo",
  in_progress: "Viaje en curso",
  en_route: "Viaje en curso",
  arrived_destination: "Llegaste al destino",
};

type Props = {
  service: Doc<"services">;
  onOpenChecklist?: (serviceId: Id<"services">) => void;
  onOpenLiveMap?: (serviceId: Id<"services">) => void;
};

function soles(amount: number): string {
  return Number.isInteger(amount) ? `S/ ${amount}` : `S/ ${amount.toFixed(2)}`;
}

/** Contenido del viaje activo del chofer dentro de la hoja inferior del mapa. */
export const ServiceCard = memo(function ServiceCard({
  service,
  onOpenChecklist,
  onOpenLiveMap,
}: Props) {
  const { colors } = useAppTheme();
  const [securityCodeInput, setSecurityCodeInput] = useState("");
  const [tripStarting, setTripStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [advanceConfirming, setAdvanceConfirming] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [slideResetCounter, setSlideResetCounter] = useState(0);

  const updateStatus = useMutation(api.services.updateStatus);
  const confirmAdvanceReceived = useMutation(api.services.confirmAdvanceReceived);
  const startTripWithCode = useMutation(api.services.startTripWithCode);
  const arriveAtCurrentStop = useMutation(api.services.arriveAtCurrentStop);
  const pickupChecklist = useQuery(api.serviceChecklists.getForMyService, {
    serviceId: service._id,
  });

  const securityCodeDigits = securityCodeInput.replace(/\D/g, "").slice(0, 4);
  const canStartTrip = securityCodeDigits.length === 4;
  const checklistComplete =
    pickupChecklist !== null &&
    pickupChecklist !== undefined &&
    pickupChecklist.hasPropertyCard &&
    pickupChecklist.hasSoat &&
    pickupChecklist.hasTechnicalInspection === true &&
    (!pickupChecklist.hasVehicleDamage ||
      (pickupChecklist.damageNotes ?? "").trim().length > 0);

  const price = service.offeredPrice ?? service.totalPrice;
  const advanceAmount =
    service.advanceAmount ??
    (service.offeredPrice !== undefined
      ? Math.round(service.offeredPrice * CLIENT_ADVANCE_RATE * 100) / 100
      : 0);
  const advanceConfirmed = service.advanceConfirmedAt !== undefined;
  const serviceStops = [service.destination, ...(service.extraDestinations ?? [])];
  const currentStopIndex = service.currentStopIndex ?? 0;
  const currentStop = serviceStops[Math.min(currentStopIndex, serviceStops.length - 1)]!;
  const firstNavigationStop = serviceStops[0]!;
  const totalStops = serviceStops.length;
  const isRunning = service.status === "in_progress" || service.status === "en_route";
  const beforePickup =
    service.status === "assigned" ||
    service.status === "heading_to_pickup" ||
    service.status === "arrived_pickup";
  const canShowLive = service.status !== "assigned" && service.status !== "pending";
  const navigationTarget =
    service.status === "heading_to_pickup" || service.status === "assigned"
      ? service.origin
      : isRunning
        ? currentStop
        : null;

  const subtitle =
    service.status === "assigned"
      ? advanceConfirmed
        ? "Anticipo recibido. Ya puedes salir."
        : `Cobra el anticipo de ${soles(advanceAmount)} antes de salir.`
      : service.status === "heading_to_pickup"
        ? "Confirma al llegar al punto de recojo."
        : service.status === "arrived_pickup"
          ? "Completa los pasos para iniciar el viaje."
          : isRunning
            ? `Parada ${currentStopIndex + 1} de ${totalStops}`
            : service.status === "arrived_destination"
              ? "Confirma el cierre del servicio."
              : "";

  async function run(action: () => Promise<unknown>, fallback: string) {
    setActionError(null);
    setBusyAction(true);
    try {
      await action();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : fallback);
    } finally {
      setBusyAction(false);
    }
  }

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

  async function handleSlideStartTrip() {
    if (!canStartTrip || !checklistComplete) {
      setActionError(
        checklistComplete
          ? "Ingresa el código de seguridad del cliente."
          : "Completa el checklist antes de iniciar.",
      );
      setSlideResetCounter((prev) => prev + 1);
      return;
    }
    setActionError(null);
    setTripStarting(true);
    try {
      await startTripWithCode({ serviceId: service._id, code: securityCodeDigits });
      await openWazeNavigation(firstNavigationStop);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo iniciar el viaje.");
      setSlideResetCounter((prev) => prev + 1);
    } finally {
      setTripStarting(false);
    }
  }

  async function handleSlideFinish() {
    setActionError(null);
    setFinishing(true);
    try {
      await updateStatus({ serviceId: service._id, status: "finished" });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo finalizar el viaje.");
      setSlideResetCounter((prev) => prev + 1);
    } finally {
      setFinishing(false);
    }
  }

  return (
    <View style={{ paddingTop: 4, paddingBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: POPPINS.bold, fontSize: 24, lineHeight: 30, color: colors.textStrong }}>
            {HEADLINES[service.status] ?? "Servicio"}
          </Text>
          {subtitle !== "" && (
            <Text style={{ marginTop: 2, fontFamily: POPPINS.regular, fontSize: 15, color: colors.text }}>
              {subtitle}
            </Text>
          )}
        </View>
        <Text style={{ fontFamily: POPPINS.bold, fontSize: 24, color: colors.textStrong, ...TABULAR }}>
          {soles(price)}
        </Text>
      </View>

      <PassengerBanner
        forSelf={service.forSelf}
        passengerName={service.passengerName}
        passengerPhone={service.passengerPhone}
      />

      <RouteStops
        origin={toPeopleAddress(service.origin.address)}
        stops={serviceStops.map((stop) => toPeopleAddress(stop.address))}
        activeIndex={isRunning ? currentStopIndex + 1 : beforePickup ? 0 : -1}
      />

      {(navigationTarget !== null || (canShowLive && onOpenLiveMap !== undefined)) && (
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 16 }}>
          {navigationTarget !== null && (
            <RoundAction
              icon="navigate"
              label="Waze"
              onPress={() => void openWazeNavigation(navigationTarget)}
            />
          )}
          {canShowLive && onOpenLiveMap !== undefined && (
            <RoundAction
              icon="share"
              label="En vivo"
              onPress={() => onOpenLiveMap(service._id)}
            />
          )}
        </View>
      )}

      {beforePickup &&
        (service.securityCode !== undefined ? (
          service.status !== "arrived_pickup" && (
            <TripSecurityPin
              pin={service.securityCode}
              title="Código del viaje · el cliente lo verá en su app"
              inset={false}
              style={{ marginBottom: 16 }}
            />
          )
        ) : (
          <SoftGroup style={{ paddingVertical: 14, marginBottom: 16 }}>
            <Text style={{ fontFamily: POPPINS.regular, fontSize: 15, color: colors.text }}>
              Este servicio no tiene código de inicio. Revisa el aviso «Viaje confirmado» o
              escribe a soporte.
            </Text>
          </SoftGroup>
        ))}

      {service.status === "assigned" && (
        <View style={{ gap: 12 }}>
          <SoftGroup
            style={{
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text style={{ fontFamily: POPPINS.medium, fontSize: 16, color: colors.textStrong }}>
                Anticipo (25%)
              </Text>
              <Text style={{ fontFamily: POPPINS.regular, fontSize: 14, color: colors.steel }}>
                El cliente te lo paga antes de salir
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text style={{ fontFamily: POPPINS.bold, fontSize: 20, color: colors.textStrong, ...TABULAR }}>
                {soles(advanceAmount)}
              </Text>
              {advanceConfirmed && <StatusPill label="Recibido" tone="success" />}
            </View>
          </SoftGroup>
          {!advanceConfirmed && (
            <PillButton
              label={`Recibí ${soles(advanceAmount)}`}
              tone="success"
              onPress={() => void handleConfirmAdvance()}
              loading={advanceConfirming}
            />
          )}
          <PillButton
            label="Salir a recoger"
            onPress={() =>
              void run(async () => {
                await updateStatus({ serviceId: service._id, status: "heading_to_pickup" });
                await openWazeNavigation(service.origin);
              }, "No se pudo avanzar.")
            }
            disabled={!advanceConfirmed}
            loading={busyAction}
          />
        </View>
      )}

      {service.status === "heading_to_pickup" && (
        <PillButton
          label="Llegué al punto de recojo"
          accessibilityLabel="Confirmar llegada al punto de partida"
          onPress={() =>
            void run(
              () => updateStatus({ serviceId: service._id, status: "arrived_pickup" }),
              "No se pudo avanzar.",
            )
          }
          loading={busyAction}
        />
      )}

      {service.status === "arrived_pickup" && (
        <View style={{ gap: 12 }}>
          <TouchableOpacity
            onPress={() => onOpenChecklist?.(service._id)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Abrir checklist de recojo"
          >
            <SoftGroup
              style={{ paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 14 }}
            >
              <StepBadge step={1} done={checklistComplete} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: POPPINS.medium, fontSize: 17, color: colors.textStrong }}>
                  Checklist del vehículo
                </Text>
                <Text style={{ fontFamily: POPPINS.regular, fontSize: 14, color: colors.steel }}>
                  Documentos, datos y abolladuras
                </Text>
              </View>
              <StatusPill
                label={checklistComplete ? "Listo" : "Pendiente"}
                tone={checklistComplete ? "success" : "warning"}
              />
              <DrawerIcon name="chevron" color={colors.textStrong} />
            </SoftGroup>
          </TouchableOpacity>

          <SoftGroup style={{ paddingVertical: 14, gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <StepBadge step={2} done={canStartTrip} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: POPPINS.medium, fontSize: 17, color: colors.textStrong }}>
                  Código del cliente
                </Text>
                <Text style={{ fontFamily: POPPINS.regular, fontSize: 14, color: colors.steel }}>
                  {service.securityCode !== undefined
                    ? "Míralo y escríbelo abajo para comparar"
                    : "Este servicio no tiene código de inicio."}
                </Text>
              </View>
            </View>
            {service.securityCode !== undefined && (
              <>
                <TripSecurityPin
                  pin={service.securityCode}
                  title="Código que debe decirte"
                  inset={false}
                  style={{ marginBottom: 0 }}
                />
                <Text
                  style={{
                    textAlign: "center",
                    fontFamily: POPPINS.medium,
                    fontSize: 13,
                    color: colors.steel,
                  }}
                >
                  Escríbelo aquí
                </Text>
                <CodeInput value={securityCodeDigits} onChange={setSecurityCodeInput} />
              </>
            )}
          </SoftGroup>

          <SlideToConfirm
            label={
              checklistComplete && canStartTrip
                ? "Desliza para iniciar viaje"
                : checklistComplete
                  ? "Ingresa el código"
                  : "Completa el checklist"
            }
            onSlideComplete={handleSlideStartTrip}
            disabled={!checklistComplete || !canStartTrip}
            loading={tripStarting}
            resetSignal={slideResetCounter}
          />
          <Text
            style={{ textAlign: "center", fontFamily: POPPINS.regular, fontSize: 13, color: colors.steel }}
          >
            {hasReliableCoordinates(firstNavigationStop)
              ? "Al iniciar se abrirá Waze hacia el primer destino."
              : "Al iniciar se abrirá Waze con la dirección escrita del destino."}
          </Text>
        </View>
      )}

      {isRunning && (
        <PillButton
          label={
            currentStopIndex < totalStops - 1
              ? `Llegué a la parada ${currentStopIndex + 1}`
              : "Llegué al destino final"
          }
          onPress={() =>
            void run(async () => {
              const result = await arriveAtCurrentStop({ serviceId: service._id });
              if (result.hasMoreStops) {
                await openWazeNavigation(result.navigationTarget);
              }
            }, "No se pudo registrar la parada.")
          }
          loading={busyAction}
        />
      )}

      {service.status === "arrived_destination" && (
        <SlideToConfirm
          label="Desliza para finalizar"
          onSlideComplete={handleSlideFinish}
          loading={finishing}
          resetSignal={slideResetCounter}
        />
      )}

      <ErrorText message={actionError} />
    </View>
  );
});

/** Recorrido origen → paradas con puntos (estilo apps de movilidad). */
function RouteStops({
  origin,
  stops,
  activeIndex,
}: {
  origin: string;
  stops: string[];
  /** 0 = origen, 1..n = paradas, -1 = ninguno. */
  activeIndex: number;
}) {
  const { colors, border } = useAppTheme();
  const points = [origin, ...stops];
  return (
    <View style={{ marginTop: 16, marginBottom: 16 }}>
      {points.map((address, index) => {
        const isOrigin = index === 0;
        const isLast = index === points.length - 1;
        const active = index === activeIndex;
        return (
          <View key={`${index}-${address}`} style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ alignItems: "center", width: 16 }}>
              <View
                style={{
                  marginTop: 5,
                  width: 12,
                  height: 12,
                  borderRadius: isOrigin ? 6 : 2,
                  backgroundColor: isOrigin ? HERCOM_COLORS.primary : colors.textStrong,
                }}
              />
              {!isLast && <View style={{ flex: 1, width: 2, marginVertical: 3, backgroundColor: border }} />}
            </View>
            <View style={{ flex: 1, paddingBottom: isLast ? 0 : 12 }}>
              <Text style={{ fontFamily: POPPINS.regular, fontSize: 13, color: colors.steel }}>
                {isOrigin ? "Recojo" : points.length > 2 ? `Parada ${index}` : "Destino"}
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  fontFamily: active ? POPPINS.semibold : POPPINS.regular,
                  fontSize: 16,
                  color: colors.textStrong,
                }}
              >
                {address}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function StepBadge({ step, done }: { step: number; done: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: done ? HERCOM_COLORS.success : colors.base,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: POPPINS.bold,
          fontSize: 15,
          color: done ? HERCOM_COLORS.white : colors.textStrong,
        }}
      >
        {done ? "✓" : step}
      </Text>
    </View>
  );
}

/** 4 casillas grandes; un TextInput invisible captura el teclado numérico. */
function CodeInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { colors } = useAppTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => inputRef.current?.focus()}
      style={{ flexDirection: "row", justifyContent: "center", gap: 10 }}
    >
      {[0, 1, 2, 3].map((index) => {
        const digit = value[index];
        const isCursor = focused && index === Math.min(value.length, 3);
        return (
          <View
            key={index}
            style={{
              flex: 1,
              maxWidth: 60,
              height: 60,
              borderRadius: 14,
              backgroundColor: colors.base,
              borderWidth: 2,
              borderColor: isCursor ? HERCOM_COLORS.primary : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: POPPINS.bold, fontSize: 26, color: colors.textStrong, ...TABULAR }}>
              {digit ?? ""}
            </Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, "").slice(0, 4))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={4}
        autoCorrect={false}
        autoComplete="off"
        textContentType="oneTimeCode"
        accessibilityLabel="Código del cliente, cuatro dígitos"
        caretHidden
        style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
      />
    </TouchableOpacity>
  );
}
