import * as SecureStore from "expo-secure-store";

export type AppMode = "client" | "driver";

const APP_MODE_KEY = "hercomAppMode";
const DRIVER_REGISTRATION_OPEN_KEY = "hercomDriverRegistrationOpen";

export async function loadAppMode(): Promise<AppMode | null> {
  const stored = await SecureStore.getItemAsync(APP_MODE_KEY);
  if (stored === "client" || stored === "driver") {
    return stored;
  }
  return null;
}

export async function saveAppMode(mode: AppMode): Promise<void> {
  await SecureStore.setItemAsync(APP_MODE_KEY, mode);
}

export async function clearAppMode(): Promise<void> {
  await SecureStore.deleteItemAsync(APP_MODE_KEY);
}

export async function loadDriverRegistrationOpen(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(DRIVER_REGISTRATION_OPEN_KEY);
  return stored === "1";
}

export async function saveDriverRegistrationOpen(open: boolean): Promise<void> {
  if (open) {
    await SecureStore.setItemAsync(DRIVER_REGISTRATION_OPEN_KEY, "1");
  } else {
    await SecureStore.deleteItemAsync(DRIVER_REGISTRATION_OPEN_KEY);
  }
}
