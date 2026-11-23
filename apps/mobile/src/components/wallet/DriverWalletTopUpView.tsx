import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAction } from "convex/react";
import type { Id } from "@proyecto/backend/dataModel";
import { api } from "@proyecto/backend";
import * as WebBrowser from "expo-web-browser";
import {
  computeIzipayTopUpQuote,
  formatPenAmount,
  IZIPAY_TOP_UP_FEE_FIXED_PEN,
  IZIPAY_TOP_UP_FEE_RATE,
  parseTopUpAmountPen,
  validateTopUpAmountPen,
  WALLET_TOP_UP_MAX_PEN,
  WALLET_TOP_UP_MIN_PEN,
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
  const [amountText, setAmountText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<Id<"walletTopUpOrders"> | null>(
    null,
  );
  const [lastChargedPen, setLastChargedPen] = useState<number | null>(null);

  const amountPen = useMemo(() => parseTopUpAmountPen(amountText), [amountText]);
  const validationError = useMemo(
    () => validateTopUpAmountPen(amountPen),
    [amountPen],
  );
  const canPay = validationError === null && amountPen !== null;

  const quote = useMemo(
    () => computeIzipayTopUpQuote(amountPen ?? 0),
    [amountPen],
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
      const credited = lastChargedPen ?? quote.amountPen;
      Alert.alert(
        "Recarga acreditada",
        result.alreadyPaid === true
          ? `Tu saldo es S/ ${result.balance?.toFixed(2) ?? "—"}.`
          : `Se sumaron S/ ${credited.toFixed(2)}. Saldo S/ ${result.balance?.toFixed(2) ?? "—"}.`,
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
    if (!canPay || amountPen === null) {
      Alert.alert("Monto inválido", validationError ?? "Revisa el monto.");
      return;
    }
    setSubmitting(true);
    const chargedPen = amountPen;
    try {
      const session = await beginTopUp({ amountPen: chargedPen });
      setLastChargedPen(chargedPen);
      setPendingOrderId(session.orderDocId);
      await WebBrowser.openBrowserAsync(session.checkoutUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });
      try {
        const result = await fulfillTopUp({ orderDocId: session.orderDocId });
        setPendingOrderId(null);
        Alert.alert(
          "Recarga acreditada",
          result.alreadyPaid === true
            ? `Tu saldo es S/ ${result.balance?.toFixed(2) ?? "—"}.`
            : `Se sumaron S/ ${chargedPen.toFixed(2)}. Saldo S/ ${result.balance?.toFixed(2) ?? "—"}.`,
        );
        onTopUpComplete?.();
      } catch {
        Alert.alert(
          "Confirma tu pago",
          "Si ya pagaste en Izipay (tarjeta, Yape u otro medio), pulsa «Confirmar pago». Si no, inténtalo de nuevo.",
          [
            { text: "Más tarde", style: "cancel" },
            {
              text: "Confirmar pago",
              onPress: () => void handleConfirmPayment(),
            },
          ],
        );
      }
    } catch (error) {
      Alert.alert(
        "No se pudo abrir Izipay",
        convexErrorMessage(
          error,
          "Revisa que Convex tenga las claves REST de Izipay (test o producción).",
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
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            marginTop: 8,
            fontFamily: WALLET_FONT.regular,
            fontSize: WALLET_TYPE.caption,
            color: wallet.textDim,
          }}
        >
          {`Indica el monto (S/ ${WALLET_TOP_UP_MIN_PEN} – S/ ${WALLET_TOP_UP_MAX_PEN}). Tras pagar en Izipay, confirmamos y sumamos el saldo a tu billetera.`}
        </Text>

        <View
          style={{
            marginTop: 20,
            backgroundColor: wallet.surface,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: validationError !== null && amountText.trim() !== "" ? "#E53935" : wallet.border,
          }}
        >
          <Text
            style={{
              fontFamily: WALLET_FONT.regular,
              fontSize: WALLET_TYPE.caption,
              color: wallet.textDim,
            }}
          >
            Monto a recargar
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
            <Text
              style={{
                fontFamily: WALLET_FONT.bold,
                fontSize: WALLET_TYPE.amountInput,
                color: wallet.textDim,
                marginRight: 6,
              }}
            >
              S/
            </Text>
            <TextInput
              value={amountText}
              onChangeText={setAmountText}
              placeholder="0.00"
              placeholderTextColor={wallet.textDim}
              keyboardType="decimal-pad"
              accessibilityLabel="Monto de recarga en soles"
              style={{
                flex: 1,
                fontFamily: WALLET_FONT.bold,
                fontSize: WALLET_TYPE.amountInput,
                color: wallet.text,
                paddingVertical: 8,
                ...TABULAR,
              }}
            />
          </View>
          {validationError !== null && amountText.trim() !== "" ? (
            <Text
              style={{
                marginTop: 6,
                fontFamily: WALLET_FONT.regular,
                fontSize: WALLET_TYPE.caption,
                color: "#E53935",
              }}
            >
              {validationError}
            </Text>
          ) : null}
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
              {`Comisión pasarela (referencia): ${commissionLabel}`}
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
            opacity: canPay ? 1 : 0.55,
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
              Se acredita en billetera
            </Text>
            <Text
              style={{
                fontFamily: WALLET_FONT.semibold,
                fontSize: WALLET_TYPE.body,
                color: wallet.text,
                ...TABULAR,
              }}
            >
              {canPay ? formatPenAmount(quote.amountPen) : "—"}
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
              {canPay ? `PEN ${quote.commissionPen.toFixed(2)}` : "—"}
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
              Cobro en pasarela (hoy)
            </Text>
            <Text
              style={{
                fontFamily: WALLET_FONT.bold,
                fontSize: WALLET_TYPE.body,
                color: wallet.text,
                ...TABULAR,
              }}
            >
              {canPay ? `PEN ${quote.amountPen.toFixed(2)}` : "—"}
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
          disabled={submitting || !canPay}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Recargar con Izipay"
          style={{
            height: 56,
            borderRadius: 14,
            backgroundColor: wallet.ctaBg,
            alignItems: "center",
            justifyContent: "center",
            opacity: submitting || !canPay ? 0.55 : 1,
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
              {canPay
                ? `Pagar con Izipay · S/ ${quote.amountPen.toFixed(2)}`
                : "Pagar con Izipay"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}