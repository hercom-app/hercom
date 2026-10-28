import type { ReactNode } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { HERCOM_COLORS, POPPINS } from "../../constants/theme";
import type { RecentDestination } from "../../lib/recentDestinations";
import { PinGlyph, SearchGlyph } from "./RouteIcons";

const OTHER_HERCOM_SERVICES = [
  {
    key: "premium",
    title: "Chofer Premium",
    subtitle: "Para personas · rutina y familia",
    url: "https://hercom-landing.vercel.app/servicios/chofer-premium",
    background: "#E8F1FF",
  },
  {
    key: "corporativo",
    title: "Corporativo",
    subtitle: "Chofer corporativo · empresas",
    url: "https://hercom-landing.vercel.app/servicios/chofer-corporativo",
    background: "#F3E8FF",
  },
  {
    key: "seguro",
    title: "Seguro",
    subtitle: "Chofer seguro · licencia de armas",
    url: "https://hercom-landing.vercel.app/servicios/chofer-seguro",
    background: "#E5F6F0",
  },
  {
    key: "flota",
    title: "Chofer de Flota",
    subtitle: "Maquinaria, buses y ruta larga",
    url: "https://hercom-landing.vercel.app/servicios/chofer-de-flota",
    background: "#FFF0E4",
  },
] as const;

const BENTO = [
  {
    key: "rest",
    title: "Tú descansas, él conduce",
    body: "Un chofer de remplazo maneja tu auto. Tú solo llegas.",
    background: "#FFF6D6",
  },
  {
    key: "safe",
    title: "Llegas seguro",
    body: "Alcohol, cansancio o estrés: mejor no tomar el volante.",
    background: "#E5F8EA",
  },
  {
    key: "car",
    title: "Tu auto contigo",
    body: "No lo dejas. La ruta es la tuya, en tu vehículo.",
    background: "#FFE8DC",
  },
] as const;

const HALF_ROW_MIN_HEIGHT = 132;

/** Dos columnas iguales (50 % / 50 %), como las tarjetas bento de arriba. */
function BentoHalfRow({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", width: "100%", gap: 10 }}>
      <View style={{ flex: 1, minWidth: 0 }}>{left}</View>
      <View style={{ flex: 1, minWidth: 0 }}>{right}</View>
    </View>
  );
}

function BentoTile({
  title,
  body,
  background,
  compact = false,
  minHeight,
  onPress,
}: {
  title: string;
  body: string;
  background: string;
  compact?: boolean;
  minHeight?: number;
  onPress?: () => void;
}) {
  const tileStyle = {
    width: "100%" as const,
    backgroundColor: background,
    borderRadius: 20,
    paddingHorizontal: compact ? 12 : 16,
    paddingVertical: compact ? 14 : 16,
    minHeight,
  };
  const titleSize = compact ? 15 : 17;
  const bodySize = compact ? 12 : 14;

  const content = (
    <>
      <Text
        numberOfLines={compact ? 2 : 3}
        style={{
          fontFamily: POPPINS.bold,
          fontSize: titleSize,
          lineHeight: titleSize + 4,
          color: HERCOM_COLORS.text,
        }}
      >
        {title}
      </Text>
      <Text
        numberOfLines={compact ? 3 : 4}
        style={{
          marginTop: 6,
          fontFamily: POPPINS.regular,
          fontSize: bodySize,
          lineHeight: bodySize + 4,
          color: HERCOM_COLORS.textSecondary,
        }}
      >
        {body}
      </Text>
    </>
  );

  if (onPress === undefined) {
    return <View style={tileStyle}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [tileStyle, { opacity: pressed ? 0.88 : 1 }]}
    >
      {content}
    </Pressable>
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
  const [premium, corporativo, seguro, flota] = OTHER_HERCOM_SERVICES;

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

      <View style={{ marginTop: 16, gap: 10 }}>
        <BentoTile
          title={BENTO[0].title}
          body={BENTO[0].body}
          background={BENTO[0].background}
        />
        <BentoHalfRow
          left={
            <BentoTile
              title={BENTO[1].title}
              body={BENTO[1].body}
              background={BENTO[1].background}
              compact
              minHeight={HALF_ROW_MIN_HEIGHT}
            />
          }
          right={
            <BentoTile
              title={BENTO[2].title}
              body={BENTO[2].body}
              background={BENTO[2].background}
              compact
              minHeight={HALF_ROW_MIN_HEIGHT}
            />
          }
        />
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
          Descubre nuestros otros servicios
        </Text>
        <BentoTile
          title={premium.title}
          body={premium.subtitle}
          background={premium.background}
          onPress={() => {
            void Linking.openURL(premium.url);
          }}
        />
        <BentoHalfRow
          left={
            <BentoTile
              title={corporativo.title}
              body={corporativo.subtitle}
              background={corporativo.background}
              compact
              minHeight={HALF_ROW_MIN_HEIGHT}
              onPress={() => {
                void Linking.openURL(corporativo.url);
              }}
            />
          }
          right={
            <BentoTile
              title={seguro.title}
              body={seguro.subtitle}
              background={seguro.background}
              compact
              minHeight={HALF_ROW_MIN_HEIGHT}
              onPress={() => {
                void Linking.openURL(seguro.url);
              }}
            />
          }
        />
        <BentoTile
          title={flota.title}
          body={flota.subtitle}
          background={flota.background}
          onPress={() => {
            void Linking.openURL(flota.url);
          }}
        />
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
