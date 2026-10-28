import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";
import { HERCOM_COLORS, POPPINS } from "../../constants/theme";
import type { RecentDestination } from "../../lib/recentDestinations";
import { PinGlyph, SearchGlyph } from "./RouteIcons";

/** Cuadrícula 2×2 estilo inDrive: 3 servicios; celda inferior derecha vacía. */
const SERVICE_DISCOVERY = [
  {
    key: "premium",
    title: "Chofer Premium",
    url: "https://hercom-landing.vercel.app/servicios/chofer-premium",
    image: require("../../../assets/images/services/chofer-premium.png"),
  },
  {
    key: "seguro",
    title: "Chofer Seguro",
    url: "https://hercom-landing.vercel.app/servicios/chofer-seguro",
    image: require("../../../assets/images/services/chofer-seguro.png"),
  },
  {
    key: "flota",
    title: "Chofer de Flota",
    url: "https://hercom-landing.vercel.app/servicios/chofer-de-flota",
    image: require("../../../assets/images/services/chofer-flota.png"),
  },
] as const;

const SERVICE_TILE_HEIGHT = 128;
const SERVICE_ILLUSTRATION = { width: 92, height: 76 };

const SAFETY_CLAY_IMAGE = require("../../../assets/images/safety-clay-key-glass.png");

const SAFETY_TIPS = [
  { key: "vida", label: "No expongas tu vida", tint: "#E8F2FF" },
  { key: "accidentes", label: "Evita accidentes", tint: "#EAF8EF" },
  { key: "multas", label: "Evita multas", tint: "#FFF4E8" },
] as const;

/** Sombra suave tipo clay (volumen + borde claro). */
const claySurface = (fill: string) => ({
  backgroundColor: fill,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.72)",
  shadowColor: "#64748B",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.14,
  shadowRadius: 12,
  elevation: 4,
});

function SafetyAwarenessBlock() {
  return (
    <View style={{ gap: 10 }}>
      <View
        style={[
          claySurface("#F3F8FF"),
          {
            minHeight: 152,
            paddingLeft: 18,
            paddingVertical: 16,
            paddingRight: 8,
            flexDirection: "row",
            alignItems: "center",
            overflow: "hidden",
          },
        ]}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            right: -24,
            top: -20,
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: "rgba(255, 255, 255, 0.55)",
          }}
        />
        <View style={{ flex: 1, paddingRight: 8, zIndex: 1 }}>
          <Text
            style={{
              fontFamily: POPPINS.bold,
              fontSize: 17,
              lineHeight: 22,
              letterSpacing: 0.2,
              color: HERCOM_COLORS.text,
            }}
          >
            TU SEGURIDAD ES NUESTRA PRIORIDAD
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontFamily: POPPINS.regular,
              fontSize: 14,
              lineHeight: 20,
              color: HERCOM_COLORS.textSecondary,
            }}
          >
            Un chofer de remplazo maneja por ti. Tú llegas sin arriesgar la vida ni el
            volante.
          </Text>
        </View>
        <Image
          source={SAFETY_CLAY_IMAGE}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          style={{ width: 118, height: 118, zIndex: 1 }}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        {SAFETY_TIPS.map((tip) => (
          <View
            key={tip.key}
            style={[
              claySurface(tip.tint),
              {
                flex: 1,
                minWidth: 0,
                minHeight: 92,
                paddingHorizontal: 10,
                paddingVertical: 12,
                justifyContent: "center",
              },
            ]}
          >
            <Text
              numberOfLines={3}
              style={{
                fontFamily: POPPINS.semibold,
                fontSize: 12,
                lineHeight: 16,
                textAlign: "center",
                color: HERCOM_COLORS.text,
              }}
            >
              {tip.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ServiceDiscoveryTile({
  title,
  image,
  onPress,
}: {
  title: string;
  image: ImageSourcePropType;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={title}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: 0,
        height: SERVICE_TILE_HEIGHT,
        borderRadius: 16,
        backgroundColor: "#F3F4F6",
        overflow: "hidden",
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Text
        numberOfLines={2}
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          right: SERVICE_ILLUSTRATION.width + 8,
          fontFamily: POPPINS.semibold,
          fontSize: 15,
          lineHeight: 20,
          color: HERCOM_COLORS.text,
        }}
      >
        {title}
      </Text>
      <Image
        source={image}
        resizeMode="contain"
        style={{
          position: "absolute",
          right: 4,
          bottom: 0,
          width: SERVICE_ILLUSTRATION.width,
          height: SERVICE_ILLUSTRATION.height,
        }}
      />
    </Pressable>
  );
}

function ServiceDiscoveryGrid() {
  const [premium, seguro, flota] = SERVICE_DISCOVERY;
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <ServiceDiscoveryTile
          title={premium.title}
          image={premium.image}
          onPress={() => {
            void Linking.openURL(premium.url);
          }}
        />
        <ServiceDiscoveryTile
          title={seguro.title}
          image={seguro.image}
          onPress={() => {
            void Linking.openURL(seguro.url);
          }}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <ServiceDiscoveryTile
          title={flota.title}
          image={flota.image}
          onPress={() => {
            void Linking.openURL(flota.url);
          }}
        />
        <View style={{ flex: 1, minWidth: 0 }} />
      </View>
    </View>
  );
}

type HomeRequestSheetProps = {
  recents: RecentDestination[];
  onSearchPress: () => void;
  onSelectRecent: (place: RecentDestination) => void;
  error: string | null;
  bottomInset: number;
};

export function HomeRequestSheet({
  recents,
  onSearchPress,
  onSelectRecent,
  error,
  bottomInset,
}: HomeRequestSheetProps) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: bottomInset + 12,
      }}
    >
      <Pressable
        onPress={onSearchPress}
        accessibilityRole="button"
        accessibilityLabel="¿A dónde te llevará tu chofer para remplazo?"
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: "#F3F4F6",
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <SearchGlyph size={22} color={HERCOM_COLORS.text} />
        <Text
          style={{
            flex: 1,
            fontFamily: POPPINS.medium,
            fontSize: 16,
            lineHeight: 22,
            color: HERCOM_COLORS.textMuted,
          }}
        >
          ¿A dónde te llevará tu chofer para remplazo?
        </Text>
      </Pressable>

      {recents.length > 0 && (
        <View style={{ marginTop: 8 }}>
          {recents.map((place) => (
            <Pressable
              key={place.address}
              onPress={() => onSelectRecent(place)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 12,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PinGlyph size={18} color={HERCOM_COLORS.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: POPPINS.semibold,
                    fontSize: 16,
                    color: HERCOM_COLORS.text,
                  }}
                >
                  {place.title}
                </Text>
                {place.subtitle !== undefined && (
                  <Text
                    numberOfLines={1}
                    style={{
                      marginTop: 2,
                      fontFamily: POPPINS.regular,
                      fontSize: 13,
                      color: HERCOM_COLORS.textMuted,
                    }}
                  >
                    {place.subtitle}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <View style={{ marginTop: 16 }}>
        <SafetyAwarenessBlock />
      </View>

      <View style={{ marginTop: 22, gap: 10 }}>
        <Text
          style={{
            fontFamily: POPPINS.bold,
            fontSize: 17,
            lineHeight: 22,
            color: HERCOM_COLORS.text,
          }}
        >
          Más formas de usar Hercom
        </Text>
        <ServiceDiscoveryGrid />
      </View>

      {error !== null && (
        <Text
          style={{
            marginTop: 14,
            textAlign: "center",
            fontFamily: POPPINS.medium,
            fontSize: 13,
            color: HERCOM_COLORS.danger,
          }}
        >
          {error}
        </Text>
      )}
    </ScrollView>
  );
}
