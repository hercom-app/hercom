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
    span: "full",
  },
  {
    key: "corporativo",
    title: "Chofer Corporativo",
    subtitle: "Para empresas · traslados planificados",
    url: "https://hercom-landing.vercel.app/servicios/chofer-corporativo",
    background: "#F3E8FF",
    span: "half",
  },
  {
    key: "seguro",
    title: "Chofer Seguro",
    subtitle: "Para empresarios · licencia de armas",
    url: "https://hercom-landing.vercel.app/servicios/chofer-seguro",
    background: "#E5F6F0",
    span: "half",
  },
  {
    key: "flota",
    title: "Chofer de Flota",
    subtitle: "Maquinaria, buses y ruta larga",
    url: "https://hercom-landing.vercel.app/servicios/chofer-de-flota",
    background: "#FFF0E4",
    span: "full",
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

function BentoTile({
  title,
  body,
  background,
  minHeight,
  fill = false,
  onPress,
}: {
  title: string;
  body: string;
  background: string;
  minHeight?: number;
  /** Ocupa la mitad de una fila. En un scroll, las tarjetas anchas no usan flex. */
  fill?: boolean;
  onPress?: () => void;
}) {
  const tile = (
    <View
      style={{
        flex: fill ? 1 : undefined,
        backgroundColor: background,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 16,
        minHeight,
      }}
    >
      <Text
        style={{
          fontFamily: POPPINS.bold,
          fontSize: minHeight !== undefined ? 16 : 17,
          lineHeight: minHeight !== undefined ? 21 : 22,
          color: HERCOM_COLORS.text,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          marginTop: 6,
          fontFamily: POPPINS.regular,
          fontSize: minHeight !== undefined ? 13 : 14,
          lineHeight: minHeight !== undefined ? 18 : 20,
          color: HERCOM_COLORS.textSecondary,
        }}
      >
        {body}
      </Text>
    </View>
  );

  if (onPress === undefined) {
    return tile;
  }

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: fill ? 1 : undefined,
        minHeight,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      {tile}
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
        <View style={{ flexDirection: "row", gap: 10 }}>
          {BENTO.slice(1).map((card) => (
            <BentoTile
              key={card.key}
              title={card.title}
              body={card.body}
              background={card.background}
              minHeight={132}
              fill
            />
          ))}
        </View>
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
          title={OTHER_HERCOM_SERVICES[0].title}
          body={OTHER_HERCOM_SERVICES[0].subtitle}
          background={OTHER_HERCOM_SERVICES[0].background}
          onPress={() => {
            void Linking.openURL(OTHER_HERCOM_SERVICES[0].url);
          }}
        />
        <View style={{ flexDirection: "row", gap: 10 }}>
          {OTHER_HERCOM_SERVICES.filter((service) => service.span === "half").map(
            (service) => (
              <BentoTile
                key={service.key}
                title={service.title}
                body={service.subtitle}
                background={service.background}
                minHeight={124}
                fill
                onPress={() => {
                  void Linking.openURL(service.url);
                }}
              />
            ),
          )}
        </View>
        <BentoTile
          title={OTHER_HERCOM_SERVICES[3].title}
          body={OTHER_HERCOM_SERVICES[3].subtitle}
          background={OTHER_HERCOM_SERVICES[3].background}
          onPress={() => {
            void Linking.openURL(OTHER_HERCOM_SERVICES[3].url);
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
