import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "convex/react";
import { api } from "@proyecto/backend";
import { HercomLogo } from "../components/HercomLogo";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import {
  savePendingDriverRegistration,
  submitDriverApplicationFromPending,
  type PendingDriverRegistration,
} from "../lib/driverRegistration";

const LICENSE_CATEGORIES = [
  "A-I",
  "A-IIa",
  "A-IIb",
  "A-IIIa",
  "A-IIIb",
  "B",
  "C",
  "D",
] as const;

type DriverRegisterScreenProps = {
  onBack: () => void;
  onError?: (message: string) => void;
  /** Usuario ya autenticado: envía sin volver a pasar por Google. */
  submitAsAuthenticated?: boolean;
  onSubmitSuccess?: () => void;
};

type LocalPhoto = { uri: string; mimeType: string };

export function DriverRegisterScreen({
  onBack,
  onError,
  submitAsAuthenticated = false,
  onSubmitSuccess,
}: DriverRegisterScreenProps) {
  const generateUploadUrl = useMutation(api.driverApplications.generateUploadUrl);
  const submitApplication = useMutation(api.driverApplications.submit);

  const [dni, setDni] = useState("");
  const [firstName, setFirstName] = useState("");
  const [firstLastName, setFirstLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [dniValidated, setDniValidated] = useState(false);
  const [validatingDni, setValidatingDni] = useState(false);

  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseCategory, setLicenseCategory] = useState<string>(
    LICENSE_CATEGORIES[0],
  );
  const [sex, setSex] = useState<"M" | "F" | null>(null);

  const [licensePhotos, setLicensePhotos] = useState<LocalPhoto[]>([]);
  const [culPdf, setCulPdf] = useState<{ uri: string; name: string } | null>(
    null,
  );

  const [readyForGoogle, setReadyForGoogle] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setDniValidated(false);
    setFirstName("");
    setFirstLastName("");
    setSecondLastName("");
  }, [dni]);

  async function handleValidateDni() {
    setFormError(null);
    const trimmed = dni.trim();
    if (!/^\d{8}$/.test(trimmed)) {
      setFormError("El DNI debe tener exactamente 8 dígitos.");
      return;
    }

    // DEMO: sin DECOLECTA_API_KEY / RENIEC. Nombres editables.
    // TODO: restaurar api.reniec.lookupDni cuando la key esté en Convex empresa.
    setValidatingDni(true);
    try {
      setFirstName((prev) => (prev.trim() !== "" ? prev : "Chofer"));
      setFirstLastName((prev) => (prev.trim() !== "" ? prev : "Demo"));
      setSecondLastName((prev) => (prev.trim() !== "" ? prev : "Hercom"));
      setDniValidated(true);
    } finally {
      setValidatingDni(false);
    }
  }

  async function handlePickLicensePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError("Necesitamos acceso a la galería para las fotos del brevete.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsMultipleSelection: true,
      selectionLimit: 3 - licensePhotos.length,
    });
    if (result.canceled) {
      return;
    }
    const newPhotos = result.assets.map((asset) => ({
      uri: asset.uri,
      mimeType: asset.mimeType ?? "image/jpeg",
    }));
    setLicensePhotos((prev) => [...prev, ...newPhotos].slice(0, 3));
  }

  async function handlePickCul() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (result.canceled || result.assets.length === 0) {
      return;
    }
    const file = result.assets[0];
    if (file === undefined) {
      setFormError("No se pudo leer el archivo PDF seleccionado.");
      return;
    }
    setCulPdf({ uri: file.uri, name: file.name });
  }

  function validateForm(): string | null {
    if (!dniValidated) {
      return "Valida tu DNI con RENIEC antes de continuar.";
    }
    if (licenseNumber.trim() === "") {
      return "Ingresa el número de brevete.";
    }
    if (sex === null) {
      return "Selecciona tu sexo.";
    }
    if (licensePhotos.length === 0) {
      return "Sube al menos una foto del brevete.";
    }
    if (culPdf === null) {
      return "Sube el CUL en PDF.";
    }
    return null;
  }

  async function handlePrepareSubmit() {
    setFormError(null);
    const validationError = validateForm();
    if (validationError !== null) {
      setFormError(validationError);
      return;
    }

    const pending: PendingDriverRegistration = {
      dni: dni.trim(),
      firstName,
      firstLastName,
      secondLastName,
      sex: sex as "M" | "F",
      licenseNumber: licenseNumber.trim(),
      licenseCategory,
      licensePhotoUris: licensePhotos,
      culPdfUri: culPdf!.uri,
      culPdfName: culPdf!.name,
    };

    await savePendingDriverRegistration(pending);

    if (submitAsAuthenticated) {
      setSubmitting(true);
      try {
        await submitDriverApplicationFromPending(
          pending,
          () => generateUploadUrl({}),
          (args) => submitApplication(args),
        );
        onSubmitSuccess?.();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo enviar la solicitud de chofer.";
        setFormError(message);
        onError?.(message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setReadyForGoogle(true);
  }

  const inputClass =
    "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900";

  return (
    <ScrollView
      className="flex-1 bg-hercom"
      contentContainerClassName="px-6 pb-10 pt-6"
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={onBack} className="mb-4 self-start">
        <Text className="text-sm font-semibold text-white">← Volver</Text>
      </TouchableOpacity>

      <View className="mb-6 items-center">
        <HercomLogo width={160} />
        <Text className="mt-4 text-xl font-bold text-white">
          Registro de chofer
        </Text>
        <Text className="mt-1 text-center text-sm text-white/80">
          Demo: Validar no consulta RENIEC. Completa nombres a mano o usa Modo
          conductor en el menú.
        </Text>
      </View>

      <View className="rounded-3xl bg-white p-5 shadow-lg">
        {/* DNI — validación formal pendiente (Decolecta) */}
        <Text className="mb-2 text-sm font-semibold text-slate-700">DNI</Text>
        <View className="mb-3 flex-row gap-2">
          <TextInput
            value={dni}
            onChangeText={(v) => setDni(v.replace(/\D/g, "").slice(0, 8))}
            placeholder="8 dígitos"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            className={`${inputClass} flex-1`}
          />
          <TouchableOpacity
            onPress={() => void handleValidateDni()}
            disabled={validatingDni || dni.length !== 8}
            className="items-center justify-center rounded-2xl bg-hercom px-4 disabled:opacity-50"
          >
            {validatingDni ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-bold text-white">Validar</Text>
            )}
          </TouchableOpacity>
        </View>

        {dniValidated && (
          <View className="mb-4 gap-2 rounded-2xl bg-amber-50 px-4 py-3">
            <Text className="text-xs font-semibold uppercase text-amber-800">
              Demo · sin RENIEC — edita tus datos
            </Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Nombres"
              placeholderTextColor="#94A3B8"
              className={inputClass}
            />
            <TextInput
              value={firstLastName}
              onChangeText={setFirstLastName}
              placeholder="Apellido paterno"
              placeholderTextColor="#94A3B8"
              className={inputClass}
            />
            <TextInput
              value={secondLastName}
              onChangeText={setSecondLastName}
              placeholder="Apellido materno"
              placeholderTextColor="#94A3B8"
              className={inputClass}
            />
          </View>
        )}

        {/* Brevete */}
        <Text className="mb-2 text-sm font-semibold text-slate-700">
          Número de brevete
        </Text>
        <TextInput
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          placeholder="Ej. Q12345678"
          placeholderTextColor="#94A3B8"
          className={`${inputClass} mb-4`}
        />

        <Text className="mb-2 text-sm font-semibold text-slate-700">
          Categoría de brevete
        </Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {LICENSE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setLicenseCategory(cat)}
              className={`rounded-xl border px-3 py-2 ${
                licenseCategory === cat
                  ? "border-hercom bg-blue-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  licenseCategory === cat ? "text-hercom" : "text-slate-600"
                }`}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sexo */}
        <Text className="mb-2 text-sm font-semibold text-slate-700">Sexo</Text>
        <View className="mb-4 flex-row gap-3">
          {(["M", "F"] as const).map((value) => (
            <TouchableOpacity
              key={value}
              onPress={() => setSex(value)}
              className={`flex-1 rounded-2xl border py-3 ${
                sex === value
                  ? "border-hercom bg-blue-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  sex === value ? "text-hercom" : "text-slate-600"
                }`}
              >
                {value === "M" ? "Masculino" : "Femenino"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fotos brevete */}
        <Text className="mb-2 text-sm font-semibold text-slate-700">
          Fotos del brevete
        </Text>
        <TouchableOpacity
          onPress={() => void handlePickLicensePhoto()}
          disabled={licensePhotos.length >= 3}
          className="mb-2 rounded-2xl border border-dashed border-slate-300 py-4 disabled:opacity-50"
        >
          <Text className="text-center text-sm font-semibold text-hercom">
            + Agregar foto ({licensePhotos.length}/3)
          </Text>
        </TouchableOpacity>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {licensePhotos.map((photo, index) => (
            <Image
              key={photo.uri}
              source={{ uri: photo.uri }}
              className="h-20 w-20 rounded-xl"
            />
          ))}
        </View>

        {/* CUL PDF */}
        <Text className="mb-2 text-sm font-semibold text-slate-700">
          CUL (PDF)
        </Text>
        <TouchableOpacity
          onPress={() => void handlePickCul()}
          className="mb-6 rounded-2xl border border-dashed border-slate-300 py-4"
        >
          <Text className="text-center text-sm font-semibold text-hercom">
            {culPdf !== null ? `✓ ${culPdf.name}` : "+ Subir PDF del CUL"}
          </Text>
        </TouchableOpacity>

        {formError !== null && (
          <View className="mb-4 rounded-xl bg-red-50 px-3 py-2">
            <Text className="text-center text-sm text-red-600">{formError}</Text>
          </View>
        )}

        {!readyForGoogle && !submitAsAuthenticated ? (
          <TouchableOpacity
            onPress={() => void handlePrepareSubmit()}
            disabled={submitting}
            className="rounded-2xl bg-hercom py-3.5 disabled:opacity-60"
          >
            <Text className="text-center text-base font-bold text-white">
              Continuar
            </Text>
          </TouchableOpacity>
        ) : submitAsAuthenticated ? (
          <TouchableOpacity
            onPress={() => void handlePrepareSubmit()}
            disabled={submitting}
            className="rounded-2xl bg-hercom py-3.5 disabled:opacity-60"
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-center text-base font-bold text-white">
                Activar perfil de chofer
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <View>
            <Text className="mb-3 text-center text-sm text-slate-600">
              Crea tu cuenta con Google para enviar la solicitud.
            </Text>
            <GoogleSignInButton
              label="Registrarse con Google y enviar"
              onError={(message) => {
                setFormError(message);
                setReadyForGoogle(false);
              }}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
