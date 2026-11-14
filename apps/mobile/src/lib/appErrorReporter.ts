import { AppState, Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

export type AppErrorKind = "js_error" | "boundary" | "native_suspect";

export type AppErrorPayload = {
  deviceId: string;
  kind: AppErrorKind;
  message: string;
  stack?: string;
  screen?: string;
  platform?: string;
  deviceBrand?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  extra?: string;
};

type FlushFn = (payload: AppErrorPayload) => Promise<void>;

const DEVICE_ID_KEY = "hercomErrorDeviceId";
const QUEUE_KEY = "hercomPendingErrorReports";
const ALIVE_KEY = "hercomAppAlive";
const HEARTBEAT_KEY = "hercomAppHeartbeat";

let flushFn: FlushFn | null = null;
let currentScreen = "boot";
let deviceIdCache: string | null = null;
let installed = false;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

function randomId(): string {
  return `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function setAppErrorScreen(screen: string) {
  currentScreen = screen;
}

export function setAppErrorFlush(next: FlushFn | null) {
  flushFn = next;
  if (next !== null) {
    void flushQueuedReports();
  }
}

function deviceSnapshot(): Omit<AppErrorPayload, "kind" | "message" | "deviceId"> {
  const version =
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    undefined;
  return {
    screen: currentScreen,
    platform: Platform.OS,
    ...(Device.brand ? { deviceBrand: Device.brand } : {}),
    ...(Device.modelName ? { deviceModel: Device.modelName } : {}),
    ...(Device.osVersion
      ? { osVersion: `${Device.osName ?? Platform.OS} ${Device.osVersion}` }
      : {}),
    ...(version ? { appVersion: version } : {}),
  };
}

async function getDeviceId(): Promise<string> {
  if (deviceIdCache !== null) {
    return deviceIdCache;
  }
  const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (stored !== null && stored !== "") {
    deviceIdCache = stored;
    return stored;
  }
  const created = randomId();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, created);
  deviceIdCache = created;
  return created;
}

async function readQueue(): Promise<AppErrorPayload[]> {
  const raw = await SecureStore.getItemAsync(QUEUE_KEY);
  if (raw === null || raw === "") {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is AppErrorPayload =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as AppErrorPayload).message === "string" &&
        typeof (item as AppErrorPayload).kind === "string",
    );
  } catch {
    return [];
  }
}

async function writeQueue(items: AppErrorPayload[]): Promise<void> {
  if (items.length === 0) {
    await SecureStore.deleteItemAsync(QUEUE_KEY);
    return;
  }
  await SecureStore.setItemAsync(
    QUEUE_KEY,
    JSON.stringify(items.slice(-20)),
  );
}

export async function reportAppError(input: {
  kind: AppErrorKind;
  message: string;
  stack?: string;
  extra?: string;
}): Promise<void> {
  const message = input.message.trim();
  if (message === "") {
    return;
  }
  const payload: AppErrorPayload = {
    deviceId: await getDeviceId(),
    kind: input.kind,
    message,
    ...deviceSnapshot(),
    ...(input.stack !== undefined && input.stack.trim() !== ""
      ? { stack: input.stack.trim() }
      : {}),
    ...(input.extra !== undefined && input.extra.trim() !== ""
      ? { extra: input.extra.trim() }
      : {}),
  };

  if (flushFn !== null) {
    try {
      await flushFn(payload);
      return;
    } catch {
      // Sin red o Convex caído: queda en cola para el próximo arranque.
    }
  }

  const queue = await readQueue();
  queue.push(payload);
  await writeQueue(queue);
}

async function flushQueuedReports(): Promise<void> {
  if (flushFn === null) {
    return;
  }
  const queue = await readQueue();
  if (queue.length === 0) {
    return;
  }
  const remaining: AppErrorPayload[] = [];
  for (const item of queue) {
    try {
      await flushFn({
        ...item,
        deviceId: item.deviceId || (await getDeviceId()),
      });
    } catch {
      remaining.push(item);
    }
  }
  await writeQueue(remaining);
}

async function markAlive(alive: boolean): Promise<void> {
  try {
    await SecureStore.setItemAsync(ALIVE_KEY, alive ? "1" : "0");
    if (alive) {
      await SecureStore.setItemAsync(HEARTBEAT_KEY, String(Date.now()));
    }
  } catch {
    // SecureStore no debe tumbar la app.
  }
}

/**
 * Si el proceso murió en primer plano (crash nativo / kill), el marcador
 * queda en 1 y el heartbeat es reciente. Al reabrir se reporta.
 */
export async function reportUncleanExitIfNeeded(): Promise<void> {
  try {
    const alive = await SecureStore.getItemAsync(ALIVE_KEY);
    const heartbeatRaw = await SecureStore.getItemAsync(HEARTBEAT_KEY);
    const heartbeat = heartbeatRaw !== null ? Number(heartbeatRaw) : NaN;
    const recent =
      Number.isFinite(heartbeat) && Date.now() - heartbeat < 45_000;
    if (alive === "1" && recent) {
      await reportAppError({
        kind: "native_suspect",
        message:
          "La app se cerró de golpe (posible crash nativo). Última pantalla: " +
          currentScreen,
        extra: JSON.stringify({ heartbeat, screen: currentScreen }),
      });
    }
  } catch {
    // ignorar
  } finally {
    await markAlive(true);
    startAliveTracking();
  }
}

let aliveTrackingInstalled = false;

function startAliveTracking(): void {
  if (aliveTrackingInstalled) {
    return;
  }
  aliveTrackingInstalled = true;
  AppState.addEventListener("change", (next) => {
    if (next === "active") {
      void markAlive(true);
      return;
    }
    void markAlive(false);
  });
  if (heartbeatTimer === null) {
    heartbeatTimer = setInterval(() => {
      if (AppState.currentState === "active") {
        void markAlive(true);
      }
    }, 15_000);
  }
}

type GlobalErrorUtils = {
  getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void;
  setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
};

function installGlobalHandler(): void {
  if (installed) {
    return;
  }
  installed = true;

  const errorUtils = (
    globalThis as typeof globalThis & { ErrorUtils?: GlobalErrorUtils }
  ).ErrorUtils;
  const previous = errorUtils?.getGlobalHandler?.();
  errorUtils?.setGlobalHandler?.((error, isFatal) => {
    void reportAppError({
      kind: "js_error",
      message: error?.message || "Error JS sin mensaje",
      stack: error?.stack,
      extra: isFatal === true ? "fatal=true" : "fatal=false",
    });
    previous?.(error, isFatal);
  });

  const onUnhandled = (event: { reason?: unknown }) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : `Unhandled rejection: ${String(reason)}`;
    const stack = reason instanceof Error ? reason.stack : undefined;
    void reportAppError({
      kind: "js_error",
      message,
      ...(stack !== undefined ? { stack } : {}),
      extra: "unhandledrejection",
    });
  };
  const runtime = globalThis as typeof globalThis & {
    addEventListener?: (
      type: string,
      listener: (event: { reason?: unknown }) => void,
    ) => void;
  };
  runtime.addEventListener?.("unhandledrejection", onUnhandled);
}

installGlobalHandler();
