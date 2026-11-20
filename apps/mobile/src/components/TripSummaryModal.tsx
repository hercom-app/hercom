import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import { DrawerIcon } from "./DrawerIcons";
import { SupportChatScreen } from "../screens/SupportChatScreen";
import { useAppTheme } from "../contexts/ThemeContext";
import { toPeopleAddress } from "../lib/googleGeocoding";
import { HERCOM_COLORS, POPPINS, TABULAR, UBER_RADIUS } from "../constants/theme";
import { TRIP_PAYMENT_LABELS } from "../lib/tripPaymentMethods";

type Summary = NonNullable<FunctionReturnType<typeof api.tripSummary.getForService>>;
type DriverSummary = Extract<Summary, { role: "driver" }>;
type ClientSummary = Extract<Summary, { role: "client" }>;

function pen(amount: number): string {
  return `PEN ${amount.toFixed(2)}`;
}

function percent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function formatStart(timestamp: number): string {
  const text = new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

function formatKm(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

/** Resumen tras calificar. Cliente y chofer ven datos distintos del mismo viaje. */
export function TripSummaryModal({
  serviceId,
  onClose,
}: {
  serviceId: Id<"services"> | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={serviceId !== null}
      animationType="slide"
      onRequestClose={onClose}
    >
      {serviceId !== null && <TripSummaryBody serviceId={serviceId} onClose={onClose} />}
    </Modal>
  );
}

function TripSummaryBody({
  serviceId,
  onClose,
}: {
  serviceId: Id<"services">;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const summary = useQuery(api.tripSummary.getForService, { serviceId });
  const [supportOpen, setSupportOpen] = useState(false);

  if (summary === undefined) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.base }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (summary === null) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.base }}>
        <Text style={{ fontFamily: POPPINS.medium, fontSize: 16, color: colors.text, textAlign: "center" }}>
          No encontramos el resumen de este viaje.
        </Text>
        <PrimaryButton label="Cerrar" onPress={onClose} />
      </View>
    );
  }

  if (supportOpen) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.base, paddingTop: insets.top }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 6 }}>
          <TouchableOpacity
            onPress={() => setSupportOpen(false)}
            accessibilityLabel="Volver al resumen"
            style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center", transform: [{ rotate: "180deg" }] }}
          >
            <DrawerIcon name="chevron" color={colors.textStrong} size={26} />
          </TouchableOpacity>
          <Text style={{ fontFamily: POPPINS.bold, fontSize: 20, color: colors.textStrong }}>
            {`Soporte · Servicio #${summary.serviceNumber}`}
          </Text>
        </View>
        <View style={{ flex: 1, paddingBottom: insets.bottom }}>
          <SupportChatScreen
            embedded
            initialDraft={`Hola, necesito ayuda con el servicio #${summary.serviceNumber} del ${formatStart(summary.startedAt)}.`}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 8 }}>
          <TouchableOpacity
            onPress={onClose}
            accessibilityLabel="Cerrar resumen"
            style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}
          >
            <DrawerIcon name="close" color={colors.textStrong} size={24} />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontFamily: POPPINS.semibold, fontSize: 15, color: colors.steel, textAlign: "right", paddingRight: 12 }}>
            {`Servicio #${summary.serviceNumber}`}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 4 }}>
          <Text style={{ fontFamily: POPPINS.medium, fontSize: 15, color: colors.steel }}>
            Inicio del servicio
          </Text>
          <Text style={{ fontFamily: POPPINS.bold, fontSize: 26, color: colors.textStrong }}>
            {formatStart(summary.startedAt)}
          </Text>
        </View>

        <RouteBlock origin={summary.origin} stops={summary.stops} />

        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 16 }}>
          <StatTile label="Duración" value={formatDuration(summary.durationMinutes)} />
          <StatTile
            label={summary.distanceEstimated ? "Distancia aprox." : "Distancia"}
            value={formatKm(summary.distanceKm)}
          />
        </View>

        <CounterpartRow
          name={summary.counterpartName}
          photoUrl={summary.counterpartPhotoUrl}
          roleLabel={summary.role === "driver" ? "Cliente" : "Chofer"}
          myScore={summary.myScore}
        />

        {summary.role === "driver" ? (
          <DriverMoney summary={summary} />
        ) : (
          <ClientMoney summary={summary} />
        )}

        <TouchableOpacity
          onPress={() => setSupportOpen(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Soporte para el servicio ${summary.serviceNumber}`}
          style={{
            marginHorizontal: 16,
            marginTop: 20,
            height: 52,
            borderRadius: UBER_RADIUS.button,
            backgroundColor: colors.surfaceSunken,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <DrawerIcon name="chat" color={colors.textStrong} size={20} />
          <Text style={{ fontFamily: POPPINS.semibold, fontSize: 17, color: colors.textStrong }}>
            Soporte
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 12) }}>
        <PrimaryButton label="Listo" onPress={onClose} />
      </View>
    </View>
  );
}

function RouteBlock({ origin, stops }: { origin: string; stops: string[] }) {
  const { colors } = useAppTheme();
  const points = [
    { key: "origin", label: "Recojo", address: origin, color: colors.success },
    ...stops.map((address, index) => ({
      key: `stop-${index}`,
      label: stops.length > 1 ? `Destino ${index + 1}` : "Destino",
      address,
      color: HERCOM_COLORS.primary,
    })),
  ];
  return (
    <View style={{ paddingHorizontal: 20, marginTop: 18, gap: 12 }}>
      {points.map((point, index) => (
        <View key={point.key} style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ alignItems: "center", width: 12 }}>
            <View style={{ width: 12, height: 12, borderRadius: index === 0 ? 6 : 2, marginTop: 5, backgroundColor: point.color }} />
            {index < points.length - 1 && (
              <View style={{ flex: 1, width: 2, marginTop: 4, marginBottom: -12, backgroundColor: colors.surfaceSunken }} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: POPPINS.medium, fontSize: 13, color: colors.steel }}>
              {point.label}
            </Text>
            <Text style={{ fontFamily: POPPINS.semibold, fontSize: 16, lineHeight: 22, color: colors.textStrong }}>
              {toPeopleAddress(point.address)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flex: 1, padding: 14, borderRadius: UBER_RADIUS.card, backgroundColor: colors.surfaceSunken }}>
      <Text style={{ fontFamily: POPPINS.medium, fontSize: 13, color: colors.steel }}>{label}</Text>
      <Text style={{ fontFamily: POPPINS.bold, fontSize: 20, color: colors.textStrong, ...TABULAR }}>{value}</Text>
    </View>
  );
}

function CounterpartRow({
  name,
  photoUrl,
  roleLabel,
  myScore,
}: {
  name: string;
  photoUrl: string | null;
  roleLabel: string;
  myScore: number | null;
}) {
  const { colors, border } = useAppTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginHorizontal: 16,
        marginTop: 20,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: border,
      }}
    >
      {photoUrl !== null && photoUrl !== "" ? (
        <Image source={{ uri: photoUrl }} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceSunken }} />
      ) : (
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceSunken, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: POPPINS.bold, fontSize: 22, color: HERCOM_COLORS.primary }}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: POPPINS.medium, fontSize: 13, color: colors.steel }}>{roleLabel}</Text>
        <Text style={{ fontFamily: POPPINS.semibold, fontSize: 18, color: colors.textStrong }}>{name}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontFamily: POPPINS.medium, fontSize: 12, color: colors.steel }}>Tu calificación</Text>
        {myScore !== null ? (
          <Text accessibilityLabel={`Calificaste con ${myScore} de 5`} style={{ fontSize: 18, letterSpacing: 1 }}>
            <Text style={{ color: HERCOM_COLORS.warning }}>{"★".repeat(myScore)}</Text>
            <Text style={{ color: colors.surfaceSunken }}>{"★".repeat(5 - myScore)}</Text>
          </Text>
        ) : (
          <Text style={{ fontFamily: POPPINS.medium, fontSize: 14, color: colors.steel }}>Pendiente</Text>
        )}
      </View>
    </View>
  );
}

function ClientMoney({ summary }: { summary: ClientSummary }) {
  return (
  <Section title="Pago del viaje">
      {summary.discount > 0 && (
        <>
          <MoneyRow label="Tarifa lista" value={pen(summary.initialCost)} />
          <MoneyRow
            label={`Descuento · ${summary.discountLabel ?? "Promoción"} (−${percent(summary.discountRate)})`}
            value={`−${pen(summary.discount)}`}
            tone="success"
          />
        </>
      )}
      <MoneyRow label="Total del servicio" value={pen(summary.serviceTotal)} strong />
      <MoneyRow label="Adelanto (25%)" value={`− ${pen(summary.advanceAmount)}`} />
      <TotalRow label="Saldo pagado al chofer" value={pen(summary.balanceDue)} />
    </Section>
  );
}

function DriverMoney({ summary }: { summary: DriverSummary }) {
  const { colors } = useAppTheme();
  return (
    <>
      <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
        <Text style={{ fontFamily: POPPINS.medium, fontSize: 15, color: colors.steel }}>Mis ingresos</Text>
        <Text style={{ fontFamily: POPPINS.bold, fontSize: 36, color: colors.textStrong, ...TABULAR }}>
          {pen(summary.net)}
        </Text>
      </View>

      <Section title="Recibí">
        <MoneyRow
          label="Tarifa"
          value={pen(summary.received)}
          note={
            summary.received < summary.offer
              ? `Tu oferta ${pen(summary.offer)} con −${percent(summary.clientDiscountRate)} de promoción para el cliente`
              : undefined
          }
        />
        <MoneyRow
          label="Método de pago"
          value={
            summary.paymentMethod !== null
              ? TRIP_PAYMENT_LABELS[summary.paymentMethod]
              : "Sin registrar"
          }
        />
      </Section>

      <Section title="Comisión">
        <MoneyRow label={`Comisión Hercom (${percent(summary.commissionRate)})`} value={pen(summary.fullCommission)} />
        {summary.commissionPromo > 0 && (
          <MoneyRow
            label={`Descuento por promoción · ${summary.commissionPromoLabel ?? "Promoción"}`}
            value={`−${pen(summary.commissionPromo)}`}
            tone="success"
          />
        )}
        <MoneyRow label="Comisión cobrada" value={`−${pen(summary.commission)}`} strong />
      </Section>

      <View style={{ marginHorizontal: 16 }}>
        <TotalRow label="Ingreso neto" value={pen(summary.net)} />
      </View>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ marginHorizontal: 16, marginTop: 20 }}>
      <Text style={{ fontFamily: POPPINS.bold, fontSize: 18, color: colors.textStrong, marginBottom: 4 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function MoneyRow({
  label,
  value,
  note,
  tone,
  strong = false,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "success";
  strong?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={{ paddingVertical: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 12 }}>
        <Text style={{ flex: 1, fontFamily: strong ? POPPINS.semibold : POPPINS.regular, fontSize: 16, color: colors.text }}>
          {label}
        </Text>
        <Text
          style={{
            fontFamily: strong ? POPPINS.bold : POPPINS.semibold,
            fontSize: 16,
            color: tone === "success" ? colors.success : colors.textStrong,
            ...TABULAR,
          }}
        >
          {value}
        </Text>
      </View>
      {note !== undefined && (
        <Text style={{ fontFamily: POPPINS.regular, fontSize: 13, color: colors.steel, marginTop: 2 }}>{note}</Text>
      )}
    </View>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  const { colors, border } = useAppTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: border,
      }}
    >
      <Text style={{ flex: 1, fontFamily: POPPINS.bold, fontSize: 18, color: colors.textStrong }}>{label}</Text>
      <Text style={{ fontFamily: POPPINS.bold, fontSize: 20, color: colors.textStrong, ...TABULAR }}>{value}</Text>
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      style={{
        marginTop: 12,
        alignSelf: "stretch",
        height: 54,
        borderRadius: UBER_RADIUS.button,
        backgroundColor: HERCOM_COLORS.primaryDark,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontFamily: POPPINS.bold, fontSize: 18, color: HERCOM_COLORS.white }}>{label}</Text>
    </TouchableOpacity>
  );
}
