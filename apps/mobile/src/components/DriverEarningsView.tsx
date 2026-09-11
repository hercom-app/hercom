import { ActivityIndicator, ScrollView, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { UiCard, UiEmpty } from "./ui";
import {
  TacticalLabel,
  TacticalText,
  TacticalValue,
} from "./tactical";
import {
  TACTICAL_BORDER,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";

function soles(amount: number): string {
  return `S/${amount.toFixed(2)}`;
}

function formatDay(dayKey: string): string {
  const [year, month, day] = dayKey.split("-");
  if (year === undefined || month === undefined || day === undefined) {
    return dayKey;
  }
  return `${day}/${month}/${year}`;
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

/** Ganancias del día (por viaje) e histórico de la semana. */
export function DriverEarningsView() {
  const earnings = useQuery(api.services.listEarningsForDriver, {});

  if (earnings === undefined) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={TACTICAL_COLORS.accent} />
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <UiCard className="mb-4">
        <TacticalLabel size={10} tone="accent">
          Hoy
        </TacticalLabel>
        <TacticalValue size={32} tone="accent" className="mt-1">
          {soles(earnings.today.net)}
        </TacticalValue>
        <TacticalText size={13} className="mt-2">
          Ganado {soles(earnings.today.fare)} · Descuento app{" "}
          {soles(earnings.today.commission)}
        </TacticalText>
        <TacticalText size={12} className="mt-1">
          {earnings.today.trips.length}{" "}
          {earnings.today.trips.length === 1 ? "viaje" : "viajes"}
        </TacticalText>
      </UiCard>

      {earnings.today.trips.length === 0 ? (
        <UiEmpty title="Aún no cierras viajes hoy." />
      ) : (
        earnings.today.trips.map((trip) => (
          <UiCard key={trip.serviceId} className="mb-3">
            <TacticalText size={13} tone="text">
              {formatTime(trip.finishedAt)} · {trip.origin} → {trip.destination}
            </TacticalText>
            <TacticalValue size={18} tone="accent" className="mt-2">
              Ganaste {soles(trip.net)}
            </TacticalValue>
            <TacticalText size={12} className="mt-1">
              Viaje {soles(trip.fare)} · Descuento {soles(trip.commission)}
            </TacticalText>
          </UiCard>
        ))
      )}

      <UiCard className="mb-4 mt-2">
        <TacticalLabel size={10} tone="accent">
          Semana
        </TacticalLabel>
        <TacticalValue size={26} tone="accent" className="mt-1">
          {soles(earnings.week.net)}
        </TacticalValue>
        <TacticalText size={13} className="mt-1">
          {earnings.week.trips} viajes · Descuento{" "}
          {soles(earnings.week.commission)}
        </TacticalText>
      </UiCard>

      {earnings.week.days.map((day) => (
        <View
          key={day.dayKey}
          className="mb-2 flex-row items-center justify-between px-4 py-3"
          style={{
            backgroundColor: TACTICAL_COLORS.surfaceSunken,
            borderRadius: TACTICAL_RADIUS.panel,
            borderWidth: 1,
            borderColor: TACTICAL_BORDER,
          }}
        >
          <View>
            <TacticalValue size={14}>{formatDay(day.dayKey)}</TacticalValue>
            <TacticalText size={12} className="mt-0.5">
              {day.trips} {day.trips === 1 ? "viaje" : "viajes"}
            </TacticalText>
          </View>
          <View className="items-end">
            <TacticalValue size={16} tone="accent">
              {soles(day.net)}
            </TacticalValue>
            <TacticalText size={12} className="mt-0.5">
              Desc. {soles(day.commission)}
            </TacticalText>
          </View>
        </View>
      ))}
      <View className="h-8" />
    </ScrollView>
  );
}
