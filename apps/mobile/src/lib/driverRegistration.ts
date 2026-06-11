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
  return JSON.parse(raw) as PendingDriverRegistration;
}

export async function clearPendingDriverRegistration(): Promise<void> {
  await SecureStore.deleteItemAsync(PENDING_KEY);
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
