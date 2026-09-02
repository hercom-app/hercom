import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useAction, useMutation } from "convex/react";
import { api } from "@proyecto/backend";
import {
  DEFAULT_COUNTRY_CODE,
  DriverRegionFields,
} from "../components/DriverRegionFields";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { OfficialDocumentHint } from "../components/OfficialDocumentHint";
import { UiButton, UiCard, UiChip, UiInput } from "../components/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CONDUCTOR_RECORD_URL,
  CUL_INFO_URL,
} from "../constants/officialDocuments";
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
  const insets = useSafeAreaInsets();
  const generateUploadUrl = useMutation(api.driverApplications.generateUploadUrl);
  const submitApplication = useMutation(api.driverApplications.submit);
  const lookupDni = useAction(api.reniec.lookupDni);

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
  const [conductorRecordPdf, setConductorRecordPdf] = useState<{
    uri: string;
    name: string;
  } | null>(null);
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [department, setDepartment] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");

  const [readyForGoogle, setReadyForGoogle] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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

    setValidatingDni(true);
    try {
      const result = await lookupDni({ dni: trimmed });
      setFirstName(result.firstName);
      setFirstLastName(result.firstLastName);
      setSecondLastName(result.secondLastName);
      setDniValidated(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo validar el DNI con RENIEC.";
      setFormError(message);
      onError?.(message);
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

  async function handlePickPdf(
    onPicked: (file: { uri: string; name: string }) => void,
  ) {
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
    onPicked({ uri: file.uri, name: file.name });
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
    if (conductorRecordPdf === null) {
      return "Sube el récord de conductor en PDF.";
    }
    if (department === "" || province === "" || district === "") {
      return "Selecciona país, departamento, provincia y distrito.";
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
      conductorRecordPdfUri: conductorRecordPdf!.uri,
      conductorRecordPdfName: conductorRecordPdf!.name,
      countryCode,
      department,
      province,
      district,
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
        setSubmitted(true);
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

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 32,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={onBack} className="mb-4 self-start">
        <Text className="text-sm font-semibold text-slate-500">← Volver</Text>
      </TouchableOpacity>

      <Text className="mb-2 text-2xl font-bold text-slate-900">
        Registro de chofer
      </Text>
      <Text className="mb-6 text-sm leading-5 text-slate-500">
        Valida tu DNI y adjunta tus documentos. Hercom revisará tu solicitud.
      </Text>

      {submitted ? (
        <UiCard>
          <Text className="text-center text-lg font-bold text-slate-900">
            Solicitud enviada
          </Text>
          <Text className="mt-3 text-center text-sm leading-6 text-slate-500">
            Recibimos tu registro. El equipo de Hercom revisará tu información y
            documentos. Te avisaremos cuando tu perfil de chofer esté habilitado.
          </Text>
          <View className="mt-6">
            <UiButton label="Volver al inicio" onPress={onBack} />
          </View>
        </UiCard>
      ) : (
      <UiCard>
        <Text className="mb-2 text-sm font-semibold text-slate-500">DNI</Text>
        <View className="mb-3 flex-row gap-2">
          <UiInput
            value={dni}
            onChangeText={(v) => setDni(v.replace(/\D/g, "").slice(0, 8))}
            placeholder="8 dígitos"
            keyboardType="number-pad"
            className="flex-1"
          />
          <TouchableOpacity
            onPress={() => void handleValidateDni()}
            disabled={validatingDni || dni.length !== 8}
            className="h-[52px] items-center justify-center rounded-2xl bg-hercom px-4 disabled:opacity-45"
          >
            {validatingDni ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="font-bold text-white">Validar</Text>
            )}
          </TouchableOpacity>
        </View>

        {dniValidated && (
          <View className="mb-4 gap-2">
            <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Según RENIEC
            </Text>
            <ReniecRow label="Nombres" value={firstName} />
            <ReniecRow label="Apellido paterno" value={firstLastName} />
            <ReniecRow label="Apellido materno" value={secondLastName} />
          </View>
        )}

        <DriverRegionFields
          countryCode={countryCode}
          department={department}
          province={province}
          district={district}
          onCountryCodeChange={setCountryCode}
          onDepartmentChange={setDepartment}
          onProvinceChange={setProvince}
          onDistrictChange={setDistrict}
        />

        <View className="mb-4 rounded-2xl bg-slate-100 px-4 py-3">
          <Text className="text-xs leading-5 text-slate-600">
            Tu zona de operación será validada por Hercom. Hasta entonces no podrás
            usar el modo conductor.
          </Text>
        </View>

        <Text className="mb-2 text-sm font-semibold text-slate-500">
          Número de brevete
        </Text>
        <UiInput
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          placeholder="Ej. Q12345678"
          className="mb-4"
        />

        <Text className="mb-2 text-sm font-semibold text-slate-500">
          Categoría de brevete
        </Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {LICENSE_CATEGORIES.map((cat) => (
            <UiChip
              key={cat}
              label={cat}
              selected={licenseCategory === cat}
              onPress={() => setLicenseCategory(cat)}
            />
          ))}
        </View>

        <Text className="mb-2 text-sm font-semibold text-slate-500">Sexo</Text>
        <View className="mb-4 flex-row gap-2">
          {(["M", "F"] as const).map((value) => (
            <UiChip
              key={value}
              label={value === "M" ? "Masculino" : "Femenino"}
              selected={sex === value}
              onPress={() => setSex(value)}
            />
          ))}
        </View>

        <Text className="mb-2 text-sm font-semibold text-slate-500">
          Fotos del brevete
        </Text>
        <TouchableOpacity
          onPress={() => void handlePickLicensePhoto()}
          disabled={licensePhotos.length >= 3}
          className="mb-2 rounded-2xl bg-slate-100 py-4 disabled:opacity-50"
        >
          <Text className="text-center text-sm font-semibold text-slate-800">
            + Agregar foto ({licensePhotos.length}/3)
          </Text>
        </TouchableOpacity>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {licensePhotos.map((photo) => (
            <Image
              key={photo.uri}
              source={{ uri: photo.uri }}
              className="h-20 w-20 rounded-xl"
            />
          ))}
        </View>

        <OfficialDocumentHint
          title="CUL (PDF)"
          description="El Certificado Único Laboral lo emite el Ministerio de Trabajo. Incluye datos personales, antecedentes y experiencia laboral. Descárgalo en PDF y súbelo aquí."
          linkLabel="Obtener CUL en gob.pe"
          url={CUL_INFO_URL}
        />
        <TouchableOpacity
          onPress={() => void handlePickPdf(setCulPdf)}
          className="mb-6 rounded-2xl bg-slate-100 py-4"
        >
          <Text className="text-center text-sm font-semibold text-slate-800">
            {culPdf !== null ? `✓ ${culPdf.name}` : "+ Subir PDF del CUL"}
          </Text>
        </TouchableOpacity>

        <OfficialDocumentHint
          title="Récord de conductor (PDF)"
          description="El récord de conductor del MTC muestra infracciones y el estado de tu licencia. Consúltalo, descárgalo y súbelo en PDF."
          linkLabel="Consultar récord en MTC"
          url={CONDUCTOR_RECORD_URL}
        />
        <TouchableOpacity
          onPress={() => void handlePickPdf(setConductorRecordPdf)}
          className="mb-6 rounded-2xl bg-slate-100 py-4"
        >
          <Text className="text-center text-sm font-semibold text-slate-800">
            {conductorRecordPdf !== null
              ? `✓ ${conductorRecordPdf.name}`
              : "+ Subir PDF del récord de conductor"}
          </Text>
        </TouchableOpacity>

        {formError !== null && (
          <View className="mb-4 rounded-xl bg-red-50 px-3 py-2">
            <Text className="text-center text-sm text-red-600">{formError}</Text>
          </View>
        )}

        {!readyForGoogle && !submitAsAuthenticated ? (
          <UiButton
            label="Continuar"
            onPress={() => void handlePrepareSubmit()}
            disabled={submitting}
          />
        ) : submitAsAuthenticated ? (
          <UiButton
            label="Enviar solicitud de chofer"
            onPress={() => void handlePrepareSubmit()}
            disabled={submitting}
            loading={submitting}
          />
        ) : (
          <View>
            <Text className="mb-3 text-center text-sm text-slate-500">
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
      </UiCard>
      )}
    </ScrollView>
  );
}

function ReniecRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-2xl bg-slate-50 px-4 py-3">
      <Text className="text-xs text-slate-400">{label}</Text>
      <Text className="mt-0.5 text-base font-medium text-slate-900">{value}</Text>
    </View>
  );
}
