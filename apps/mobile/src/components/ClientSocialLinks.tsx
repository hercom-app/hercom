import { Linking, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { HERCOM_SOCIAL_ITEMS, type HercomSocialKey } from "@proyecto/brand";
import { POPPINS, TYPE } from "../constants/theme";
import { useAppTheme } from "../contexts/ThemeContext";

function SocialGlyph({
  name,
  color,
  size = 22,
}: {
  name: HercomSocialKey;
  color: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color,
  };

  if (name === "facebook") {
    return (
      <Svg {...common}>
        <Path d="M14 8h2.5V5H14c-2.8 0-5 2.2-5 5v2H7v3h2v7h3v-7h2.6l.4-3H12V9c0-.6.4-1 1-1z" />
      </Svg>
    );
  }

  if (name === "instagram") {
    return (
      <Svg {...common}>
        <Path d="M16 3H8a5 5 0 00-5 5v8a5 5 0 005 5h8a5 5 0 005-5V8a5 5 0 00-5-5zm-4 13.5A4.5 4.5 0 1112 7.5a4.5 4.5 0 010 9zm5.25-8.25a1 1 0 11-2 0 1 1 0 012 0z" />
      </Svg>
    );
  }

  return (
    <Svg {...common}>
      <Path d="M16.5 3h-9A4.5 4.5 0 003 7.5v9A4.5 4.5 0 007.5 21h9a4.5 4.5 0 004.5-4.5v-9A4.5 4.5 0 0016.5 3zm-2.2 9.7 4.6 2.4a1.1 1.1 0 01-1 2L12 14.3 6.1 17a1.1 1.1 0 01-1-2l4.6-2.4-4.6-2.4a1.1 1.1 0 011-2L12 11.7l5.9-2.5a1.1 1.1 0 011 2l-4.6 2.4z" />
    </Svg>
  );
}

/** Filas de iconos para abrir las redes Hercom (solo UI cliente). */
export function ClientSocialLinks() {
  const { colors, borderSoft } = useAppTheme();

  async function openSocial(url: string) {
    const ok = await Linking.canOpenURL(url);
    if (ok) {
      await Linking.openURL(url);
    }
  }

  return (
    <View className="mb-3">
      <Text
        style={{
          fontFamily: POPPINS.semibold,
          fontSize: TYPE.caption,
          color: colors.steel,
          marginBottom: 10,
        }}
      >
        Síguenos
      </Text>
      <View className="flex-row items-center gap-3">
        {HERCOM_SOCIAL_ITEMS.map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="link"
            accessibilityLabel={item.label}
            onPress={() => void openSocial(item.url)}
            className="h-11 w-11 items-center justify-center"
            style={{
              borderRadius: 999,
              borderWidth: 1,
              borderColor: borderSoft,
              backgroundColor: colors.surfaceSunken,
            }}
          >
            <SocialGlyph name={item.key} color={colors.text} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}