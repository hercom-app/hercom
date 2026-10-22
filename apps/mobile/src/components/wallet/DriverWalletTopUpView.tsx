import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation } from "convex/react";
import { api } from "@proyecto/backend";
import {
  computeIzipayTopUpQuote,
  formatPenAmount,
  IZIPAY_TOP_UP_FEE_FIXED_PEN,
  IZIPAY_TOP_UP_FEE_RATE,
  IZIPAY_TOP_UP_MAX_PEN,
  IZIPAY_TOP_UP_MIN_PEN,
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

function parseAmountInput(raw: string): number {
  const normalized = raw.replace(",", ".").replace(/[^\d.]/g, "");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

export function DriverWalletTopUpView({
  onBack,
  onTopUpComplete,
}: DriverWalletTopUpViewProps) {
  const wallet = useWalletTheme();
  const topUpMine = useMutation(api.driverWallets.topUpMine);
  const [amountInput, setAmountInput] = useState("20");
  const [submitting, setSubmitting] = useState(false);

  const amountPen = parseAmountInput(amountInput);
  const quote = useMemo(() => computeIzipayTopUpQuote(amountPen), [amountPen]);

  const amountValid =
    amountPen >= IZIPAY_TOP_UP_MIN_PEN && amountPen <= IZIPAY_TOP_UP_MAX_PEN;

  const commissionLabel = `${(IZIPAY_TOP_UP_FEE_RATE * 100).toFixed(2)}% + PEN ${IZIPAY_TOP_UP_FEE_FIXED_PEN.toFixed(2)}`;

  async function handleRecargar() {
    if (!amountValid) {
      Alert.alert(
        "Monto inválido",
        `Ingresa un monto entre PEN ${IZIPAY_TOP_UP_MIN_PEN} y PEN ${IZIPAY_TOP_UP_MAX_PEN}.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      await topUpMine({
        amount: quote.amountPen,
        note: `Recarga Izipay. Comisión IZIPAY PEN ${quote.commissionPen.toFixed(2)}.`,
      });
      onTopUpComplete?.();
    } catch (error) {
      Alert.alert(
        "No se pudo recargar",
        convexErrorMessage(error, "Intenta de nuevo más tarde."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: wallet.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <YangoWalletHeader title="Recargar el saldo" onBack={onBack} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: wallet.surface,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 20,
            marginTop: 8,
          }}
        >
          <View className="flex-row items-start justify-between">
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: WALLET_FONT.bold,
                  fontSize: WALLET_TYPE.amountInput,
                  color: wallet.text,
                  ...TABULAR,
                }}
              >
                {formatPenAmount(amountPen)}
              </Text>
              <Text
                style={{
                  marginTop: 8,
                  fontFamily: WALLET_FONT.regular,
                  fontSize: WALLET_TYPE.caption,
                  color: amountValid ? wallet.textDim : "#F87171",
                }}
              >
                {`Desde ${IZIPAY_TOP_UP_MIN_PEN} hasta PEN ${IZIPAY_TOP_UP_MAX_PEN}`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setAmountInput("")}
              accessibilityLabel="Limpiar monto"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: wallet.surfaceElevated,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: wallet.textMuted, fontSize: 16 }}>×</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            value={amountInput}
            onChangeText={setAmountInput}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={wallet.textDim}
            accessibilityLabel="Monto a recargar en soles"
            style={{
              marginTop: 16,
              fontFamily: WALLET_FONT.medium,
              fontSize: WALLET_TYPE.body,
              color: wallet.text,
              borderBottomWidth: 1,
              borderBottomColor: wallet.border,
              paddingVertical: 10,
            }}
          />
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

      <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <TouchableOpacity
          onPress={() => void handleRecargar()}
          disabled={!amountValid || submitting}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Recargar con Izipay"
          style={{
            height: 56,
            borderRadius: 14,
            backgroundColor: amountValid ? wallet.ctaBg : wallet.surfaceElevated,
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
                color: amountValid ? wallet.ctaText : wallet.textDim,
              }}
            >
              Recargar
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
