import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
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
      <View className="flex-1 items-center justify-center bg-slate-100">
        <ActivityIndicator color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-100"
      style={{ flex: 1, paddingTop: insets.top }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <View className="flex-row items-center border-b border-slate-200 bg-white px-4 py-3">
        <TouchableOpacity onPress={onBack} className="mr-3 py-1 pr-2">
          <Text className="text-sm font-semibold text-brand">← Volver</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-base font-bold text-slate-900">
          Checklist de recojo
        </Text>
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
            multiline
            className="min-h-[88px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
            textAlignVertical="top"
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
              className="mt-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
            />
          )}
        </Section>

        {error !== null && (
          <Text className="mb-2 text-xs font-semibold text-red-600">{error}</Text>
        )}
        {savedOk && (
          <Text className="mb-2 text-xs font-semibold text-emerald-700">
            Checklist guardado. Volvé a Servicios para iniciar el viaje.
          </Text>
        )}

        <TouchableOpacity
          onPress={() => void handleSave()}
          disabled={saving}
          className={`rounded-2xl py-3 ${
            canSave ? "bg-brand active:bg-brand-dark" : "bg-slate-300"
          } disabled:opacity-60`}
        >
          <Text className="text-center text-sm font-bold text-white">
            {saving ? "Guardando…" : "Guardar checklist"}
          </Text>
        </TouchableOpacity>

        {savedOk && (
          <TouchableOpacity onPress={onBack} className="mt-3 py-2">
            <Text className="text-center text-sm font-semibold text-brand">
              Volver a servicios
            </Text>
          </TouchableOpacity>
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
    <View
      className={`mb-5 rounded-2xl bg-white shadow-sm ${
        flush ? "overflow-hidden p-3" : "p-4"
      }`}
    >
      <Text
        className={`mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 ${
          flush ? "px-1" : ""
        }`}
      >
        {title}
      </Text>
      {children}
    </View>
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
      className={`mb-2 rounded-xl border px-3 py-3 ${
        value
          ? "border-emerald-300 bg-emerald-50"
          : "border-slate-300 bg-slate-50"
      }`}
    >
      <Text
        className={`text-sm font-semibold ${
          value ? "text-emerald-800" : "text-slate-700"
        }`}
      >
        {value ? "✓ " : "○ "}
        {label}
      </Text>
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
      <Text className="mb-1 text-base font-semibold text-slate-600">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
      />
    </View>
  );
}
