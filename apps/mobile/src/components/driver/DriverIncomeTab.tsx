import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@proyecto/backend";
import { DrawerIcon } from "../DrawerIcons";
import { DriverWalletTopUpView } from "../wallet/DriverWalletTopUpView";
import { WalletScreenTransition } from "../wallet/WalletScreenTransition";
import { useAppTheme } from "../../contexts/ThemeContext";
import { HERCOM_COLORS, POPPINS, TABULAR, UBER_RADIUS } from "../../constants/theme";

export type WalletFlow = "balance" | "topup";

type Money = FunctionReturnType<typeof api.driverMoney.getMine>;
type MoneyDay = Money["days"][number];
type MovementFilter = "todos" | "ingresos" | "recargas";

type DriverIncomeTabProps = {
  walletFlow: WalletFlow;
  onWalletFlowChange: (flow: WalletFlow) => void;
  /** Día abierto en detalle (`YYYY-MM-DD`) o `null` para el resumen. */
  dayKey: string | null;
  onDayChange: (dayKey: string | null) => void;
};

function soles(amount: number): string {
  return Number.isInteger(amount) ? `S/ ${amount}` : `S/ ${amount.toFixed(2)}`;
}

function tripsLabel(count: number): string {
  return `${count} ${count === 1 ? "viaje" : "viajes"}`;
}

function dayDate(dayKey: string): Date {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12));
}

function formatDayLong(dayKey: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
  }).format(dayDate(dayKey));
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

/** Pestaña Dinero: neto del día, barras por día, recarga y movimientos. */
export function DriverIncomeTab({
  walletFlow,
  onWalletFlowChange,
  dayKey,
  onDayChange,
}: DriverIncomeTabProps) {
  const { colors } = useAppTheme();
  const money = useQuery(api.driverMoney.getMine);

  if (walletFlow === "topup") {
    return (
      <WalletScreenTransition screenKey="topup">
        <DriverWalletTopUpView
          onBack={() => onWalletFlowChange("balance")}
          onTopUpComplete={() => onWalletFlowChange("balance")}
        />
      </WalletScreenTransition>
    );
  }

  if (money === undefined) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.base }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (dayKey !== null) {
    return (
      <MoneyDayView
        money={money}
        dayKey={dayKey}
        onDayChange={onDayChange}
        onBack={() => onDayChange(null)}
      />
    );
  }

  return (
    <MoneySummary
      money={money}
      onOpenDay={onDayChange}
      onRecargar={() => onWalletFlowChange("topup")}
    />
  );
}

function MoneySummary({
  money,
  onOpenDay,
  onRecargar,
}: {
  money: Money;
  onOpenDay: (dayKey: string) => void;
  onRecargar: () => void;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<MovementFilter>("todos");
  const today = money.days[money.days.length - 1];
  const movements = money.movements.filter((movement) =>
    filter === "todos"
      ? true
      : filter === "ingresos"
        ? movement.kind === "trip"
        : movement.kind === "top_up",
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.base }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={{
          paddingHorizontal: 20,
          fontFamily: POPPINS.bold,
          fontSize: 30,
          color: colors.textStrong,
        }}
      >
        Dinero
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 20,
        }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={0.7}
          onPress={() => onOpenDay(money.todayKey)}
          accessibilityLabel={`Hoy ganaste ${soles(today?.net ?? 0)} neto`}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ fontFamily: POPPINS.bold, fontSize: 40, color: colors.textStrong, ...TABULAR }}
          >
            {soles(today?.net ?? 0)}
          </Text>
          <Text style={{ fontFamily: POPPINS.medium, fontSize: 15, color: colors.text }}>
            {`Hoy · ${tripsLabel(today?.trips ?? 0)}`}
          </Text>
        </TouchableOpacity>
        <DayBars
          days={money.days}
          selectedKey={money.todayKey}
          onSelect={onOpenDay}
          barWidth={16}
          maxHeight={52}
        />
      </View>

      <TouchableOpacity
        onPress={onRecargar}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Recargar viajes prepagados"
        style={{
          marginHorizontal: 16,
          padding: 16,
          borderRadius: UBER_RADIUS.card,
          backgroundColor: colors.surfaceSunken,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: HERCOM_COLORS.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: POPPINS.bold, fontSize: 26, color: HERCOM_COLORS.white, marginTop: -2 }}>
            +
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: POPPINS.semibold, fontSize: 18, color: colors.textStrong }}>
            Recargar
          </Text>
          <Text style={{ fontFamily: POPPINS.regular, fontSize: 14, color: colors.steel }}>
            {money.tripCredits > 0
              ? `Te quedan ${money.tripCredits} ${money.tripCredits === 1 ? "viaje prepagado" : "viajes prepagados"}`
              : "No tienes viajes prepagados"}
          </Text>
        </View>
        <DrawerIcon name="chevron" color={colors.textStrong} />
      </TouchableOpacity>

      <Text
        style={{
          paddingHorizontal: 20,
          marginTop: 24,
          marginBottom: 10,
          fontFamily: POPPINS.bold,
          fontSize: 20,
          color: colors.textStrong,
        }}
      >
        Movimientos
      </Text>
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 6 }}>
        {(
          [
            ["todos", "Todos"],
            ["ingresos", "Ingresos"],
            ["recargas", "Recargas"],
          ] as const
        ).map(([key, label]) => (
          <Chip key={key} label={label} selected={filter === key} onPress={() => setFilter(key)} />
        ))}
      </View>

      {movements.length === 0 ? (
        <Text
          style={{
            paddingHorizontal: 20,
            paddingTop: 24,
            textAlign: "center",
            fontFamily: POPPINS.regular,
            fontSize: 15,
            color: colors.steel,
          }}
        >
          Aún no tienes movimientos.
        </Text>
      ) : (
        movements.map((movement) => (
          <MovementRow
            key={movement.id}
            kind={movement.kind}
            title={movement.title}
            subtitle={movement.subtitle}
            meta={formatDateTime(movement.at)}
            amount={movement.amount}
            onPress={movement.kind === "trip" ? () => onOpenDay(movement.dayKey) : undefined}
          />
        ))
      )}
    </ScrollView>
  );
}

function MoneyDayView({
  money,
  dayKey,
  onDayChange,
  onBack,
}: {
  money: Money;
  dayKey: string;
  onDayChange: (dayKey: string) => void;
  onBack: () => void;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const day: MoneyDay =
    money.days.find((item) => item.dayKey === dayKey) ?? {
      dayKey,
      at: 0,
      trips: 0,
      gross: 0,
      commission: 0,
      net: 0,
    };
  const trips = money.trips.filter((trip) => trip.dayKey === dayKey);
  const topUps = money.topUps.filter((topUp) => topUp.dayKey === dayKey);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.base }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity
        onPress={onBack}
        accessibilityLabel="Volver a Dinero"
        style={{
          marginLeft: 8,
          width: 48,
          height: 48,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ rotate: "180deg" }],
        }}
      >
        <DrawerIcon name="chevron" color={colors.textStrong} size={26} />
      </TouchableOpacity>

      <View style={{ alignItems: "center", paddingHorizontal: 20, marginTop: 4 }}>
        <Text style={{ fontFamily: POPPINS.medium, fontSize: 16, color: colors.text }}>
          {`${formatDayLong(dayKey)} · ${tripsLabel(day.trips)}`}
        </Text>
        <Text
          style={{ fontFamily: POPPINS.bold, fontSize: 44, color: colors.textStrong, ...TABULAR }}
        >
          {soles(day.net)}
        </Text>
      </View>

      <View style={{ alignItems: "center", marginTop: 16, marginBottom: 20 }}>
        <DayBars
          days={money.days}
          selectedKey={dayKey}
          onSelect={onDayChange}
          barWidth={36}
          maxHeight={110}
          showValues
        />
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16 }}>
        <Chip label={`Bruto · ${soles(day.gross)}`} />
        <Chip label={`Comisión Hercom · −${soles(day.commission)}`} />
      </View>

      <Text
        style={{
          paddingHorizontal: 20,
          marginTop: 24,
          marginBottom: 4,
          fontFamily: POPPINS.bold,
          fontSize: 20,
          color: colors.textStrong,
        }}
      >
        {formatDayLong(dayKey)}
      </Text>

      {trips.length === 0 && topUps.length === 0 ? (
        <Text
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            fontFamily: POPPINS.regular,
            fontSize: 15,
            color: colors.steel,
          }}
        >
          Sin viajes este día.
        </Text>
      ) : null}

      {trips.map((trip) => (
        <MovementRow
          key={trip.serviceId}
          kind="trip"
          title={formatTime(trip.finishedAt)}
          subtitle={`Viaje desde ${trip.origin}`}
          meta={`Comisión Hercom −${soles(trip.commission)} · Neto ${soles(trip.net)}`}
          amount={trip.gross}
        />
      ))}
      {topUps.map((topUp) => (
        <MovementRow
          key={topUp.id}
          kind="top_up"
          title={formatTime(topUp.createdAt)}
          subtitle={`Recarga · ${topUp.trips} ${topUp.trips === 1 ? "viaje prepagado" : "viajes prepagados"}`}
          amount={topUp.pricePen}
        />
      ))}
    </ScrollView>
  );
}

function DayBars({
  days,
  selectedKey,
  onSelect,
  barWidth,
  maxHeight,
  showValues = false,
}: {
  days: MoneyDay[];
  selectedKey: string;
  onSelect: (dayKey: string) => void;
  barWidth: number;
  maxHeight: number;
  showValues?: boolean;
}) {
  const { colors } = useAppTheme();
  const peak = Math.max(...days.map((day) => day.net), 0);

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: showValues ? 8 : 5 }}>
      {days.map((day) => {
        const selected = day.dayKey === selectedKey;
        const barHeight = peak > 0 ? Math.max(4, (day.net / peak) * maxHeight) : 4;
        return (
          <TouchableOpacity
            key={day.dayKey}
            onPress={() => onSelect(day.dayKey)}
            activeOpacity={0.7}
            accessibilityLabel={`${formatDayLong(day.dayKey)}: ${soles(day.net)}`}
            style={{ alignItems: "center" }}
            hitSlop={{ top: 12, bottom: 4, left: 2, right: 2 }}
          >
            {showValues && day.net > 0 && (
              <Text
                style={{ fontFamily: POPPINS.medium, fontSize: 11, color: colors.steel, marginBottom: 3 }}
              >
                {Number.isInteger(day.net) ? day.net : day.net.toFixed(1)}
              </Text>
            )}
            <View
              style={{
                width: barWidth,
                height: barHeight,
                borderRadius: 6,
                backgroundColor: selected ? HERCOM_COLORS.primary : colors.steel,
                opacity: selected ? 1 : 0.28,
              }}
            />
            <Text
              style={{
                marginTop: 4,
                fontFamily: selected ? POPPINS.bold : POPPINS.medium,
                fontSize: 12,
                color: selected ? HERCOM_COLORS.primary : colors.steel,
              }}
            >
              {Number(day.dayKey.slice(8))}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={onPress === undefined}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: selected ? colors.textStrong : colors.surfaceSunken,
      }}
    >
      <Text
        style={{
          fontFamily: POPPINS.semibold,
          fontSize: 14,
          color: selected ? colors.base : colors.textStrong,
          ...TABULAR,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function MovementRow({
  kind,
  title,
  subtitle,
  meta,
  amount,
  onPress,
}: {
  kind: "trip" | "top_up";
  title: string;
  subtitle: string;
  meta?: string;
  amount: number;
  onPress?: () => void;
}) {
  const { colors, border } = useAppTheme();
  const isTrip = kind === "trip";
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={onPress === undefined}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: border,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: colors.surfaceSunken,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <DrawerIcon name={isTrip ? "car" : "wallet"} color={colors.textStrong} size={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: POPPINS.semibold, fontSize: 16, color: colors.textStrong }}>
          {title}
        </Text>
        <Text
          numberOfLines={2}
          style={{ fontFamily: POPPINS.regular, fontSize: 14, color: colors.text }}
        >
          {subtitle}
        </Text>
        {meta !== undefined && (
          <Text style={{ fontFamily: POPPINS.regular, fontSize: 13, color: colors.steel }}>
            {meta}
          </Text>
        )}
      </View>
      <Text
        style={{
          fontFamily: POPPINS.bold,
          fontSize: 16,
          color: isTrip ? colors.success : colors.textStrong,
          ...TABULAR,
        }}
      >
        {`${isTrip ? "+" : "−"}${soles(amount)}`}
      </Text>
    </TouchableOpacity>
  );
}
