import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import {
  CarDamageCanvas,
  type DamageMark,
} from "../components/CarDamageCanvas";
import { UiButton, UiCard, UiInput } from "../components/ui";
import {
  TacticalLabel,
  TacticalText,
  TacticalTitle,
} from "../components/tactical";
import {
  TACTICAL_BORDER,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";

type Props = {
  serviceId: Id<"services">;
  onBack: () => void;
};

export function ChecklistRecojoScreen({ serviceId, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
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
  const [savedOk, setSavedOk] = useState(false);

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

  const docsOk = hasPropertyCard && hasSoat && hasTechnicalInspection;
  const hasMarks = damageMarks.length > 0;
  const notesOk = !hasMarks || damageNotes.trim().length > 0;
  const canSave = docsOk && notesOk;

  async function handleSave() {
    if (!canSave) {
      setError(
        !docsOk
          ? "Marca Tarjeta de propiedad, SOAT y Revisión técnica."
          : "Escribe observaciones si marcaste abolladuras.",
      );
      return;
    }
    setError(null);
    setSaving(true);
    setSavedOk(false);
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
      setSavedOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  if (checklist === undefined) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: TACTICAL_COLORS.base }}
      >
        <ActivityIndicator color={TACTICAL_COLORS.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{
        flex: 1,
        paddingTop: insets.top,
        backgroundColor: TACTICAL_COLORS.base,
      }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <View
        className="flex-row items-center px-4 py-3"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: TACTICAL_BORDER,
          backgroundColor: TACTICAL_COLORS.baseElevated,
        }}
      >
        <TouchableOpacity onPress={onBack} className="mr-3 py-1 pr-2">
          <TacticalLabel size={11} tone="accent">
            ← Volver
          </TacticalLabel>
        </TouchableOpacity>
        <TacticalTitle size={16} className="flex-1">
          Checklist de recojo
        </TacticalTitle>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 48,
        }}
      >
        <Section title="1. Documentos">
          <DocToggle
            label="Tarjeta de propiedad verificada"
            value={hasPropertyCard}
            onPress={() => setHasPropertyCard((v) => !v)}
          />
          <DocToggle
            label="SOAT verificado"
            value={hasSoat}
            onPress={() => setHasSoat((v) => !v)}
          />
          <DocToggle
            label="Revisión técnica verificada"
            value={hasTechnicalInspection}
            onPress={() => setHasTechnicalInspection((v) => !v)}
          />
        </Section>

        <Section title="2. Datos del vehículo">
          <Field
            label="Marca"
            value={vehicleMake}
            onChangeText={setVehicleMake}
            placeholder="Ej. Toyota"
          />
          <Field
            label="Modelo"
            value={vehicleModel}
            onChangeText={setVehicleModel}
            placeholder="Ej. Corolla"
          />
          <Field
            label="Año"
            value={vehicleYear}
            onChangeText={setVehicleYear}
            placeholder="Ej. 2019"
            keyboardType="number-pad"
          />
        </Section>

        <Section title="3. Abolladuras" flush>
          <CarDamageCanvas marks={damageMarks} onChange={setDamageMarks} />
        </Section>

        <Section title="4. Observaciones">
          <TextInput
            value={damageNotes}
            onChangeText={setDamageNotes}
            placeholder={
              hasMarks
                ? "Describe las marcas que señalaste"
                : "Estado general del vehículo"
            }
            placeholderTextColor="rgba(91, 132, 177, 0.7)"
            multiline
            textAlignVertical="top"
            className="min-h-[88px] px-4 py-3.5"
            style={{
              backgroundColor: TACTICAL_COLORS.surfaceSunken,
              borderRadius: TACTICAL_RADIUS.sharp,
              borderWidth: 1,
              borderColor: TACTICAL_BORDER,
              color: TACTICAL_COLORS.textStrong,
              fontSize: 15,
            }}
          />
        </Section>

        <Section title="5. Seguro">
          <DocToggle
            label="Tiene seguro vigente"
            value={hasInsurance}
            onPress={() => setHasInsurance((v) => !v)}
          />
          {hasInsurance && (
            <TextInput
              value={insuranceNotes}
              onChangeText={setInsuranceNotes}
              placeholder="Póliza o nota"
              placeholderTextColor="rgba(91, 132, 177, 0.7)"
              className="mt-2 px-4 py-3.5"
              style={{
                backgroundColor: TACTICAL_COLORS.surfaceSunken,
                borderRadius: TACTICAL_RADIUS.sharp,
                borderWidth: 1,
                borderColor: TACTICAL_BORDER,
                color: TACTICAL_COLORS.textStrong,
                fontSize: 15,
              }}
            />
          )}
        </Section>

        {error !== null && (
          <TacticalText
            size={12}
            className="mb-2"
            style={{ color: TACTICAL_COLORS.danger }}
          >
            {error}
          </TacticalText>
        )}
        {savedOk && (
          <TacticalText
            size={12}
            className="mb-2"
            style={{ color: TACTICAL_COLORS.success }}
          >
            Checklist guardado. Volvé a Servicios para iniciar el viaje.
          </TacticalText>
        )}

        <UiButton
          label={saving ? "Guardando…" : "Guardar checklist"}
          onPress={() => void handleSave()}
          disabled={saving || !canSave}
          loading={saving}
        />

        {savedOk && (
          <View className="mt-3">
            <UiButton
              label="Volver a servicios"
              variant="ghost"
              onPress={onBack}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({
  title,
  children,
  flush,
}: {
  title: string;
  children: ReactNode;
  flush?: boolean;
}) {
  return (
    <UiCard className={`mb-5 ${flush ? "overflow-hidden p-3" : ""}`.trim()}>
      <TacticalLabel size={10} tone="accent" className={`mb-3 ${flush ? "px-1" : ""}`}>
        {title}
      </TacticalLabel>
      {children}
    </UiCard>
  );
}

function DocToggle({
  label,
  value,
  onPress,
}: {
  label: string;
  value: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="mb-2 px-3 py-3"
      style={{
        backgroundColor: value
          ? "rgba(161, 196, 253, 0.14)"
          : TACTICAL_COLORS.surfaceSunken,
        borderRadius: TACTICAL_RADIUS.sharp,
        borderWidth: 1,
        borderColor: value ? TACTICAL_COLORS.accent : TACTICAL_BORDER,
      }}
    >
      <TacticalText size={13} tone={value ? "text" : "steel"}>
        {value ? "✓ " : "○ "}
        {label}
      </TacticalText>
    </TouchableOpacity>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "number-pad";
}) {
  return (
    <View className="mb-2">
      <TacticalLabel size={10} className="mb-1.5">
        {label}
      </TacticalLabel>
      <UiInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
      />
    </View>
  );
}
