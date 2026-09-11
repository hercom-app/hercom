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
import * as ImagePicker from "expo-image-picker";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { AccountScreenShell } from "../components/AccountScreenShell";
import {
  TacticalButton,
  TacticalLabel,
  TacticalPanel,
  TacticalStatus,
  TacticalValue,
} from "../components/tactical";
import { convexErrorMessage } from "../lib/convexErrorMessage";
import { uploadToConvex } from "../lib/driverRegistration";
import {
  MONO,
  TACTICAL_BORDER,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";

type ClientIdentityFormProps = {
  onOpenMenu: () => void;
  title?: string;
};

/** DNI vía RENIEC + selfie. Bloquea pedir servicio hasta completarlo. */
export function ClientIdentityForm({
  onOpenMenu,
  title = "Identidad",
}: ClientIdentityFormProps) {
  const me = useQuery(api.users.getMe);
  const lookupDni = useAction(api.reniec.lookupDni);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const submitIdentity = useMutation(api.users.submitIdentity);

  const [dni, setDni] = useState("");
  const [firstName, setFirstName] = useState("");
  const [firstLastName, setFirstLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [dniValidated, setDniValidated] = useState(false);
  const [validatingDni, setValidatingDni] = useState(false);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [selfieMime, setSelfieMime] = useState("image/jpeg");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const dniCheck = useQuery(
    api.users.getDniRegistration,
    dni.length === 8 ? { dni } : "skip",
  );

  useEffect(() => {
    if (me === undefined || me === null || hydrated) {
      return;
    }
    if (me.dni !== undefined && me.dni.trim() !== "") {
      setDni(me.dni.trim());
    }
    if (
      (me.firstName?.trim() ?? "") !== "" &&
      (me.firstLastName?.trim() ?? "") !== ""
    ) {
      setFirstName(me.firstName ?? "");
      setFirstLastName(me.firstLastName ?? "");
      setSecondLastName(me.secondLastName ?? "");
      setDniValidated(true);
    }
    setHydrated(true);
  }, [hydrated, me]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (me?.dni !== undefined && me.dni.trim() === dni) {
      return;
    }
    setDniValidated(false);
    setFirstName("");
    setFirstLastName("");
    setSecondLastName("");
  }, [dni, hydrated, me?.dni]);

  async function handleValidateDni() {
    setFormError(null);
    if (dni.length !== 8) {
      setFormError("El DNI debe tener exactamente 8 dígitos.");
      return;
    }
    if (dniCheck === undefined) {
      setFormError("Espera un momento, estamos comprobando el DNI.");
      return;
    }
    if (dniCheck.registered === true && dniCheck.isMine !== true) {
      setFormError("Este DNI ya está registrado.");
      return;
    }
    setValidatingDni(true);
    try {
      const result = await lookupDni({ dni });
      setFirstName(result.firstName);
      setFirstLastName(result.firstLastName);
      setSecondLastName(result.secondLastName);
      setDniValidated(true);
    } catch (error) {
      setFormError(
        convexErrorMessage(error, "No se pudo validar el DNI con RENIEC."),
      );
    } finally {
      setValidatingDni(false);
    }
  }

  async function handleTakeSelfie() {
    setFormError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setFormError("Necesitamos la cámara para la foto selfie.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      cameraType: ImagePicker.CameraType.front,
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled || result.assets[0] === undefined) {
      return;
    }
    const asset = result.assets[0];
    setSelfieUri(asset.uri);
    setSelfieMime(asset.mimeType ?? "image/jpeg");
  }

  async function handleSubmit() {
    setFormError(null);
    if (!dniValidated) {
      setFormError("Valida tu DNI con RENIEC antes de continuar.");
      return;
    }
    if (dniCheck?.registered === true && dniCheck.isMine !== true) {
      setFormError("Este DNI ya está registrado.");
      return;
    }
    if (selfieUri === null && me?.selfieStorageId === undefined) {
      setFormError("Toma una foto selfie para continuar.");
      return;
    }
    setSubmitting(true);
    try {
      let selfieStorageId = me?.selfieStorageId;
      if (selfieUri !== null) {
        selfieStorageId = await uploadToConvex(
          () => generateUploadUrl({}),
          selfieUri,
          selfieMime,
        );
      }
      if (selfieStorageId === undefined) {
        throw new Error("Toma una foto selfie para continuar.");
      }
      await submitIdentity({
        dni,
        firstName,
        firstLastName,
        secondLastName,
        selfieStorageId,
      });
    } catch (error) {
      setFormError(convexErrorMessage(error, "No se pudo guardar tu identidad."));
    } finally {
      setSubmitting(false);
    }
  }

  const dniTaken = dniCheck?.registered === true && dniCheck.isMine !== true;

  const hasSelfie =
    selfieUri !== null ||
    (me?.selfieUrl !== null && me?.selfieUrl !== undefined);

  return (
    <AccountScreenShell
      variant="tactical"
      title={title}
      onOpenMenu={onOpenMenu}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-4 flex-row gap-2">
          <TacticalStatus
            label="01 · DNI"
            tone={dniValidated && !dniTaken ? "success" : "idle"}
          />
          <TacticalStatus
            label="02 · Selfie"
            tone={hasSelfie ? "success" : "idle"}
          />
        </View>

        <TacticalPanel corners>
          <TacticalLabel tone="accent">DNI</TacticalLabel>

          <View className="mb-4 mt-2 flex-row gap-2">
            <TextInput
              value={dni}
              onChangeText={(value) => setDni(value.replace(/\D/g, "").slice(0, 8))}
              placeholder="00000000"
              placeholderTextColor="rgba(91, 132, 177, 0.6)"
              keyboardType="number-pad"
              className="flex-1"
              style={{
                backgroundColor: TACTICAL_COLORS.surfaceSunken,
                borderRadius: TACTICAL_RADIUS.sharp,
                borderWidth: 1,
                borderColor: dniValidated
                  ? TACTICAL_COLORS.accent
                  : TACTICAL_BORDER,
                paddingHorizontal: 14,
                paddingVertical: 13,
                fontFamily: MONO.medium,
                fontSize: 17,
                letterSpacing: 4,
                color: TACTICAL_COLORS.textStrong,
              }}
            />
            <TacticalButton
              label={validatingDni ? "..." : "Validar"}
              size="md"
              onPress={() => void handleValidateDni()}
              disabled={validatingDni || dni.length !== 8}
              loading={validatingDni}
              className="h-[52px] px-5"
            />
          </View>

          {dniTaken && (
            <Text
              className="mb-3 text-xs"
              style={{ fontFamily: MONO.medium, color: TACTICAL_COLORS.danger }}
            >
              DNI YA REGISTRADO EN EL SISTEMA
            </Text>
          )}

          {dniValidated && !dniTaken && (
            <TacticalPanel tone="sunken" className="mb-5 p-3">
              <TacticalLabel size={10}>Verificado · RENIEC</TacticalLabel>
              <View className="mt-2">
                <ReniecRow label="Nombres" value={firstName} />
                <ReniecRow label="Apellido paterno" value={firstLastName} />
                <ReniecRow label="Apellido materno" value={secondLastName} />
              </View>
            </TacticalPanel>
          )}

          <TacticalLabel tone="accent" className="mb-3">
            Selfie
          </TacticalLabel>
          <TouchableOpacity
            onPress={() => void handleTakeSelfie()}
            activeOpacity={0.8}
            className="mb-5 items-center"
            accessibilityLabel={hasSelfie ? "Volver a tomar selfie" : "Tomar selfie"}
          >
            {hasSelfie ? (
              <View
                className="overflow-hidden"
                style={{
                  borderRadius: TACTICAL_RADIUS.sharp,
                  borderWidth: 1,
                  borderColor: TACTICAL_COLORS.accent,
                }}
              >
                <Image
                  source={{ uri: selfieUri ?? me?.selfieUrl ?? "" }}
                  style={{ width: 168, height: 224 }}
                />
                <View
                  className="absolute inset-x-0 bottom-0 px-3 py-2"
                  style={{ backgroundColor: "rgba(17, 22, 34, 0.82)" }}
                >
                  <TacticalLabel size={9} tone="accent" className="text-center">
                    Tocar para recapturar
                  </TacticalLabel>
                </View>
              </View>
            ) : (
              <View
                className="items-center justify-center px-6"
                style={{
                  width: 168,
                  height: 224,
                  backgroundColor: TACTICAL_COLORS.surfaceSunken,
                  borderRadius: TACTICAL_RADIUS.sharp,
                  borderWidth: 1,
                  borderColor: TACTICAL_BORDER,
                }}
              >
                <View
                  className="mb-3 h-12 w-12 items-center justify-center"
                  style={{
                    borderWidth: 1,
                    borderColor: TACTICAL_COLORS.steel,
                    borderRadius: TACTICAL_RADIUS.sharp,
                  }}
                >
                  <View
                    className="h-5 w-7"
                    style={{
                      borderWidth: 2,
                      borderColor: TACTICAL_COLORS.accent,
                      borderRadius: TACTICAL_RADIUS.sharp,
                    }}
                  />
                </View>
                <TacticalLabel size={10} tone="text" className="text-center">
                  Capturar
                </TacticalLabel>
              </View>
            )}
          </TouchableOpacity>

          {formError !== null && (
            <Text
              className="mb-3 text-xs"
              style={{ fontFamily: MONO.medium, color: TACTICAL_COLORS.danger }}
            >
              {formError}
            </Text>
          )}

          <TacticalButton
            label="Guardar y continuar"
            onPress={() => void handleSubmit()}
            loading={submitting}
            disabled={submitting}
          />
        </TacticalPanel>
      </ScrollView>
    </AccountScreenShell>
  );
}

function ReniecRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      className="mb-1.5 flex-row items-center justify-between px-3 py-2.5"
      style={{
        backgroundColor: "rgba(42, 59, 92, 0.55)",
        borderRadius: TACTICAL_RADIUS.sharp,
        borderLeftWidth: 2,
        borderLeftColor: TACTICAL_COLORS.accent,
      }}
    >
      <TacticalLabel size={9}>{label}</TacticalLabel>
      <TacticalValue size={12}>{value}</TacticalValue>
    </View>
  );
}
