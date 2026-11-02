import * as SecureStore from "expo-secure-store";
import type { AddressDraft } from "./addressDraft";

const DRAFT_KEY = "hercomClientRequestDraft";

export type ClientRequestDraft = {
  origin: string;
  originLat: number | null;
  originLng: number | null;
  originPlaceId: string | null;
  destination: AddressDraft;
  extraDestinations: AddressDraft[];
  serviceHours: number;
  department: string;
  province: string;
  district: string;
  notes: string;
  forSelf: boolean;
  passengerName: string;
  passengerPhone: string;
  flowStep: "compose" | "confirm";
};

let memoryDraft: ClientRequestDraft | null = null;

export function peekClientRequestDraft(): ClientRequestDraft | null {
  return memoryDraft;
}

export function rememberClientRequestDraft(draft: ClientRequestDraft | null): void {
  memoryDraft = draft;
}

function hasContent(draft: ClientRequestDraft): boolean {
  return (
    draft.origin.trim() !== "" ||
    draft.destination.address.trim() !== "" ||
    draft.notes.trim() !== "" ||
    draft.passengerName.trim() !== "" ||
    draft.extraDestinations.some((stop) => stop.address.trim() !== "")
  );
}

export async function loadClientRequestDraft(): Promise<ClientRequestDraft | null> {
  if (memoryDraft !== null) {
    return memoryDraft;
  }
  const raw = await SecureStore.getItemAsync(DRAFT_KEY);
  if (raw === null || raw.trim() === "") {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as ClientRequestDraft;
    if (!hasContent(parsed)) {
      return null;
    }
    memoryDraft = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveClientRequestDraft(draft: ClientRequestDraft): Promise<void> {
  memoryDraft = draft;
  if (!hasContent(draft)) {
    await SecureStore.deleteItemAsync(DRAFT_KEY).catch(() => undefined);
    return;
  }
  await SecureStore.setItemAsync(DRAFT_KEY, JSON.stringify(draft));
}

export async function clearClientRequestDraft(): Promise<void> {
  memoryDraft = null;
  await SecureStore.deleteItemAsync(DRAFT_KEY).catch(() => undefined);
}
