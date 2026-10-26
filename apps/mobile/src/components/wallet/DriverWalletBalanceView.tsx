import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { Doc } from "@proyecto/backend/dataModel";
import {
  formatTripCreditsShort,
  formatTripDelta,
} from "../../lib/driverWalletDisplay";
import { TABULAR } from "../../constants/theme";
import { YangoWalletHeader } from "./YangoWalletHeader";
import { WALLET_FONT, WALLET_TYPE, useWalletTheme } from "./walletUiTheme";

type WalletTx = Doc<"walletTransactions">;

type DriverWalletBalanceViewProps = {
  tripCredits: number;
  transactions: WalletTx[] | undefined;
  /** Sin `onBack` no se dibuja cabecera (vista embebida en una pestaña). */
  onBack?: () => void;
  onRecargar: () => void;
};

function formatTxDate(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function txLabel(type: WalletTx["type"]): string {
  return type === "top_up" ? "Recarga" : "Viaje completado";
}

export function DriverWalletBalanceView({
  tripCredits,
  transactions,
  onBack,
  onRecargar,
}: DriverWalletBalanceViewProps) {
  const wallet = useWalletTheme();
  const creditsLabel = formatTripCreditsShort(tripCredits);
  const list = transactions ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: wallet.bg }}>
      {onBack !== undefined && (
        <YangoWalletHeader title="Viajes disponibles" onBack={onBack} />
      )}

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <View
          style={{
            alignItems: "center",
            paddingTop: onBack !== undefined ? 8 : 24,
            paddingBottom: 28,
          }}
        >
          <Text
            style={{
              fontFamily: WALLET_FONT.bold,
              fontSize: WALLET_TYPE.balanceHero,
              color: wallet.text,
              letterSpacing: -0.5,
              ...TABULAR,
            }}
          >
            {creditsLabel}
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Viajes disponibles ${creditsLabel}`}
            style={{
              marginTop: 16,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: wallet.pillBg,
              borderRadius: 999,
              paddingVertical: 10,
              paddingHorizontal: 16,
              gap: 8,
            }}
          >
            <Text
              style={{
                fontFamily: WALLET_FONT.medium,
                fontSize: WALLET_TYPE.caption,
                color: wallet.textMuted,
              }}
            >
              {`Viajes disponibles: ${creditsLabel}`}
            </Text>
            <Text style={{ color: wallet.textMuted, fontSize: 18 }}>›</Text>
          </TouchableOpacity>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: 32,
              gap: 28,
            }}
          >
            <TouchableOpacity
              onPress={onRecargar}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Recargar viajes"
              style={{ alignItems: "center", width: 88 }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: wallet.actionCircleBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: WALLET_FONT.bold,
                    fontSize: 28,
                    color: wallet.text,
                    marginTop: -2,
                  }}
                >
                  +
                </Text>
              </View>
              <Text
                style={{
                  marginTop: 10,
                  fontFamily: WALLET_FONT.medium,
                  fontSize: WALLET_TYPE.caption,
                  color: wallet.text,
                }}
              >
                Recargar
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={{
            flex: 1,
            backgroundColor: wallet.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 20,
            paddingHorizontal: 20,
            marginHorizontal: -20,
          }}
        >
          <Text
            style={{
              fontFamily: WALLET_FONT.bold,
              fontSize: WALLET_TYPE.sectionTitle,
              color: wallet.text,
              marginBottom: 16,
            }}
          >
            Historial de transacciones
          </Text>
          <View
            style={{
              height: 1,
              backgroundColor: wallet.border,
              marginBottom: 20,
            }}
          />

          {list.length === 0 ? (
            <View style={{ paddingTop: 48, paddingHorizontal: 12 }}>
              <Text
                style={{
                  fontFamily: WALLET_FONT.bold,
                  fontSize: WALLET_TYPE.body,
                  color: wallet.text,
                  textAlign: "center",
                }}
              >
                No encontramos resultados
              </Text>
              <Text
                style={{
                  marginTop: 10,
                  fontFamily: WALLET_FONT.regular,
                  fontSize: WALLET_TYPE.caption,
                  color: wallet.textDim,
                  textAlign: "center",
                  lineHeight: 24,
                }}
              >
                Todavía no tuviste ninguna transacción
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {list.map((tx) => (
                <View
                  key={tx._id}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: wallet.border,
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text
                      style={{
                        fontFamily: WALLET_FONT.semibold,
                        fontSize: WALLET_TYPE.body,
                        color: wallet.text,
                      }}
                    >
                      {txLabel(tx.type)}
                    </Text>
                    <Text
                      style={{
                        marginTop: 4,
                        fontFamily: WALLET_FONT.regular,
                        fontSize: WALLET_TYPE.caption,
                        color: wallet.textDim,
                      }}
                    >
                      {formatTxDate(tx.createdAt)}
                    </Text>
                    {tx.note !== undefined && tx.note.trim() !== "" ? (
                      <Text
                        style={{
                          marginTop: 4,
                          fontFamily: WALLET_FONT.regular,
                          fontSize: WALLET_TYPE.caption,
                          color: wallet.textMuted,
                        }}
                      >
                        {tx.note}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={{
                      fontFamily: WALLET_FONT.bold,
                      fontSize: WALLET_TYPE.body,
                      color:
                        tx.type === "trip_debit"
                          ? wallet.textMuted
                          : wallet.creditText,
                      ...TABULAR,
                    }}
                  >
                    {formatTripDelta(tx.amount, tx.type)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}
