import type { Id } from "@proyecto/backend/dataModel";
import { fetch as expoFetch } from "expo/fetch";
import { File, Paths } from "expo-file-system";
import * as SecureStore from "expo-secure-store";

const PENDING_KEY = "pendingDriverRegistration";
const DRAFT_KEY = "driverRegistrationDraft";

/** Mensaje único cuando falla leer/subir un PDF o imagen de documento. */
export const DOCUMENT_UPLOAD_USER_MESSAGE =
  "Verifica tu documento y sube otro. Problemas con ese archivo.";

export class DocumentUploadError extends Error {
  constructor(cause?: unknown) {
    super(DOCUMENT_UPLOAD_USER_MESSAGE);
    this.name = "DocumentUploadError";
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export function isDocumentUploadError(error: unknown): boolean {
  return (
    error instanceof DocumentUploadError ||
    (error instanceof Error &&
      (error.message === DOCUMENT_UPLOAD_USER_MESSAGE ||
        error.message.includes("No se pudo leer el archivo") ||
        error.message.includes("No se pudo subir el archivo") ||
        error.message.includes("File does not exist") ||
        error.message.includes("isn't readable")))
  );
}

export type PendingDriverRegistration = {
  dni: string;
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  sex: "M" | "F";
  birthDate: string;
  drivingExperienceYears: number;
  licenseNumber: string;
  licenseCategory: string;
  licenseFormat: "physical" | "digital";
  licensePhotoUris: { uri: string; mimeType: string }[];
  licensePdfUri?: string;
  licensePdfName?: string;
  vehicleBodyType: "auto" | "camioneta";
  culPdfUri: string;
  culPdfName: string;
  conductorRecordPdfUri: string;
  conductorRecordPdfName: string;
  countryCode: string;
  department: string;
  province: string;
  district: string;
  personalDataConsent: true;
  personalDataConsentText: string;
};

/** Borrador parcial de inscripción (sobrevive recargas de la app). */
export type DriverRegistrationDraft = {
  version: 1;
  dni: string;
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  sex: "M" | "F" | null;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  drivingExperienceYears: string;
  countryCode: string;
  department: string;
  province: string;
  district: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseFormat: "physical" | "digital";
  vehicleBodyType: "auto" | "camioneta" | null;
  personalDataConsent: boolean;
  licenseFrontUri?: string;
  licenseFrontMime?: string;
  licenseBackUri?: string;
  licenseBackMime?: string;
  licenseSelfieUri?: string;
  licenseSelfieMime?: string;
  licenseDigitalUri?: string;
  licenseDigitalName?: string;
  licenseDigitalKind?: "image" | "pdf";
  culPdfUri?: string;
  culPdfName?: string;
  conductorRecordPdfUri?: string;
  conductorRecordPdfName?: string;
};

export async function saveDriverRegistrationDraft(
  draft: DriverRegistrationDraft,
): Promise<void> {
  await SecureStore.setItemAsync(DRAFT_KEY, JSON.stringify(draft));
}

export async function loadDriverRegistrationDraft(): Promise<DriverRegistrationDraft | null> {
  const raw = await SecureStore.getItemAsync(DRAFT_KEY);
  if (raw === null) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as DriverRegistrationDraft;
    if (parsed.version !== 1) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearDriverRegistrationDraft(): Promise<void> {
  await SecureStore.deleteItemAsync(DRAFT_KEY);
}

export async function savePendingDriverRegistration(
  data: PendingDriverRegistration,
): Promise<void> {
  await SecureStore.setItemAsync(PENDING_KEY, JSON.stringify(data));
}

export async function loadPendingDriverRegistration(): Promise<PendingDriverRegistration | null> {
  const raw = await SecureStore.getItemAsync(PENDING_KEY);
  if (raw === null) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as PendingDriverRegistration;
    if (typeof parsed.birthDate !== "string" || parsed.birthDate.trim() === "") {
      await SecureStore.deleteItemAsync(PENDING_KEY);
      return null;
    }
    if (
      parsed.personalDataConsent !== true ||
      typeof parsed.personalDataConsentText !== "string" ||
      parsed.personalDataConsentText.trim() === ""
    ) {
      await SecureStore.deleteItemAsync(PENDING_KEY);
      return null;
    }
    if (typeof parsed.drivingExperienceYears !== "number") {
      parsed.drivingExperienceYears = 0;
    }
    return parsed;
  } catch {
    await SecureStore.deleteItemAsync(PENDING_KEY);
    return null;
  }
}

export async function clearPendingDriverRegistration(): Promise<void> {
  await SecureStore.deleteItemAsync(PENDING_KEY);
}

type SubmitDriverApplicationArgs = {
  dni: string;
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  sex: "M" | "F";
  birthDate: string;
  drivingExperienceYears: number;
  licenseNumber: string;
  licenseCategory: string;
  licenseFormat: "physical" | "digital";
  licensePhotoIds: Id<"_storage">[];
  licensePdfId?: Id<"_storage">;
  vehicleBodyType: "auto" | "camioneta";
  culPdfId: Id<"_storage">;
  conductorRecordPdfId: Id<"_storage">;
  countryCode: string;
  department: string;
  province: string;
  district: string;
  personalDataConsent: true;
  personalDataConsentText: string;
};

export async function submitDriverApplicationFromPending(
  pending: PendingDriverRegistration,
  generateUploadUrl: () => Promise<string>,
  submitApplication: (args: SubmitDriverApplicationArgs) => Promise<unknown>,
): Promise<void> {
  if (
    pending.personalDataConsent !== true ||
    pending.personalDataConsentText.trim() === ""
  ) {
    throw new Error(
      "Debes firmar digitalmente la autorización de datos personales.",
    );
  }

  const licensePhotoIds: Id<"_storage">[] = [];
  for (const photo of pending.licensePhotoUris) {
    const id = await uploadToConvex(
      generateUploadUrl,
      photo.uri,
      photo.mimeType,
    );
    licensePhotoIds.push(id);
  }

  const culPdfId = await uploadToConvex(
    generateUploadUrl,
    pending.culPdfUri,
    "application/pdf",
  );
  const conductorRecordPdfId = await uploadToConvex(
    generateUploadUrl,
    pending.conductorRecordPdfUri,
    "application/pdf",
  );

  let licensePdfId: Id<"_storage"> | undefined;
  if (
    pending.licenseFormat === "digital" &&
    pending.licensePdfUri !== undefined
  ) {
    const mime = pending.licensePdfName?.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : "image/jpeg";
    licensePdfId = await uploadToConvex(
      generateUploadUrl,
      pending.licensePdfUri,
      mime,
    );
  }

  await submitApplication({
    dni: pending.dni,
    firstName: pending.firstName,
    firstLastName: pending.firstLastName,
    secondLastName: pending.secondLastName,
    sex: pending.sex,
    birthDate: pending.birthDate,
    drivingExperienceYears: pending.drivingExperienceYears,
    licenseNumber: pending.licenseNumber,
    licenseCategory: pending.licenseCategory,
    licenseFormat: pending.licenseFormat,
    licensePhotoIds,
    ...(licensePdfId !== undefined ? { licensePdfId } : {}),
    vehicleBodyType: pending.vehicleBodyType,
    culPdfId,
    conductorRecordPdfId,
    countryCode: pending.countryCode,
    department: pending.department,
    province: pending.province,
    district: pending.district,
    personalDataConsent: true,
    personalDataConsentText: pending.personalDataConsentText,
  });
}

export async function uploadToConvex(
  generateUploadUrl: () => Promise<string>,
  localUri: string,
  contentType: string,
): Promise<Id<"_storage">> {
  const uploadUrl = await generateUploadUrl();
  const file = await stageReadableLocalFile(localUri, contentType);
  const bytes = await file.bytes();
  if (bytes.byteLength === 0) {
    throw new DocumentUploadError();
  }
  const response = await expoFetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": contentType,
    },
    body: bytes,
  });
  if (!response.ok) {
    throw new DocumentUploadError();
  }
  const parsed = (await response.json()) as { storageId?: Id<"_storage"> };
  if (parsed.storageId === undefined) {
    throw new DocumentUploadError();
  }
  return parsed.storageId;
}

function fileExtension(contentType: string, localUri: string): string {
  const fromUri = localUri.match(/\.[a-z0-9]+$/i)?.[0];
  if (fromUri !== undefined && fromUri.length <= 5) {
    return fromUri.toLowerCase();
  }
  if (contentType === "application/pdf") {
    return ".pdf";
  }
  if (contentType === "image/png") {
    return ".png";
  }
  return ".jpg";
}

function isInAppCache(uri: string): boolean {
  const cacheRoot = Paths.cache.uri.replace(/\/$/, "");
  return uri.startsWith(cacheRoot);
}

/** Copia a la caché del proyecto: Expo Go no puede leer DocumentPicker/*.pdf. */
export async function stageReadableLocalFile(
  localUri: string,
  contentType: string,
): Promise<File> {
  const source = new File(localUri);
  try {
    if (source.exists && source.size > 0 && isInAppCache(localUri)) {
      return source;
    }
  } catch {
    // Rutas de DocumentPicker en Expo Go no son legibles por FileSystem.
  }

  const dest = new File(
    Paths.cache,
    `hercom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${fileExtension(contentType, localUri)}`,
  );
  try {
    if (source.exists && source.size > 0) {
      source.copy(dest);
      if (dest.exists && dest.size > 0) {
        return dest;
      }
    }
  } catch {
    // Seguir con fetch cuando el sandbox bloquea la copia nativa.
  }

  try {
    const response = await fetch(localUri);
    if (!response.ok) {
      throw new DocumentUploadError();
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength === 0) {
      throw new DocumentUploadError();
    }
    dest.write(bytes);
    return dest;
  } catch (error) {
    if (error instanceof DocumentUploadError) {
      throw error;
    }
    throw new DocumentUploadError(error);
  }
}
