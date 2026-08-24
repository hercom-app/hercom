import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation } from "convex/react";
import { api } from "@proyecto/backend";

type DriverPayoutFields = {
  fullName?: string;
  dni?: string;
  yape?: string;
  plin?: string;
  bankAccount1?: string;
  bankAccount2?: string;
  bankAccount3?: string;
};

type DriverPayoutConfigProps = {
  driver: DriverPayoutFields;
  fallbackName?: string;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "number-pad" | "phone-pad";
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs font-semibold text-slate-600">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
      />
    </View>
  );
}

/** Formulario de datos de cobro del chofer (menú lateral → Datos de cobro). */
export function DriverPayoutConfig({
  driver,
  fallbackName = "",
}: DriverPayoutConfigProps) {
  const updatePayout = useMutation(api.drivers.updateMyPayoutProfile);
  const [fullName, setFullName] = useState("");
  const [dni, setDni] = useState("");
  const [yape, setYape] = useState("");
  const [plin, setPlin] = useState("");
  const [bankAccount1, setBankAccount1] = useState("");
  const [bankAccount2, setBankAccount2] = useState("");
  const [bankAccount3, setBankAccount3] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(driver.fullName?.trim() || fallbackName);
    setDni(driver.dni?.trim() || "");
    setYape(driver.yape?.trim() || "");
    setPlin(driver.plin?.trim() || "");
    setBankAccount1(driver.bankAccount1?.trim() || "");
    setBankAccount2(driver.bankAccount2?.trim() || "");
    setBankAccount3(driver.bankAccount3?.trim() || "");
  }, [
    fallbackName,
    driver.fullName,
    driver.dni,
    driver.yape,
    driver.plin,
    driver.bankAccount1,
    driver.bankAccount2,
    driver.bankAccount3,
  ]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await updatePayout({
        fullName,
        dni,
        yape,
        plin,
        bankAccount1,
        bankAccount2,
        bankAccount3,
      });
      setMessage("Datos de cobro guardados.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron guardar los datos.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <Text className="mb-1 text-sm font-bold text-slate-900">
          Datos para el anticipo
        </Text>
        <Text className="mb-4 text-xs text-slate-500">
          El cliente verá estos datos para transferirte el 25% antes del viaje.
        </Text>

        <Field
          label="Nombres"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Nombres y apellidos"
        />
        <Field
          label="DNI"
          value={dni}
          onChangeText={setDni}
          placeholder="8 dígitos"
          keyboardType="number-pad"
        />
        <Field
          label="Yape"
          value={yape}
          onChangeText={setYape}
          placeholder="Celular o código Yape"
          keyboardType="phone-pad"
        />
        <Field
          label="Plin"
          value={plin}
          onChangeText={setPlin}
          placeholder="Celular o código Plin"
          keyboardType="phone-pad"
        />
        <Field
          label="Cuenta de banco 1"
          value={bankAccount1}
          onChangeText={setBankAccount1}
          placeholder="Banco · CCI o número"
        />
        <Field
          label="Cuenta de banco 2"
          value={bankAccount2}
          onChangeText={setBankAccount2}
          placeholder="Opcional"
        />
        <Field
          label="Cuenta de banco 3"
          value={bankAccount3}
          onChangeText={setBankAccount3}
          placeholder="Opcional"
        />

        <TouchableOpacity
          onPress={() => void handleSave()}
          disabled={saving}
          className="mt-2 items-center rounded-2xl bg-hercom py-3.5 disabled:opacity-60"
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-base font-bold text-white">Guardar</Text>
          )}
        </TouchableOpacity>
        {message !== null && (
          <Text className="mt-2 text-center text-xs font-medium text-success">
            {message}
          </Text>
        )}
        {error !== null && (
          <Text className="mt-2 text-center text-xs font-medium text-red-600">
            {error}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
