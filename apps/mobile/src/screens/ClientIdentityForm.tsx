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
import { UiButton, UiCard, UiChip } from "../components/ui";
import { convexErrorMessage } from "../lib/convexErrorMessage";
import { uploadToConvex } from "../lib/driverRegistration";

type ClientIdentityFormProps = {
  onOpenMenu: () => void;
  title?: string;
};

const inputClass =
  "rounded-2xl bg-slate-100 px-4 py-3.5 text-base text-slate-900";

/** DNI vía RENIEC + selfie. Bloquea pedir servicio hasta completarlo. */
export function ClientIdentityForm({
  onOpenMenu,
  title = "Valida tu identidad",
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

  return (
    <AccountScreenShell
      title={title}
      subtitle="Para pedir un servicio valida tu DNI y toma una selfie."
      onOpenMenu={onOpenMenu}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-4 flex-row gap-2">
          <UiChip label="1 · DNI" selected={dniValidated && !dniTaken} />
          <UiChip
            label="2 · Selfie"
            selected={
              selfieUri !== null ||
              (me?.selfieUrl !== null && me?.selfieUrl !== undefined)
            }
          />
        </View>

        <UiCard>
          <Text className="mb-2 text-sm font-semibold text-slate-500">
            DNI
          </Text>
          <View className="mb-4 flex-row gap-2">
            <TextInput
              value={dni}
              onChangeText={(value) => setDni(value.replace(/\D/g, "").slice(0, 8))}
              placeholder="8 dígitos"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              className={`${inputClass} flex-1`}
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

          {dniTaken && (
            <Text className="mb-3 text-sm font-semibold text-red-600">
              Este DNI ya está registrado.
            </Text>
          )}

          {dniValidated && !dniTaken && (
            <View className="mb-5 gap-2">
              <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Según RENIEC
              </Text>
              <ReniecRow label="Nombres" value={firstName} />
              <ReniecRow label="Apellido paterno" value={firstLastName} />
              <ReniecRow label="Apellido materno" value={secondLastName} />
            </View>
          )}

          <Text className="mb-3 text-sm font-semibold text-slate-500">
            Foto selfie
          </Text>
          <TouchableOpacity
            onPress={() => void handleTakeSelfie()}
            activeOpacity={0.85}
            className="mb-5 items-center"
            accessibilityLabel={
              selfieUri !== null || me?.selfieUrl
                ? "Volver a tomar selfie"
                : "Tomar selfie"
            }
          >
            {selfieUri !== null ||
            (me?.selfieUrl !== null && me?.selfieUrl !== undefined) ? (
              <View className="overflow-hidden rounded-3xl bg-slate-200">
                <Image
                  source={{ uri: selfieUri ?? me?.selfieUrl ?? "" }}
                  style={{ width: 168, height: 224 }}
                />
                <View className="absolute inset-x-0 bottom-0 bg-black/45 px-3 py-2">
                  <Text className="text-center text-xs font-semibold text-white">
                    Toca para volver a tomar
                  </Text>
                </View>
              </View>
            ) : (
              <View
                className="items-center justify-center rounded-3xl bg-slate-100 px-6"
                style={{ width: 168, height: 224 }}
              >
                <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-white">
                  <View className="h-5 w-7 rounded-md border-2 border-slate-400" />
                </View>
                <Text className="text-center text-sm font-semibold text-slate-800">
                  Tomar selfie
                </Text>
                <Text className="mt-1 text-center text-xs text-slate-500">
                  Toca para abrir la cámara
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {formError !== null && (
            <Text className="mb-3 text-sm text-red-600">{formError}</Text>
          )}

          <UiButton
            label="Guardar y continuar"
            onPress={() => void handleSubmit()}
            loading={submitting}
            disabled={submitting}
          />
        </UiCard>
      </ScrollView>
    </AccountScreenShell>
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
