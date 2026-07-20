import * as SecureStore from "expo-secure-store";

export type AppMode = "client" | "driver";

const APP_MODE_KEY = "hercomAppMode";

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
