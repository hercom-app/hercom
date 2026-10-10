import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { HERCOM_COLORS, POPPINS } from "../../constants/theme";
import { PinGlyph } from "./RouteIcons";

type LocationAccessPromptProps = {
  mode: "ask" | "blocked" | "gps-off";
  loading?: boolean;
  onAllow: () => void;
  onDismiss: () => void;
};

const COPY: Record<
  LocationAccessPromptProps["mode"],
  { body: string; action: string }
> = {
  ask: {
    body: "La usamos para precargar el punto de recojo y que el chofer llegue a donde estás.",
    action: "Permitir",
  },
  blocked: {
    body: "La ubicación está bloqueada. Actívala en los ajustes del teléfono para precargar tu punto de recojo.",
    action: "Abrir ajustes",
  },
  "gps-off": {
    body: "Activa el GPS del teléfono para precargar el punto de recojo.",
    action: "Abrir ajustes",
  },
};

/** Ventana de permiso, al estilo de las apps de viaje. */
export function LocationAccessPrompt({
  mode,
  loading = false,
  onAllow,
  onDismiss,
}: LocationAccessPromptProps) {
  const copy = COPY[mode];

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 40,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        backgroundColor: "rgba(15, 23, 42, 0.46)",
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 380,
          backgroundColor: HERCOM_COLORS.white,
          borderRadius: 28,
          paddingHorizontal: 22,
          paddingTop: 28,
          paddingBottom: 18,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: HERCOM_COLORS.primarySoft,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <PinGlyph size={32} color={HERCOM_COLORS.primary} />
        </View>
        <Text
          style={{
            fontFamily: POPPINS.bold,
            fontSize: 22,
            lineHeight: 28,
            color: HERCOM_COLORS.text,
            textAlign: "center",
          }}
        >
          Permite que la aplicación acceda a tu ubicación
        </Text>
        <Text
          style={{
            fontFamily: POPPINS.regular,
            fontSize: 15,
            lineHeight: 22,
            color: HERCOM_COLORS.textMuted,
            textAlign: "center",
            marginTop: 10,
          }}
        >
          {copy.body}
        </Text>
        <Pressable
          onPress={onAllow}
          disabled={loading}
          style={{
            marginTop: 22,
            width: "100%",
            height: 52,
            borderRadius: 14,
            backgroundColor: HERCOM_COLORS.primary,
            alignItems: "center",
            justifyContent: "center",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color={HERCOM_COLORS.white} />
          ) : (
            <Text
              style={{
                fontFamily: POPPINS.bold,
                fontSize: 17,
                color: HERCOM_COLORS.white,
              }}
            >
              {copy.action}
            </Text>
          )}
        </Pressable>
        <Pressable
          onPress={onDismiss}
          disabled={loading}
          style={{ paddingVertical: 14, paddingHorizontal: 12 }}
        >
          <Text
            style={{
              fontFamily: POPPINS.semibold,
              fontSize: 15,
              color: HERCOM_COLORS.textMuted,
            }}
          >
            Ahora no
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
