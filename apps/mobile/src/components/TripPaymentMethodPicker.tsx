import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { HERCOM_COLORS, POPPINS, TACTICAL_BORDER } from "../constants/theme";
import { useAppTheme } from "../contexts/ThemeContext";
import {
  TRIP_PAYMENT_LABELS,
  TRIP_PAYMENT_OPTIONS,
  type TripPaymentMethod,
} from "../lib/tripPaymentMethods";

type TripPaymentMethodPickerProps = {
  value: TripPaymentMethod | null;
  onChange?: (method: TripPaymentMethod) => void;
  /** Solo muestra el medio elegido (post-confirmación). */
  locked?: boolean;
  label?: string;
};

export function TripPaymentMethodPicker({
  value,
  onChange,
  locked = false,
  label,
}: TripPaymentMethodPickerProps) {
  const { colors } = useAppTheme();
  const options =
    locked && value !== null
      ? TRIP_PAYMENT_OPTIONS.filter((item) => item.value === value)
      : TRIP_PAYMENT_OPTIONS;

  return (
    <View style={{ gap: 8 }}>
      {label !== undefined && label !== "" && (
        <Text style={{ fontFamily: POPPINS.semibold, fontSize: 15, color: colors.textStrong }}>
          {label}
        </Text>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              disabled={locked || onChange === undefined}
              onPress={() => onChange?.(option.value)}
              activeOpacity={locked ? 1 : 0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: locked }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: selected ? HERCOM_COLORS.primaryDark : HERCOM_COLORS.border,
                backgroundColor: selected ? HERCOM_COLORS.primaryDark : colors.surfaceSunken,
              }}
            >
              <Text
                style={{
                  fontFamily: POPPINS.semibold,
                  fontSize: 15,
                  color: selected ? HERCOM_COLORS.white : colors.textStrong,
                }}
              >
                {locked && selected ? `✓ ${option.label}` : option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

type BalancePaymentPickerProps = {
  advanceMethod: TripPaymentMethod | null | undefined;
  value: TripPaymentMethod | null;
  onChange: (method: TripPaymentMethod) => void;
  balanceDue: number;
};

/** Saldo: puede repetir el medio del adelanto o elegir otro (campo distinto en `payments`). */
export function BalancePaymentPicker({
  advanceMethod,
  value,
  onChange,
  balanceDue,
}: BalancePaymentPickerProps) {
  const { colors, border } = useAppTheme();
  const [otherOpen, setOtherOpen] = useState(advanceMethod == null);
  const sameSelected =
    advanceMethod !== undefined &&
    advanceMethod !== null &&
    value === advanceMethod &&
    !otherOpen;
  const otherSelected = otherOpen || advanceMethod == null;

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontFamily: POPPINS.medium, fontSize: 15, color: colors.text }}>
        {`Saldo S/${balanceDue.toFixed(2)}. El adelanto y el saldo pueden ser medios distintos.`}
      </Text>
      {advanceMethod !== undefined && advanceMethod !== null && (
        <TouchableOpacity
          onPress={() => {
            setOtherOpen(false);
            onChange(advanceMethod);
          }}
          activeOpacity={0.88}
          style={{
            padding: 14,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: sameSelected ? HERCOM_COLORS.primaryDark : border,
            backgroundColor: sameSelected ? HERCOM_COLORS.primarySoft : colors.surface,
          }}
        >
          <Text style={{ fontFamily: POPPINS.semibold, fontSize: 16, color: colors.textStrong }}>
            {`Sí, otra vez con ${TRIP_PAYMENT_LABELS[advanceMethod]}`}
          </Text>
        </TouchableOpacity>
      )}
      {advanceMethod !== undefined && advanceMethod !== null && (
        <TouchableOpacity
          onPress={() => {
            setOtherOpen(true);
            if (value === advanceMethod) {
              onChange(
                TRIP_PAYMENT_OPTIONS.find((item) => item.value !== advanceMethod)?.value ?? "cash",
              );
            }
          }}
          activeOpacity={0.88}
          style={{
            padding: 14,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: otherSelected ? HERCOM_COLORS.primaryDark : border,
            backgroundColor: otherSelected ? HERCOM_COLORS.primarySoft : colors.surface,
          }}
        >
          <Text style={{ fontFamily: POPPINS.semibold, fontSize: 16, color: colors.textStrong }}>
            No, el saldo con otro medio
          </Text>
        </TouchableOpacity>
      )}
      {otherSelected && (
        <TripPaymentMethodPicker
          label="Medio para el saldo"
          value={value}
          onChange={onChange}
        />
      )}
    </View>
  );
}