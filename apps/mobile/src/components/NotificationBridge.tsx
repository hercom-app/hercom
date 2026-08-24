import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") {
    return;
  }
  await Notifications.setNotificationChannelAsync("default", {
    name: "Hercom",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#007AFF",
  });
}

async function registerExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }
  await ensureAndroidChannel();

  const isGranted = (
    permissions: Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>,
  ) => {
    const value = permissions as {
      granted?: boolean;
      status?: string;
      ios?: { status?: number };
    };
    if (value.granted === true || value.status === "granted") {
      return true;
    }
    if (
      value.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
      value.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    ) {
      return true;
    }
    return false;
  };

  let permissions = await Notifications.getPermissionsAsync();
  if (!isGranted(permissions)) {
    permissions = await Notifications.requestPermissionsAsync();
  }
  if (!isGranted(permissions)) {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  const tokenResponse = await Notifications.getExpoPushTokenAsync(
    projectId !== undefined ? { projectId } : undefined,
  );
  return tokenResponse.data;
}

/**
 * Registra el token Expo Push y dispara notificación local al llegar
 * avisos nuevos de Convex (ofertas, aceptación, etc.).
 */
export function NotificationBridge() {
  const notifications = useQuery(api.notifications.listMine, { limit: 20 });
  const saveExpoPushToken = useMutation(api.users.saveExpoPushToken);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await registerExpoPushToken();
        if (cancelled || token === null) {
          return;
        }
        await saveExpoPushToken({ token });
      } catch (error) {
        console.warn(
          "No se pudo registrar notificaciones push:",
          error instanceof Error ? error.message : error,
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [saveExpoPushToken]);

  useEffect(() => {
    if (notifications === undefined) {
      return;
    }
    if (!primedRef.current) {
      for (const item of notifications) {
        seenIdsRef.current.add(item._id);
      }
      primedRef.current = true;
      return;
    }
    for (const item of notifications) {
      if (seenIdsRef.current.has(item._id)) {
        continue;
      }
      seenIdsRef.current.add(item._id);
      if (item.readAt !== undefined) {
        continue;
      }
      void Notifications.scheduleNotificationAsync({
        content: {
          title: item.title,
          body: item.message,
          sound: true,
          ...(Platform.OS === "android" ? { channelId: "default" } : {}),
        },
        trigger: null,
      });
    }
  }, [notifications]);

  return null;
}
