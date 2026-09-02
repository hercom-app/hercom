import type { Id } from "@proyecto/backend/dataModel";
import * as SecureStore from "expo-secure-store";

const PENDING_KEY = "pendingDriverRegistration";

export type PendingDriverRegistration = {
  dni: string;
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  sex: "M" | "F";
  licenseNumber: string;
  licenseCategory: string;
  licensePhotoUris: { uri: string; mimeType: string }[];
  culPdfUri: string;
  culPdfName: string;
  conductorRecordPdfUri: string;
  conductorRecordPdfName: string;
  countryCode: string;
  department: string;
  province: string;
  district: string;
};

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
    return JSON.parse(raw) as PendingDriverRegistration;
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
  licenseNumber: string;
  licenseCategory: string;
  licensePhotoIds: Id<"_storage">[];
  culPdfId: Id<"_storage">;
  conductorRecordPdfId: Id<"_storage">;
  countryCode: string;
  department: string;
  province: string;
  district: string;
};

export async function submitDriverApplicationFromPending(
  pending: PendingDriverRegistration,
  generateUploadUrl: () => Promise<string>,
  submitApplication: (args: SubmitDriverApplicationArgs) => Promise<unknown>,
): Promise<void> {
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

  await submitApplication({
    dni: pending.dni,
    firstName: pending.firstName,
    firstLastName: pending.firstLastName,
    secondLastName: pending.secondLastName,
    sex: pending.sex,
    licenseNumber: pending.licenseNumber,
    licenseCategory: pending.licenseCategory,
    licensePhotoIds,
    culPdfId,
    conductorRecordPdfId,
    countryCode: pending.countryCode,
    department: pending.department,
    province: pending.province,
    district: pending.district,
  });
}

export async function uploadToConvex(
  generateUploadUrl: () => Promise<string>,
  localUri: string,
  contentType: string,
): Promise<Id<"_storage">> {
  const uploadUrl = await generateUploadUrl();
  const fileResponse = await fetch(localUri);
  const blob = await fileResponse.blob();
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  if (!uploadResponse.ok) {
    throw new Error("No se pudo subir el archivo.");
  }
  const { storageId } = (await uploadResponse.json()) as {
    storageId: Id<"_storage">;
  };
  return storageId;
}
