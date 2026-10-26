import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { DriverSheet } from "./DriverSheet";
import { UiButton } from "../ui";
import { useAppTheme } from "../../contexts/ThemeContext";
import { convexErrorMessage } from "../../lib/convexErrorMessage";
import { HERCOM_COLORS, POPPINS, TABULAR } from "../../constants/theme";

const QUICK_PICKS_KM = [2, 3, 5, 8, 10, 15, 20, 30];

type DriverRadiusSheetProps = {
  visible: boolean;
  onClose: () => void;
};

/** Configuración del radio de búsqueda de solicitudes (tuerca en Servicio). */
export function DriverRadiusSheet({ visible, onClose }: DriverRadiusSheetProps) {
  const { colors } = useAppTheme();
  const radius = useQuery(api.drivers.getMyOfferRadius, visible ? {} : "skip");
  const setMyOfferRadius = useMutation(api.drivers.setMyOfferRadius);
  const [draft, setDraft] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && radius !== undefined) {
      setDraft(radius.radiusKm);
      setError(null);
    }
  }, [visible, radius?.radiusKm]);

  const minKm = radius?.minKm ?? 1;
  const maxKm = radius?.marketMaxKm ?? 10;
  const value = draft ?? radius?.radiusKm ?? maxKm;
  const picks = [
    ...QUICK_PICKS_KM.filter((km) => km >= minKm && km < maxKm),
    maxKm,
  ];

  function step(delta: number) {
    setDraft(Math.min(maxKm, Math.max(minKm, value + delta)));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await setMyOfferRadius({ radiusKm: value });
      onClose();
    } catch (saveError) {
      setError(convexErrorMessage(saveError, "No se pudo guardar el radio."));
    } finally {
      setSaving(false);
    }
  }

  const stepperButton = (label: string, delta: number, disabled: boolean) => (
    <TouchableOpacity
      onPress={() => step(delta)}
      disabled={disabled}
      accessibilityLabel={delta > 0 ? "Aumentar radio" : "Reducir radio"}
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.surfaceSunken,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Text style={{ fontFamily: POPPINS.bold, fontSize: 26, color: colors.textStrong }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <DriverSheet visible={visible} title="Radio de búsqueda" onClose={onClose}>
      {radius === undefined ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: 32 }} />
      ) : (
        <View>
          <Text
            style={{
              fontFamily: POPPINS.regular,
              fontSize: 15,
              lineHeight: 21,
              color: colors.steel,
              marginBottom: 20,
            }}
          >
            Recibirás solicitudes cuyo punto de recojo esté dentro de esta
            distancia. Máximo permitido en tu zona: {maxKm} km.
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            {stepperButton("−", -1, value <= minKm)}
            <Text
              style={{
                fontFamily: POPPINS.bold,
                fontSize: 40,
                color: colors.textStrong,
                ...TABULAR,
              }}
            >
              {`${value} km`}
            </Text>
            {stepperButton("+", 1, value >= maxKm)}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {picks.map((km) => {
              const selected = km === value;
              return (
                <TouchableOpacity
                  key={km}
                  onPress={() => setDraft(km)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: selected ? HERCOM_COLORS.primary : colors.surfaceSunken,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: POPPINS.semibold,
                      fontSize: 15,
                      color: selected ? HERCOM_COLORS.white : colors.textStrong,
                    }}
                  >
                    {`${km} km`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {error !== null && (
            <Text
              style={{
                fontFamily: POPPINS.medium,
                fontSize: 14,
                color: colors.danger,
                marginBottom: 12,
              }}
            >
              {error}
            </Text>
          )}

          <UiButton
            label="Guardar"
            onPress={() => void handleSave()}
            loading={saving}
            disabled={value === radius.radiusKm}
          />
        </View>
      )}
    </DriverSheet>
  );
}
