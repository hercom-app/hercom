import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAction } from "convex/react";
import type { Id } from "@proyecto/backend/dataModel";
import { api } from "@proyecto/backend";
import * as WebBrowser from "expo-web-browser";
import {
  DRIVER_TOP_UP_PACKAGES,
  getDriverTopUpPackage,
  type DriverTopUpPackageId,
} from "@proyecto/backend/driverTopUpPackages";
import {
  computeIzipayTopUpQuote,
  formatPenAmount,
  IZIPAY_TOP_UP_FEE_FIXED_PEN,
  IZIPAY_TOP_UP_FEE_RATE,
} from "../../lib/izipayTopUpFees";
import { convexErrorMessage } from "../../lib/convexErrorMessage";
import { TABULAR, TYPE } from "../../constants/theme";
import { IzipayMark } from "./IzipayMark";
import { YangoWalletHeader } from "./YangoWalletHeader";
import { WALLET_FONT, WALLET_TYPE, useWalletTheme } from "./walletUiTheme";

type DriverWalletTopUpViewProps = {
  onBack: () => void;
  onTopUpComplete?: () => void;
};

export function DriverWalletTopUpView({
  onBack,
  onTopUpComplete,
}: DriverWalletTopUpViewProps) {
  const wallet = useWalletTheme();
  const beginTopUp = useAction(api.walletTopUps.beginTopUp);
  const fulfillTopUp = useAction(api.walletTopUps.fulfillTopUp);
  const [packageId, setPackageId] = useState<DriverTopUpPackageId>("trips_1");
  const [submitting, setSubmitting] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<Id<"walletTopUpOrders"> | null>(
    null,
  );

  const selected = useMemo(
    () => getDriverTopUpPackage(packageId),
    [packageId],
  );

  const quote = useMemo(
    () => computeIzipayTopUpQuote(selected.pricePen),
    [selected.pricePen],
  );

  const commissionLabel = `${(IZIPAY_TOP_UP_FEE_RATE * 100).toFixed(2)}% + PEN ${IZIPAY_TOP_UP_FEE_FIXED_PEN.toFixed(2)}`;

  async function handleConfirmPayment() {
    if (pendingOrderId === null) {
      return;
    }
    setSubmitting(true);
    try {
      const result = await fulfillTopUp({ orderDocId: pendingOrderId });
      setPendingOrderId(null);
      Alert.alert(
        "Recarga acreditada",
        result.alreadyPaid === true
          ? `Tu saldo es S/ ${result.balance?.toFixed(2) ?? "—"}.`
          : `Se sumaron S/ ${quote.amountPen.toFixed(2)}. Saldo S/ ${result.balance?.toFixed(2) ?? "—"}.`,
      );
      onTopUpComplete?.();
    } catch (error) {
      Alert.alert(
        "Pago pendiente",
        convexErrorMessage(
          error,
          "Si ya pagaste con tarjeta de prueba, espera unos segundos e inténtalo de nuevo.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecargar() {
    setSubmitting(true);
    try {
      const session = await beginTopUp({ amountPen: selected.pricePen });
      setPendingOrderId(session.orderDocId);
      await WebBrowser.openBrowserAsync(session.checkoutUrl);
      Alert.alert(
        "Pago con Izipay (test)",
        "Usa la tarjeta Visa 4970100000000055 en el formulario. Al cerrar el navegador, pulsa «Confirmar pago».",
        [
          { text: "Más tarde", style: "cancel" },
          {
            text: "Confirmar pago",
            onPress: () => void handleConfirmPayment(),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "No se pudo abrir Izipay",
        convexErrorMessage(
          error,
          "Revisa que Convex tenga LYRA_REST_USER, LYRA_REST_PASSWORD y LYRA_PUBLIC_KEY (test).",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: wallet.bg }}>
      <YangoWalletHeader title="Recargar saldo" onBack={onBack} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            marginTop: 8,
            fontFamily: WALLET_FONT.regular,
            fontSize: WALLET_TYPE.caption,
            color: wallet.textDim,
          }}
        >
          Elige un monto. Se suma a tu saldo al confirmar el pago con Izipay.
          Cada viaje descuenta la comisión de Hercom.
        </Text>

        <View style={{ marginTop: 16, gap: 10 }}>
          {DRIVER_TOP_UP_PACKAGES.map((pkg) => {
            const active = pkg.id === packageId;
            return (
              <TouchableOpacity
                key={pkg.id}
                onPress={() => setPackageId(pkg.id)}
                activeOpacity={0.85}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${pkg.label}, ${formatPenAmount(pkg.pricePen)}`}
                style={{
                  backgroundColor: active ? wallet.surfaceElevated : wallet.surface,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 18,
                  borderWidth: 2,
                  borderColor: active ? wallet.ctaBg : wallet.border,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text
                      style={{
                        fontFamily: WALLET_FONT.bold,
                        fontSize: WALLET_TYPE.body,
                        color: wallet.text,
                      }}
                    >
                      {pkg.label}
                    </Text>
                    <Text
                      style={{
                        marginTop: 4,
                        fontFamily: WALLET_FONT.regular,
                        fontSize: WALLET_TYPE.caption,
                        color: wallet.textDim,
                      }}
                    >
                      Saldo a acreditar
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        fontFamily: WALLET_FONT.bold,
                        fontSize: WALLET_TYPE.amountInput,
                        color: wallet.text,
                        ...TABULAR,
                      }}
                    >
                      {`S/ ${pkg.pricePen}`}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={{
            marginTop: 12,
            backgroundColor: wallet.surface,
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          }}
        >
          <IzipayMark />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: WALLET_FONT.semibold,
                fontSize: WALLET_TYPE.body,
                color: wallet.text,
              }}
            >
              Izipay
            </Text>
            <Text
              style={{
                marginTop: 4,
                fontFamily: WALLET_FONT.regular,
                fontSize: WALLET_TYPE.caption,
                color: wallet.textDim,
              }}
            >
              {`Comisión IZIPAY: ${commissionLabel}`}
            </Text>
          </View>
        </View>

        <View
          style={{
            marginTop: 12,
            backgroundColor: wallet.surface,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 4,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: wallet.border,
            }}
          >
            <Text
              style={{
                fontFamily: WALLET_FONT.regular,
                fontSize: WALLET_TYPE.body,
                color: wallet.text,
              }}
            >
              Paquete
            </Text>
            <Text
              style={{
                fontFamily: WALLET_FONT.semibold,
                fontSize: WALLET_TYPE.body,
                color: wallet.text,
                ...TABULAR,
              }}
            >
              {`PEN ${quote.amountPen.toFixed(2)}`}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: wallet.border,
            }}
          >
            <Text
              style={{
                fontFamily: WALLET_FONT.regular,
                fontSize: WALLET_TYPE.body,
                color: wallet.text,
              }}
            >
              Comisión IZIPAY
            </Text>
            <Text
              style={{
                fontFamily: WALLET_FONT.semibold,
                fontSize: WALLET_TYPE.body,
                color: wallet.text,
                ...TABULAR,
              }}
            >
              {`PEN ${quote.commissionPen.toFixed(2)}`}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 14,
            }}
          >
            <Text
              style={{
                fontFamily: WALLET_FONT.regular,
                fontSize: WALLET_TYPE.body,
                color: wallet.text,
              }}
            >
              Se debitarán de la cuenta
            </Text>
            <Text
              style={{
                fontFamily: WALLET_FONT.bold,
                fontSize: WALLET_TYPE.body,
                color: wallet.text,
                ...TABULAR,
              }}
            >
              {`PEN ${quote.totalDebitPen.toFixed(2)}`}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10 }}>
        {pendingOrderId !== null && (
          <TouchableOpacity
            onPress={() => void handleConfirmPayment()}
            disabled={submitting}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Confirmar pago Izipay"
            style={{
              height: 48,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: wallet.border,
              alignItems: "center",
              justifyContent: "center",
              opacity: submitting ? 0.85 : 1,
            }}
          >
            <Text
              style={{
                fontFamily: WALLET_FONT.semibold,
                fontSize: TYPE.button,
                color: wallet.text,
              }}
            >
              Confirmar pago
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => void handleRecargar()}
          disabled={submitting}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Recargar con Izipay"
          style={{
            height: 56,
            borderRadius: 14,
            backgroundColor: wallet.ctaBg,
            alignItems: "center",
            justifyContent: "center",
            opacity: submitting ? 0.85 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color={wallet.ctaText} />
          ) : (
            <Text
              style={{
                fontFamily: WALLET_FONT.bold,
                fontSize: TYPE.button,
                color: wallet.ctaText,
              }}
            >
              {`Pagar con Izipay · ${selected.label}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
