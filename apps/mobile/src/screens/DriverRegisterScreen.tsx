import { useEffect, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import {
  DEFAULT_COUNTRY_CODE,
  DriverRegionFields,
} from "../components/DriverRegionFields";
import {
  DocumentPreviewModal,
  type PreviewFile,
} from "../components/DocumentPreviewModal";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { HamburgerButton } from "../components/HamburgerButton";
import { OfficialDocumentHint } from "../components/OfficialDocumentHint";
import { SideDrawer } from "../components/SideDrawer";
import { UiButton, UiCard, UiChip, UiInput } from "../components/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppMode } from "../contexts/AppModeContext";
import {
  CONDUCTOR_RECORD_URL,
  CUL_INFO_URL,
  DIGITAL_LICENSE_URL,
} from "../constants/officialDocuments";
import { PERU_LICENSE_CLASS_A } from "../constants/peruLicenseCategories";
import {
  savePendingDriverRegistration,
  submitDriverApplicationFromPending,
  type PendingDriverRegistration,
} from "../lib/driverRegistration";

type LicenseFormat = "physical" | "digital";
type VehicleBodyType = "auto" | "camioneta";
type LocalPhoto = { uri: string; mimeType: string };
type LocalDoc = { uri: string; name: string; kind: "image" | "pdf" };

type DriverRegisterScreenProps = {
  onBack: () => void;
  onError?: (message: string) => void;
  submitAsAuthenticated?: boolean;
  onSubmitSuccess?: () => void;
};

export function DriverRegisterScreen({
  onBack,
  onError,
  submitAsAuthenticated = false,
  onSubmitSuccess,
}: DriverRegisterScreenProps) {
  const insets = useSafeAreaInsets();
  const { userName } = useAppMode();
  const me = useQuery(api.users.getMe);
  const notifications = useQuery(api.notifications.listMine, { limit: 8 });
  const generateUploadUrl = useMutation(api.driverApplications.generateUploadUrl);
  const submitApplication = useMutation(api.driverApplications.submit);
  const lookupDni = useAction(api.reniec.lookupDni);

  const [dni, setDni] = useState("");
  const [firstName, setFirstName] = useState("");
  const [firstLastName, setFirstLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [dniValidated, setDniValidated] = useState(false);
  const [validatingDni, setValidatingDni] = useState(false);
  const [sex, setSex] = useState<"M" | "F" | null>(null);

  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [department, setDepartment] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");

  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseCategory, setLicenseCategory] = useState<string>(
    PERU_LICENSE_CLASS_A[0],
  );
  const [licenseFormat, setLicenseFormat] = useState<LicenseFormat>("physical");
  const [licenseFront, setLicenseFront] = useState<LocalPhoto | null>(null);
  const [licenseBack, setLicenseBack] = useState<LocalPhoto | null>(null);
  const [licenseSelfie, setLicenseSelfie] = useState<LocalPhoto | null>(null);
  const [licenseDigital, setLicenseDigital] = useState<LocalDoc | null>(null);
  const [vehicleBodyType, setVehicleBodyType] =
    useState<VehicleBodyType | null>(null);

  const [culPdf, setCulPdf] = useState<LocalDoc | null>(null);
  const [conductorRecordPdf, setConductorRecordPdf] = useState<LocalDoc | null>(
    null,
  );

  const [preview, setPreview] = useState<PreviewFile | null>(null);
  const [readyForGoogle, setReadyForGoogle] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const unreadNotifications = (notifications ?? []).filter(
    (n) => n.readAt === undefined,
  ).length;

  const drawer = (
    <SideDrawer
      visible={menuOpen}
      onClose={() => setMenuOpen(false)}
      userName={userName}
      avatarUrl={me?.selfieUrl}
      unreadCount={unreadNotifications}
      onSelectItem={() => {
        setMenuOpen(false);
        onBack();
      }}
    />
  );

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

  async function pickFromGallery(onPicked: (photo: LocalPhoto) => void) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError("Necesitamos acceso a la galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsMultipleSelection: false,
    });
    if (result.canceled || result.assets.length === 0) {
      return;
    }
    const asset = result.assets[0];
    if (asset === undefined) {
      return;
    }
    onPicked({
      uri: asset.uri,
      mimeType: asset.mimeType ?? "image/jpeg",
    });
  }

  async function pickFromCamera(onPicked: (photo: LocalPhoto) => void) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setFormError("Necesitamos acceso a la cámara.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (result.canceled || result.assets.length === 0) {
      return;
    }
    const asset = result.assets[0];
    if (asset === undefined) {
      return;
    }
    onPicked({
      uri: asset.uri,
      mimeType: asset.mimeType ?? "image/jpeg",
    });
  }

  function choosePhotoSource(onPicked: (photo: LocalPhoto) => void) {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancelar", "Tomar foto", "Elegir de galería"],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) {
            void pickFromCamera(onPicked);
          } else if (index === 2) {
            void pickFromGallery(onPicked);
          }
        },
      );
      return;
    }
    Alert.alert("Agregar foto", "Elige una opción", [
      { text: "Cancelar", style: "cancel" },
      { text: "Tomar foto", onPress: () => void pickFromCamera(onPicked) },
      {
        text: "Galería",
        onPress: () => void pickFromGallery(onPicked),
      },
    ]);
  }

  async function handlePickPdf(onPicked: (file: LocalDoc) => void) {
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
    onPicked({ uri: file.uri, name: file.name, kind: "pdf" });
  }

  function chooseDigitalLicenseSource() {
    const options = [
      { text: "Cancelar", style: "cancel" as const },
      {
        text: "PDF",
        onPress: () => void handlePickPdf(setLicenseDigital),
      },
      {
        text: "Tomar foto",
        onPress: () =>
          void pickFromCamera((photo) =>
            setLicenseDigital({
              uri: photo.uri,
              name: "brevete-digital.jpg",
              kind: "image",
            }),
          ),
      },
      {
        text: "Galería",
        onPress: () =>
          void pickFromGallery((photo) =>
            setLicenseDigital({
              uri: photo.uri,
              name: "brevete-digital.jpg",
              kind: "image",
            }),
          ),
      },
    ];
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancelar", "PDF", "Tomar foto", "Galería"],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) {
            void handlePickPdf(setLicenseDigital);
          } else if (index === 2) {
            void pickFromCamera((photo) =>
              setLicenseDigital({
                uri: photo.uri,
                name: "brevete-digital.jpg",
                kind: "image",
              }),
            );
          } else if (index === 3) {
            void pickFromGallery((photo) =>
              setLicenseDigital({
                uri: photo.uri,
                name: "brevete-digital.jpg",
                kind: "image",
              }),
            );
          }
        },
      );
      return;
    }
    Alert.alert("Brevete digital", "PDF o imagen", options);
  }

  function renderLicensePhotoSlot(
    label: string,
    photo: LocalPhoto | null,
    onPicked: (photo: LocalPhoto) => void,
  ) {
    return (
      <View className="mb-3">
        <Text className="mb-1.5 text-xs font-semibold text-slate-600">{label}</Text>
        <TouchableOpacity
          onPress={() => choosePhotoSource(onPicked)}
          className="overflow-hidden rounded-2xl bg-slate-100"
        >
          {photo !== null ? (
            <Image
              source={{ uri: photo.uri }}
              className="h-28 w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="items-center py-6">
              <Text className="text-sm font-semibold text-slate-800">
                + Agregar foto
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                Cámara o galería
              </Text>
            </View>
          )}
        </TouchableOpacity>
        {photo !== null ? (
          <TouchableOpacity
            onPress={() =>
              setPreview({ uri: photo.uri, name: label, kind: "image" })
            }
            className="mt-2"
          >
            <Text className="text-center text-xs font-semibold text-hercom">
              Vista previa
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  function renderPdfSlot(
    label: string,
    emptyLabel: string,
    doc: LocalDoc | null,
    onPick: () => void,
  ) {
    return (
      <View className="mb-6">
        <TouchableOpacity
          onPress={onPick}
          className="rounded-2xl bg-slate-100 py-4"
        >
          <Text className="text-center text-sm font-semibold text-slate-800">
            {doc !== null ? `✓ ${doc.name}` : emptyLabel}
          </Text>
        </TouchableOpacity>
        {doc !== null ? (
          <TouchableOpacity
            onPress={() =>
              setPreview({ uri: doc.uri, name: doc.name, kind: doc.kind })
            }
            className="mt-2"
          >
            <Text className="text-center text-xs font-semibold text-hercom">
              Vista previa {label}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  function validateForm(): string | null {
    if (!dniValidated) {
      return "Valida tu DNI con RENIEC antes de continuar.";
    }
    if (sex === null) {
      return "Selecciona tu sexo.";
    }
    if (department === "" || province === "" || district === "") {
      return "Selecciona país, departamento, provincia y distrito.";
    }
    if (licenseNumber.trim() === "") {
      return "Ingresa el número de brevete.";
    }
    if (vehicleBodyType === null) {
      return "Indica si tu vehículo es auto o camioneta.";
    }
    if (licenseFormat === "physical") {
      if (licenseFront === null || licenseBack === null || licenseSelfie === null) {
        return "Sube anverso, reverso y selfie con el brevete físico.";
      }
    } else {
      if (licenseDigital === null) {
        return "Sube el brevete digital (PDF o imagen).";
      }
      if (licenseSelfie === null) {
        return "Sube la selfie sosteniendo el brevete impreso.";
      }
    }
    if (conductorRecordPdf === null) {
      return "Sube el récord de conductor en PDF.";
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

    let licensePhotoUris: LocalPhoto[];
    let licensePdfUri: string | undefined;
    let licensePdfName: string | undefined;

    if (licenseFormat === "physical") {
      licensePhotoUris = [licenseFront!, licenseBack!, licenseSelfie!];
    } else if (licenseDigital!.kind === "image") {
      licensePhotoUris = [
        {
          uri: licenseDigital!.uri,
          mimeType: "image/jpeg",
        },
        licenseSelfie!,
      ];
    } else {
      licensePhotoUris = [licenseSelfie!];
      licensePdfUri = licenseDigital!.uri;
      licensePdfName = licenseDigital!.name;
    }

    const pending: PendingDriverRegistration = {
      dni: dni.trim(),
      firstName,
      firstLastName,
      secondLastName,
      sex: sex as "M" | "F",
      licenseNumber: licenseNumber.trim(),
      licenseCategory,
      licenseFormat,
      licensePhotoUris,
      ...(licensePdfUri !== undefined
        ? { licensePdfUri, licensePdfName }
        : {}),
      vehicleBodyType: vehicleBodyType as VehicleBodyType,
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
    <View className="flex-1 bg-canvas">
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="z-10 flex-row items-center px-4 pb-2"
      >
        <HamburgerButton onPress={() => setMenuOpen(true)} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
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
              Recibimos tu registro. El equipo de Hercom revisará tu información
              y documentos. Te avisaremos cuando tu perfil de chofer esté
              habilitado.
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
              {PERU_LICENSE_CLASS_A.map((cat) => (
                <UiChip
                  key={cat}
                  label={cat}
                  selected={licenseCategory === cat}
                  onPress={() => setLicenseCategory(cat)}
                />
              ))}
            </View>

            <Text className="mb-2 text-sm font-semibold text-slate-500">
              Tipo de vehículo
            </Text>
            <View className="mb-4 flex-row gap-2">
              <UiChip
                label="Auto"
                selected={vehicleBodyType === "auto"}
                onPress={() => setVehicleBodyType("auto")}
              />
              <UiChip
                label="Camioneta"
                selected={vehicleBodyType === "camioneta"}
                onPress={() => setVehicleBodyType("camioneta")}
              />
            </View>

            <Text className="mb-2 text-sm font-semibold text-slate-500">
              Tipo de brevete
            </Text>
            <View className="mb-3 flex-row gap-2">
              <UiChip
                label="Físico (tarjeta)"
                selected={licenseFormat === "physical"}
                onPress={() => {
                  setLicenseFormat("physical");
                  setLicenseDigital(null);
                }}
              />
              <UiChip
                label="Digital"
                selected={licenseFormat === "digital"}
                onPress={() => {
                  setLicenseFormat("digital");
                  setLicenseFront(null);
                  setLicenseBack(null);
                }}
              />
            </View>

            <Text className="mb-2 text-sm font-semibold text-slate-500">
              {licenseFormat === "physical"
                ? "Fotos del brevete físico"
                : "Brevete digital + selfie"}
            </Text>
            {licenseFormat === "physical" ? (
              <>
                {renderLicensePhotoSlot(
                  "Anverso del brevete",
                  licenseFront,
                  setLicenseFront,
                )}
                {renderLicensePhotoSlot(
                  "Reverso del brevete",
                  licenseBack,
                  setLicenseBack,
                )}
                {renderLicensePhotoSlot(
                  "Selfie sosteniendo el brevete",
                  licenseSelfie,
                  setLicenseSelfie,
                )}
              </>
            ) : (
              <>
                <OfficialDocumentHint
                  title="Licencia digital MTC"
                  description="Consulta o descarga tu brevete digital. Puedes subir PDF o una imagen."
                  linkLabel="Abrir licencias.mtc.gob.pe"
                  url={DIGITAL_LICENSE_URL}
                />
                <View className="mb-3 rounded-2xl bg-amber-50 px-4 py-3">
                  <Text className="text-xs leading-5 text-amber-900">
                    Si tu brevete es digital, imprímelo en tamaño real antes de la
                    selfie. Debes sostener el documento impreso junto a tu rostro.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={chooseDigitalLicenseSource}
                  className="mb-2 rounded-2xl bg-slate-100 py-4"
                >
                  <Text className="text-center text-sm font-semibold text-slate-800">
                    {licenseDigital !== null
                      ? `✓ ${licenseDigital.name}`
                      : "+ Subir PDF o imagen del brevete"}
                  </Text>
                </TouchableOpacity>
                {licenseDigital !== null ? (
                  <TouchableOpacity
                    onPress={() =>
                      setPreview({
                        uri: licenseDigital.uri,
                        name: licenseDigital.name,
                        kind: licenseDigital.kind,
                      })
                    }
                    className="mb-3"
                  >
                    <Text className="text-center text-xs font-semibold text-hercom">
                      Vista previa brevete
                    </Text>
                  </TouchableOpacity>
                ) : null}
                {renderLicensePhotoSlot(
                  "Selfie con brevete impreso",
                  licenseSelfie,
                  setLicenseSelfie,
                )}
              </>
            )}

            <OfficialDocumentHint
              title="Récord de conductor (PDF)"
              description="Historial de infracciones y estado de tu licencia (MTC). Descárgalo y súbelo en PDF."
              linkLabel="Consultar récord MTC"
              url={CONDUCTOR_RECORD_URL}
            />
            {renderPdfSlot(
              "récord",
              "+ Subir PDF del récord de conductor",
              conductorRecordPdf,
              () => void handlePickPdf(setConductorRecordPdf),
            )}

            <OfficialDocumentHint
              title="CUL (PDF)"
              description="Certificado Único Laboral del Ministerio de Trabajo. Descárgalo en PDF y súbelo aquí."
              linkLabel="Cómo obtener el CUL"
              url={CUL_INFO_URL}
            />
            {renderPdfSlot("CUL", "+ Subir PDF del CUL", culPdf, () =>
              void handlePickPdf(setCulPdf),
            )}

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
      {drawer}
      <DocumentPreviewModal file={preview} onClose={() => setPreview(null)} />
    </View>
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
