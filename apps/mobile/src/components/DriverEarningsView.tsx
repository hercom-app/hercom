import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";

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
        <ActivityIndicator color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <Text className="text-base font-semibold uppercase text-slate-500">
          Hoy
        </Text>
        <Text className="mt-1 text-3xl font-bold text-slate-900">
          {soles(earnings.today.net)}
        </Text>
        <Text className="mt-2 text-base text-slate-600">
          Ganado {soles(earnings.today.fare)} · Descuento app{" "}
          {soles(earnings.today.commission)}
        </Text>
        <Text className="mt-1 text-base text-slate-500">
          {earnings.today.trips.length}{" "}
          {earnings.today.trips.length === 1 ? "viaje" : "viajes"}
        </Text>
      </View>

      {earnings.today.trips.length === 0 ? (
        <Text className="mb-4 text-base text-slate-500">
          Aún no cierras viajes hoy.
        </Text>
      ) : (
        earnings.today.trips.map((trip) => (
          <View
            key={trip.serviceId}
            className="mb-3 rounded-2xl border border-slate-100 bg-white p-4"
          >
            <Text className="text-base font-semibold text-slate-900">
              {formatTime(trip.finishedAt)} · {trip.origin} → {trip.destination}
            </Text>
            <Text className="mt-2 text-lg font-bold text-slate-900">
              Ganaste {soles(trip.net)}
            </Text>
            <Text className="mt-1 text-base text-slate-600">
              Viaje {soles(trip.fare)} · Descuento {soles(trip.commission)}
            </Text>
          </View>
        ))
      )}

      <View className="mb-4 mt-2 rounded-2xl bg-white p-4 shadow-sm">
        <Text className="text-base font-semibold uppercase text-slate-500">
          Semana
        </Text>
        <Text className="mt-1 text-2xl font-bold text-slate-900">
          {soles(earnings.week.net)}
        </Text>
        <Text className="mt-1 text-base text-slate-600">
          {earnings.week.trips} viajes · Descuento{" "}
          {soles(earnings.week.commission)}
        </Text>
      </View>

      {earnings.week.days.map((day) => (
        <View
          key={day.dayKey}
          className="mb-2 flex-row items-center justify-between rounded-xl bg-white px-4 py-3"
        >
          <View>
            <Text className="text-base font-semibold text-slate-800">
              {formatDay(day.dayKey)}
            </Text>
            <Text className="text-base text-slate-500">
              {day.trips} {day.trips === 1 ? "viaje" : "viajes"}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-lg font-bold text-slate-900">
              {soles(day.net)}
            </Text>
            <Text className="text-base text-slate-500">
              Desc. {soles(day.commission)}
            </Text>
          </View>
        </View>
      ))}
      <View className="h-8" />
    </ScrollView>
  );
}
