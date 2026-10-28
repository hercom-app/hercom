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
import {
  SAFETY_CLAY_KEY_GLASS,
  SAFETY_TIP_IMAGES,
  SERVICE_DISCOVERY_IMAGES,
} from "../../constants/homeAssets";
import type { RecentDestination } from "../../lib/recentDestinations";
import { PinGlyph, SearchGlyph } from "./RouteIcons";

const SERVICE_DISCOVERY = [
  {
    key: "premium",
    title: "Chofer Premium",
    url: "https://hercom-landing.vercel.app/servicios/chofer-premium",
    image: SERVICE_DISCOVERY_IMAGES.premium,
  },
  {
    key: "corporativo",
    title: "Chofer Corporativo",
    url: "https://hercom-landing.vercel.app/servicios/chofer-corporativo",
    image: null,
  },
  {
    key: "seguro",
    title: "Chofer Seguro",
    url: "https://hercom-landing.vercel.app/servicios/chofer-seguro",
    image: SERVICE_DISCOVERY_IMAGES.seguro,
  },
  {
    key: "flota",
    title: "Chofer de Flota",
    url: "https://hercom-landing.vercel.app/servicios/chofer-de-flota",
    image: SERVICE_DISCOVERY_IMAGES.flota,
  },
] as const;

const SERVICE_TILE_HEIGHT = 188;
const HORIZONTAL_PADDING = 16;
const GRID_GAP = 10;

const SAFETY_TIPS = [
  {
    key: "vida",
    label: "No expongas tu vida",
    tint: "#F8D4C4",
    image: SAFETY_TIP_IMAGES.cross,
  },
  {
    key: "accidentes",
    label: "Evita accidentes",
    tint: "#D7EFE6",
    image: SAFETY_TIP_IMAGES.car,
  },
  {
    key: "multas",
    label: "Evita multas",
    tint: "#F8F0C4",
    image: SAFETY_TIP_IMAGES.dollar,
  },
] as const;

const COMMERCIAL_BASE =
  process.env.EXPO_PUBLIC_LIVE_SHARE_BASE_URL?.replace(/\/$/, "") ??
  "https://hercom-landing.vercel.app";

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
            minHeight: 132,
            paddingLeft: 18,
            paddingVertical: 16,
            paddingRight: 0,
            flexDirection: "row",
            alignItems: "center",
            overflow: "visible",
          },
        ]}
      >
        <Text
          style={{
            flex: 1,
            paddingRight: 4,
            fontFamily: POPPINS.bold,
            fontSize: 17,
            lineHeight: 22,
            letterSpacing: 0.2,
            color: HERCOM_COLORS.text,
          }}
        >
          TU SEGURIDAD ES NUESTRA PRIORIDAD
        </Text>
        <Image
          source={SAFETY_CLAY_KEY_GLASS}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          style={{ width: 132, height: 132, marginRight: -18 }}
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
                minHeight: 148,
                paddingHorizontal: 6,
                paddingTop: 8,
                paddingBottom: 10,
                alignItems: "center",
                justifyContent: "space-between",
              },
            ]}
          >
            <Image
              source={tip.image}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
              style={{ width: "100%", height: 86 }}
            />
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

      <Pressable
        onPress={() => {
          void Linking.openURL(`${COMMERCIAL_BASE}/cuidando-vidas`);
        }}
        accessibilityRole="link"
        accessibilityLabel="Infórmame más sobre cuidar vidas"
        style={({ pressed }) => ({
          height: 48,
          borderRadius: 14,
          backgroundColor: HERCOM_COLORS.text,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.88 : 1,
        })}
      >
        <Text
          style={{
            fontFamily: POPPINS.semibold,
            fontSize: 15,
            color: "#FFFFFF",
          }}
        >
          Infórmame más
        </Text>
      </Pressable>
    </View>
  );
}

function ServiceDiscoveryTile({
  title,
  image,
  onPress,
}: {
  title: string;
  image: ImageSourcePropType | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={title}
      style={{ flex: 1, minWidth: 0, height: SERVICE_TILE_HEIGHT }}
    >
      <View
        collapsable={false}
        style={{
          flex: 1,
          borderRadius: 16,
          backgroundColor: "#F3F4F6",
          overflow: "hidden",
          paddingTop: 12,
          paddingHorizontal: 12,
          paddingBottom: 6,
          justifyContent: "space-between",
        }}
      >
        <Text
          numberOfLines={2}
          style={{
            fontFamily: POPPINS.semibold,
            fontSize: 14,
            lineHeight: 18,
            color: HERCOM_COLORS.text,
          }}
        >
          {title}
        </Text>
        {image !== null ? (
          <Image
            source={image}
            resizeMode="contain"
            fadeDuration={0}
            style={{ width: "100%", height: 124, alignSelf: "flex-end" }}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

function ServiceDiscoveryGrid() {
  const rows = [SERVICE_DISCOVERY.slice(0, 2), SERVICE_DISCOVERY.slice(2, 4)];
  return (
    <View style={{ width: "100%", gap: GRID_GAP }}>
      {rows.map((row) => (
        <View
          key={row[0].key}
          style={{ flexDirection: "row", width: "100%", gap: GRID_GAP }}
        >
          {row.map((service) => (
            <ServiceDiscoveryTile
              key={service.key}
              title={service.title}
              image={service.image}
              onPress={() => {
                void Linking.openURL(service.url);
              }}
            />
          ))}
        </View>
      ))}
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
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingBottom: bottomInset + 24,
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
