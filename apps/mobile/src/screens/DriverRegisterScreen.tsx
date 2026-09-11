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
import {
  TacticalLabel,
  TacticalPanel,
  TacticalScreen,
  TacticalText,
  TacticalTitle,
  TacticalValue,
} from "../components/tactical";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppMode } from "../contexts/AppModeContext";
import {
  MONO,
  TACTICAL_BORDER,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";
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
import { composeBirthDate, isAtLeast18 } from "../lib/age";

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
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");

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
        <TacticalLabel size={10} className="mb-1.5">
          {`${label} (*)`}
        </TacticalLabel>
        <TouchableOpacity
          onPress={() => choosePhotoSource(onPicked)}
          className="overflow-hidden"
          style={{
            backgroundColor: TACTICAL_COLORS.surfaceSunken,
            borderRadius: TACTICAL_RADIUS.panel,
            borderWidth: 1,
            borderColor: TACTICAL_BORDER,
          }}
        >
          {photo !== null ? (
            <Image
              source={{ uri: photo.uri }}
              className="h-28 w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="items-center py-6">
              <TacticalLabel size={11} tone="accent">
                + Agregar foto
              </TacticalLabel>
              <TacticalText size={11} className="mt-1">
                Cámara o galería
              </TacticalText>
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
            <TacticalLabel size={10} tone="accent" className="text-center">
              Vista previa
            </TacticalLabel>
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
          className="py-4"
          style={{
            backgroundColor: TACTICAL_COLORS.surfaceSunken,
            borderRadius: TACTICAL_RADIUS.sharp,
            borderWidth: 1,
            borderColor: TACTICAL_BORDER,
          }}
        >
          <TacticalLabel size={11} tone="accent" className="text-center">
            {doc !== null ? `✓ ${doc.name}` : emptyLabel}
          </TacticalLabel>
        </TouchableOpacity>
        {doc !== null ? (
          <TouchableOpacity
            onPress={() =>
              setPreview({ uri: doc.uri, name: doc.name, kind: doc.kind })
            }
            className="mt-2"
          >
            <TacticalLabel size={10} tone="accent" className="text-center">
              Vista previa {label}
            </TacticalLabel>
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
    const birthDate = composeBirthDate(birthDay, birthMonth, birthYear);
    if (birthDate === null) {
      return "Ingresa tu fecha de nacimiento.";
    }
    if (!isAtLeast18(birthDate)) {
      return "Debes ser mayor de 18 años para registrarte como chofer.";
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
      birthDate: composeBirthDate(birthDay, birthMonth, birthYear)!,
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

  const formComplete = validateForm() === null;

  return (
    <TacticalScreen>
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="z-10 flex-row items-center px-4 pb-2"
      >
        <HamburgerButton onPress={() => setMenuOpen(true)} variant="tactical" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <TacticalTitle size={24} className="mb-2">
          Alta conductor
        </TacticalTitle>
        <TacticalText size={13} className="mb-6">
          Campos obligatorios (*)
        </TacticalText>

        {submitted ? (
          <UiCard>
            <TacticalTitle size={18} className="text-center">
              Solicitud enviada
            </TacticalTitle>
            <TacticalText size={13} className="mt-3 text-center">
              Recibimos tu registro. El equipo de Hercom revisará tu información
              y documentos. Te avisaremos cuando tu perfil de chofer esté
              habilitado.
            </TacticalText>
            <View className="mt-6">
              <UiButton label="Volver al inicio" onPress={onBack} />
            </View>
          </UiCard>
        ) : (
          <UiCard>
            <TacticalLabel size={10} className="mb-2">
              DNI (*)
            </TacticalLabel>
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
                className="h-[52px] items-center justify-center px-4 disabled:opacity-45"
                style={{
                  backgroundColor: TACTICAL_COLORS.accent,
                  borderRadius: TACTICAL_RADIUS.sharp,
                }}
              >
                {validatingDni ? (
                  <ActivityIndicator color={TACTICAL_COLORS.base} />
                ) : (
                  <Text
                    style={{
                      fontFamily: MONO.bold,
                      fontSize: 12,
                      letterSpacing: 2,
                      color: TACTICAL_COLORS.base,
                    }}
                  >
                    VALIDAR
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {dniValidated && (
              <View className="mb-4 gap-2">
                <TacticalLabel size={10} tone="accent">
                  Según RENIEC
                </TacticalLabel>
                <ReniecRow label="Nombres" value={firstName} />
                <ReniecRow label="Apellido paterno" value={firstLastName} />
                <ReniecRow label="Apellido materno" value={secondLastName} />
              </View>
            )}

            <TacticalLabel size={10} className="mb-2">
              Fecha de nacimiento (*)
            </TacticalLabel>
            <View className="mb-4 flex-row gap-2">
              <UiInput
                value={birthDay}
                onChangeText={(v) => setBirthDay(v.replace(/\D/g, "").slice(0, 2))}
                placeholder="DD"
                keyboardType="number-pad"
                className="flex-1"
              />
              <UiInput
                value={birthMonth}
                onChangeText={(v) =>
                  setBirthMonth(v.replace(/\D/g, "").slice(0, 2))
                }
                placeholder="MM"
                keyboardType="number-pad"
                className="flex-1"
              />
              <UiInput
                value={birthYear}
                onChangeText={(v) =>
                  setBirthYear(v.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="AAAA"
                keyboardType="number-pad"
                className="flex-1"
              />
            </View>
            {composeBirthDate(birthDay, birthMonth, birthYear) !== null &&
            !isAtLeast18(composeBirthDate(birthDay, birthMonth, birthYear)!) ? (
              <TacticalText
                size={12}
                className="mb-4"
                style={{ color: TACTICAL_COLORS.danger }}
              >
                Debes ser mayor de 18 años.
              </TacticalText>
            ) : null}

            <TacticalLabel size={10} className="mb-2">
              Sexo (*)
            </TacticalLabel>
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

            <TacticalLabel size={10} className="mb-2">
              Número de brevete (*)
            </TacticalLabel>
            <UiInput
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              placeholder="Ej. Q12345678"
              className="mb-4"
            />

            <TacticalLabel size={10} className="mb-2">
              Categoría de brevete (*)
            </TacticalLabel>
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

            <TacticalLabel size={10} className="mb-2">
              Tipo de vehículo (*)
            </TacticalLabel>
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

            <TacticalLabel size={10} className="mb-2">
              Tipo de brevete (*)
            </TacticalLabel>
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

            <TacticalLabel size={10} className="mb-2">
              {licenseFormat === "physical"
                ? "Fotos del brevete físico (*)"
                : "Brevete digital + selfie (*)"}
            </TacticalLabel>
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
                  title="Brevete digital — MTC"
                  linkLabel="Abrir sitio oficial"
                  url={DIGITAL_LICENSE_URL}
                />
                <TacticalPanel tone="sunken" className="mb-3">
                  <TacticalText size={12} style={{ color: TACTICAL_COLORS.warning }}>
                    Si tu brevete es digital, imprímelo en tamaño real antes de la
                    selfie. Debes sostener el documento impreso junto a tu rostro.
                  </TacticalText>
                </TacticalPanel>
                <TouchableOpacity
                  onPress={chooseDigitalLicenseSource}
                  className="mb-2 py-4"
                  style={{
                    backgroundColor: TACTICAL_COLORS.surfaceSunken,
                    borderRadius: TACTICAL_RADIUS.sharp,
                    borderWidth: 1,
                    borderColor: TACTICAL_BORDER,
                  }}
                >
                  <TacticalLabel size={11} tone="accent" className="text-center">
                    {licenseDigital !== null
                      ? `✓ ${licenseDigital.name}`
                      : "+ Subir PDF o imagen del brevete (*)"}
                  </TacticalLabel>
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
                    <TacticalLabel size={10} tone="accent" className="text-center">
                      Vista previa brevete
                    </TacticalLabel>
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
              title="Récord de conductor — MTC"
              linkLabel="Abrir sitio oficial"
              url={CONDUCTOR_RECORD_URL}
            />
            {renderPdfSlot(
              "récord",
              "+ Subir PDF del récord de conductor (*)",
              conductorRecordPdf,
              () => void handlePickPdf(setConductorRecordPdf),
            )}

            <OfficialDocumentHint
              title="CUL — Ministerio de Trabajo"
              linkLabel="Abrir sitio oficial"
              url={CUL_INFO_URL}
            />
            {renderPdfSlot("CUL", "+ Subir PDF del CUL (*)", culPdf, () =>
              void handlePickPdf(setCulPdf),
            )}

            {formError !== null && (
              <TacticalPanel
                tone="sunken"
                className="mb-4"
                style={{ borderColor: TACTICAL_COLORS.danger }}
              >
                <TacticalText
                  size={13}
                  className="text-center"
                  style={{ color: TACTICAL_COLORS.danger }}
                >
                  {formError}
                </TacticalText>
              </TacticalPanel>
            )}

            {!readyForGoogle && !submitAsAuthenticated ? (
              <UiButton
                label="Continuar"
                onPress={() => void handlePrepareSubmit()}
                disabled={submitting || !formComplete}
              />
            ) : submitAsAuthenticated ? (
              <UiButton
                label="Enviar solicitud de chofer"
                onPress={() => void handlePrepareSubmit()}
                disabled={submitting || !formComplete}
                loading={submitting}
              />
            ) : !formComplete ? (
              <UiButton
                label="Continuar"
                onPress={() => void handlePrepareSubmit()}
                disabled
              />
            ) : (
              <View>
                <TacticalText size={13} className="mb-3 text-center">
                  Crea tu cuenta con Google para enviar la solicitud.
                </TacticalText>
                <GoogleSignInButton
                  variant="tactical"
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
    </TacticalScreen>
  );
}

function ReniecRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      className="px-4 py-3"
      style={{
        backgroundColor: TACTICAL_COLORS.surfaceSunken,
        borderRadius: TACTICAL_RADIUS.sharp,
        borderWidth: 1,
        borderColor: TACTICAL_BORDER,
      }}
    >
      <TacticalLabel size={9}>{label}</TacticalLabel>
      <TacticalValue size={14} className="mt-0.5">
        {value}
      </TacticalValue>
    </View>
  );
}
