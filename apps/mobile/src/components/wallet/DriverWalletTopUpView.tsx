import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation } from "convex/react";
import { api } from "@proyecto/backend";
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
  const topUpMine = useMutation(api.driverWallets.topUpMine);
  const [packageId, setPackageId] = useState<DriverTopUpPackageId>("trips_1");
  const [submitting, setSubmitting] = useState(false);

  const selected = useMemo(
    () => getDriverTopUpPackage(packageId),
    [packageId],
  );

  const quote = useMemo(
    () => computeIzipayTopUpQuote(selected.pricePen),
    [selected.pricePen],
  );

  const commissionLabel = `${(IZIPAY_TOP_UP_FEE_RATE * 100).toFixed(2)}% + PEN ${IZIPAY_TOP_UP_FEE_FIXED_PEN.toFixed(2)}`;

  async function handleRecargar() {
    setSubmitting(true);
    try {
      await topUpMine({
        packageId: selected.id,
        note: `Recarga ${selected.label} (S/${selected.pricePen}). Comisión IZIPAY PEN ${quote.commissionPen.toFixed(2)}.`,
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
    <View style={{ flex: 1, backgroundColor: wallet.bg }}>
      <YangoWalletHeader title="Recargar viajes" onBack={onBack} />

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
          Elige un paquete. Los viajes se suman a tu cuenta al confirmar el pago
          con Izipay.
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
                      Viajes a acreditar
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
                      {pkg.trips === 1 ? "1 viaje" : `${pkg.trips} viajes`}
                    </Text>
                    <Text
                      style={{
                        marginTop: 4,
                        fontFamily: WALLET_FONT.medium,
                        fontSize: WALLET_TYPE.caption,
                        color: wallet.textDim,
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

      <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
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
              {`Recargar ${selected.label}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
