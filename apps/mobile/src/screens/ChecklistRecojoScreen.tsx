import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import { CarDamageCanvas, type DamageMark } from "../components/CarDamageCanvas";
import { DrawerIcon } from "../components/DrawerIcons";
import {
  CheckRow,
  ErrorText,
  FilledInput,
  GroupDivider,
  PillButton,
  SectionTitle,
  SoftGroup,
} from "../components/driver/driverUi";
import { useAppTheme } from "../contexts/ThemeContext";
import { HERCOM_COLORS, POPPINS } from "../constants/theme";

type Props = {
  serviceId: Id<"services">;
  onBack: () => void;
};

export function ChecklistRecojoScreen({ serviceId, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, border } = useAppTheme();
  const checklist = useQuery(api.serviceChecklists.getForMyService, {
    serviceId,
  });
  const upsert = useMutation(api.serviceChecklists.upsertPickupChecklist);

  const [hasPropertyCard, setHasPropertyCard] = useState(false);
  const [hasSoat, setHasSoat] = useState(false);
  const [hasTechnicalInspection, setHasTechnicalInspection] = useState(false);
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [damageMarks, setDamageMarks] = useState<DamageMark[]>([]);
  const [damageNotes, setDamageNotes] = useState("");
  const [hasInsurance, setHasInsurance] = useState(false);
  const [insuranceNotes, setInsuranceNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);
  if (checklist !== undefined) {
    hasLoadedOnce.current = true;
  }

  useEffect(() => {
    if (checklist === null || checklist === undefined) return;
    setHasPropertyCard(checklist.hasPropertyCard);
    setHasSoat(checklist.hasSoat);
    setHasTechnicalInspection(checklist.hasTechnicalInspection === true);
    setVehicleMake(checklist.vehicleMake ?? "");
    setVehicleModel(checklist.vehicleModel ?? "");
    setVehicleYear(
      checklist.vehicleYear !== undefined ? String(checklist.vehicleYear) : "",
    );
    setDamageMarks((checklist.damageMarks ?? []) as DamageMark[]);
    setDamageNotes(checklist.damageNotes ?? "");
    setHasInsurance(checklist.hasInsurance === true);
    setInsuranceNotes(checklist.insuranceNotes ?? "");
  }, [checklist?._id]);

  const docsDone = [hasPropertyCard, hasSoat, hasTechnicalInspection].filter(Boolean).length;
  const docsOk = docsDone === 3;
  const hasMarks = damageMarks.length > 0;
  const notesOk = !hasMarks || damageNotes.trim().length > 0;
  const canSave = docsOk && notesOk;
  const requiredTotal = hasMarks ? 4 : 3;
  const requiredDone = docsDone + (hasMarks && notesOk ? 1 : 0);

  async function handleSave() {
    if (!canSave) {
      setError(
        !docsOk
          ? "Verifica tarjeta de propiedad, SOAT y revisión técnica."
          : "Describe las abolladuras que marcaste.",
      );
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const yearNum = Number(vehicleYear);
      await upsert({
        serviceId,
        hasVehicleDamage: hasMarks,
        damageMarks,
        ...(damageNotes.trim() ? { damageNotes: damageNotes.trim() } : {}),
        hasPropertyCard,
        hasSoat,
        hasTechnicalInspection,
        ...(vehicleMake.trim() ? { vehicleMake: vehicleMake.trim() } : {}),
        ...(vehicleModel.trim() ? { vehicleModel: vehicleModel.trim() } : {}),
        ...(Number.isFinite(yearNum) && yearNum > 1900
          ? { vehicleYear: yearNum }
          : {}),
        hasInsurance,
        ...(hasInsurance && insuranceNotes.trim()
          ? { insuranceNotes: insuranceNotes.trim() }
          : {}),
      });
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  if (checklist === undefined && !hasLoadedOnce.current) {
    return (
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.base }}
      >
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.base }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
        <TouchableOpacity
          onPress={onBack}
          accessibilityLabel="Volver al servicio"
          style={{
            width: 48,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ rotate: "180deg" }],
          }}
        >
          <DrawerIcon name="chevron" color={colors.textStrong} size={26} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
      >
        <Text style={{ fontFamily: POPPINS.bold, fontSize: 30, color: colors.textStrong }}>
          Checklist de recojo
        </Text>
        <Text style={{ marginTop: 4, fontFamily: POPPINS.regular, fontSize: 16, color: colors.text }}>
          Revisa el vehículo del cliente antes de iniciar el viaje.
        </Text>

        <View style={{ marginTop: 16, marginBottom: 24 }}>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceSunken, overflow: "hidden" }}>
            <View
              style={{
                width: `${(requiredDone / requiredTotal) * 100}%`,
                height: "100%",
                borderRadius: 4,
                backgroundColor: canSave ? HERCOM_COLORS.success : HERCOM_COLORS.primary,
              }}
            />
          </View>
          <Text style={{ marginTop: 6, fontFamily: POPPINS.medium, fontSize: 14, color: colors.steel }}>
            {canSave ? "Todo listo para guardar" : `${requiredDone} de ${requiredTotal} obligatorios`}
          </Text>
        </View>

        <Section title="Documentos">
          <SoftGroup>
            <CheckRow
              label="Tarjeta de propiedad"
              checked={hasPropertyCard}
              onPress={() => setHasPropertyCard((v) => !v)}
            />
            <GroupDivider />
            <CheckRow label="SOAT vigente" checked={hasSoat} onPress={() => setHasSoat((v) => !v)} />
            <GroupDivider />
            <CheckRow
              label="Revisión técnica"
              checked={hasTechnicalInspection}
              onPress={() => setHasTechnicalInspection((v) => !v)}
            />
          </SoftGroup>
        </Section>

        <Section title="Vehículo" optional>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <FilledInput
              value={vehicleMake}
              onChangeText={setVehicleMake}
              placeholder="Marca"
              accessibilityLabel="Marca"
              style={{ flex: 1 }}
            />
            <FilledInput
              value={vehicleModel}
              onChangeText={setVehicleModel}
              placeholder="Modelo"
              accessibilityLabel="Modelo"
              style={{ flex: 1 }}
            />
          </View>
          <FilledInput
            value={vehicleYear}
            onChangeText={(text) => setVehicleYear(text.replace(/\D/g, "").slice(0, 4))}
            placeholder="Año"
            accessibilityLabel="Año"
            keyboardType="number-pad"
            style={{ marginTop: 10 }}
          />
        </Section>

        <Section title="Abolladuras">
          <CarDamageCanvas marks={damageMarks} onChange={setDamageMarks} />
        </Section>

        <Section title="Observaciones" optional={!hasMarks}>
          <FilledInput
            value={damageNotes}
            onChangeText={setDamageNotes}
            placeholder={hasMarks ? "Describe las marcas que señalaste" : "Estado general del vehículo"}
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 96,
              borderWidth: hasMarks && !notesOk ? 2 : 0,
              borderColor: HERCOM_COLORS.warning,
            }}
          />
        </Section>

        <Section title="Seguro" optional>
          <SoftGroup>
            <CheckRow
              label="Tiene seguro vigente"
              checked={hasInsurance}
              onPress={() => setHasInsurance((v) => !v)}
            />
          </SoftGroup>
          {hasInsurance && (
            <FilledInput
              value={insuranceNotes}
              onChangeText={setInsuranceNotes}
              placeholder="Aseguradora o n.° de póliza"
              style={{ marginTop: 10 }}
            />
          )}
        </Section>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 1,
          borderTopColor: border,
          backgroundColor: colors.base,
        }}
      >
        <PillButton
          label="Guardar checklist"
          onPress={() => void handleSave()}
          loading={saving}
          disabled={!canSave}
        />
        <ErrorText message={error} />
      </View>
    </KeyboardAvoidingView>
  );
}

function Section({
  title,
  optional = false,
  children,
}: {
  title: string;
  optional?: boolean;
  children: ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={{ marginBottom: 28 }}>
      <SectionTitle>
        {title}
        {optional && (
          <Text style={{ fontFamily: POPPINS.regular, fontSize: 15, color: colors.steel }}>
            {"  · opcional"}
          </Text>
        )}
      </SectionTitle>
      {children}
    </View>
  );
}
