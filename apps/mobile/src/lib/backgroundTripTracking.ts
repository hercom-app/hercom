import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as SecureStore from "expo-secure-store";
import { File, Paths } from "expo-file-system";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";

export const TRIP_LOCATION_TASK = "hercom-trip-location";

const STATE_FILE = "hercom-trip-tracking.json";
const MAX_QUEUED_POINTS = 6000;
const BATCH_SIZE = 400;

export type QueuedPoint = {
  serviceId: Id<"services">;
  lat: number;
  lng: number;
  t: number;
  heading?: number;
  speed?: number;
};

type TrackingState = {
  activeServiceId: Id<"services"> | null;
  queue: QueuedPoint[];
};

export type SendBatch = (args: {
  serviceId: Id<"services">;
  points: Omit<QueuedPoint, "serviceId">[];
}) => Promise<unknown>;

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL ?? "";

/** Misma clave que usa ConvexAuthProvider (namespace = URL sin símbolos). */
const JWT_KEY = `__convexAuthJWT_${convexUrl.replace(/[^a-zA-Z0-9]/g, "")}`;

let lock: Promise<void> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function stateFile(): File {
  return new File(Paths.document, STATE_FILE);
}

function readState(): TrackingState {
  try {
    const file = stateFile();
    if (!file.exists) {
      return { activeServiceId: null, queue: [] };
    }
    const parsed = JSON.parse(file.textSync()) as Partial<TrackingState>;
    return {
      activeServiceId: parsed.activeServiceId ?? null,
      queue: Array.isArray(parsed.queue) ? parsed.queue : [],
    };
  } catch {
    return { activeServiceId: null, queue: [] };
  }
}

function writeState(state: TrackingState): void {
  const file = stateFile();
  if (!file.exists) {
    file.create();
  }
  file.write(JSON.stringify(state));
}

function toQueuedPoint(
  serviceId: Id<"services">,
  location: Location.LocationObject,
): QueuedPoint {
  const { latitude, longitude, heading, speed } = location.coords;
  return {
    serviceId,
    lat: latitude,
    lng: longitude,
    t: Math.round(location.timestamp),
    ...(heading != null && heading >= 0 ? { heading } : {}),
    ...(speed != null && speed >= 0 ? { speed } : {}),
  };
}

/** Envía la cola en lotes; deja en cola lo que falle (sin red o token vencido). */
async function flushWith(send: SendBatch): Promise<void> {
  const state = readState();
  if (state.queue.length === 0) {
    return;
  }
  const byService = new Map<Id<"services">, QueuedPoint[]>();
  for (const point of state.queue) {
    const list = byService.get(point.serviceId) ?? [];
    list.push(point);
    byService.set(point.serviceId, list);
  }
  const sent = new Set<string>();
  for (const [serviceId, points] of byService) {
    for (let i = 0; i < points.length; i += BATCH_SIZE) {
      const chunk = points.slice(i, i + BATCH_SIZE);
      try {
        await send({
          serviceId,
          points: chunk.map(({ serviceId: _omit, ...rest }) => rest),
        });
        chunk.forEach((p) => sent.add(pointKey(p)));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (/no está asignado|ArgumentValidationError|not found/i.test(message)) {
          chunk.forEach((p) => sent.add(pointKey(p)));
          continue;
        }
        break;
      }
    }
  }
  const latest = readState();
  writeState({
    activeServiceId: latest.activeServiceId,
    queue: latest.queue.filter((p) => !sent.has(pointKey(p))),
  });
}

function pointKey(p: QueuedPoint): string {
  return `${p.serviceId}|${p.t}|${p.lat}|${p.lng}`;
}

async function sendWithStoredToken(): Promise<void> {
  if (convexUrl === "") {
    return;
  }
  const token = await SecureStore.getItemAsync(JWT_KEY);
  if (token === null) {
    return;
  }
  const client = new ConvexHttpClient(convexUrl);
  client.setAuth(token);
  await flushWith((args) =>
    client.mutation(api.serviceTracking.appendMyLocationBatch, args),
  );
}

TaskManager.defineTask<{ locations: Location.LocationObject[] }>(
  TRIP_LOCATION_TASK,
  async ({ data, error }) => {
    if (error || !data?.locations?.length) {
      return;
    }
    await withLock(async () => {
      const state = readState();
      if (state.activeServiceId === null) {
        return;
      }
      const serviceId = state.activeServiceId;
      const incoming = data.locations.map((loc) => toQueuedPoint(serviceId, loc));
      const queue = [...state.queue, ...incoming].slice(-MAX_QUEUED_POINTS);
      writeState({ activeServiceId: serviceId, queue });
      await sendWithStoredToken();
    });
  },
);

/** Cola pendiente con el cliente autenticado de la app (refresca token solo). */
export function flushTripLocationQueue(send: SendBatch): Promise<void> {
  return withLock(() => flushWith(send));
}

/**
 * Inicia GPS continuo (sigue con Waze en primer plano). En Android muestra
 * la notificación fija que exige el servicio en primer plano.
 */
export async function startTripLocationUpdates(
  serviceId: Id<"services">,
  askPermission: boolean,
): Promise<boolean> {
  const foreground = askPermission
    ? await Location.requestForegroundPermissionsAsync()
    : await Location.getForegroundPermissionsAsync();
  if (!foreground.granted) {
    return false;
  }
  const background = askPermission
    ? await Location.requestBackgroundPermissionsAsync()
    : await Location.getBackgroundPermissionsAsync();
  if (!background.granted) {
    return false;
  }
  await withLock(async () => {
    const state = readState();
    writeState({ ...state, activeServiceId: serviceId });
  });
  const running = await Location.hasStartedLocationUpdatesAsync(TRIP_LOCATION_TASK).catch(
    () => false,
  );
  if (running) {
    return true;
  }
  await Location.startLocationUpdatesAsync(TRIP_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 5000,
    distanceInterval: 15,
    deferredUpdatesInterval: 15000,
    pausesUpdatesAutomatically: false,
    activityType: Location.ActivityType.AutomotiveNavigation,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Viaje en curso",
      notificationBody: "Hercom está registrando el recorrido del viaje.",
      notificationColor: "#0B70FE",
      killServiceOnDestroy: false,
    },
  });
  return true;
}

export async function stopTripLocationUpdates(): Promise<void> {
  await withLock(async () => {
    const state = readState();
    writeState({ ...state, activeServiceId: null });
  });
  const running = await Location.hasStartedLocationUpdatesAsync(TRIP_LOCATION_TASK).catch(
    () => false,
  );
  if (running) {
    await Location.stopLocationUpdatesAsync(TRIP_LOCATION_TASK);
  }
}
