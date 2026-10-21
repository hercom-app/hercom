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
    background: "#E8F4FC",
  },
  {
    key: "corporativo",
    title: "Chofer Corporativo",
    subtitle: "Para empresas · traslados planificados",
    url: "https://hercom-landing.vercel.app/servicios/chofer-corporativo",
    background: "#E3F0FA",
  },
  {
    key: "seguro",
    title: "Chofer Seguro",
    subtitle: "Para empresarios · licencia de armas",
    url: "https://hercom-landing.vercel.app/servicios/chofer-seguro",
    background: "#DCEEF8",
  },
  {
    key: "flota",
    title: "Chofer de Flota",
    subtitle: "Maquinaria, buses y ruta larga",
    url: "https://hercom-landing.vercel.app/servicios/chofer-de-flota",
    background: "#D6EBF7",
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
        <View
          style={{
            backgroundColor: BENTO[0].background,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 16,
          }}
        >
          <Text
            style={{
              fontFamily: POPPINS.bold,
              fontSize: 17,
              lineHeight: 22,
              color: HERCOM_COLORS.text,
            }}
          >
            {BENTO[0].title}
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontFamily: POPPINS.regular,
              fontSize: 14,
              lineHeight: 20,
              color: HERCOM_COLORS.textSecondary,
            }}
          >
            {BENTO[0].body}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {BENTO.slice(1).map((card) => (
            <View
              key={card.key}
              style={{
                flex: 1,
                backgroundColor: card.background,
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 14,
                minHeight: 132,
              }}
            >
              <Text
                style={{
                  fontFamily: POPPINS.bold,
                  fontSize: 16,
                  lineHeight: 21,
                  color: HERCOM_COLORS.text,
                }}
              >
                {card.title}
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  fontFamily: POPPINS.regular,
                  fontSize: 13,
                  lineHeight: 18,
                  color: HERCOM_COLORS.textSecondary,
                }}
              >
                {card.body}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 22 }}>
        <Text
          style={{
            fontFamily: POPPINS.bold,
            fontSize: 17,
            lineHeight: 22,
            color: HERCOM_COLORS.text,
            marginBottom: 12,
          }}
        >
          Descubre nuestros otros servicios
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {OTHER_HERCOM_SERVICES.map((service) => (
            <Pressable
              key={service.key}
              accessibilityRole="link"
              accessibilityLabel={service.title}
              onPress={() => {
                void Linking.openURL(service.url);
              }}
              style={({ pressed }) => ({
                width: "48%",
                flexGrow: 1,
                minWidth: "46%",
                backgroundColor: service.background,
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor: "#C5E3F6",
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: POPPINS.bold,
                  fontSize: 15,
                  lineHeight: 20,
                  color: HERCOM_COLORS.text,
                }}
              >
                {service.title}
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  fontFamily: POPPINS.regular,
                  fontSize: 12,
                  lineHeight: 17,
                  color: HERCOM_COLORS.textSecondary,
                }}
              >
                {service.subtitle}
              </Text>
            </Pressable>
          ))}
        </View>
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
