import { useState } from "react";
import {
  Image,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
} from "react-native";

type Props = {
  uri: string;
  bundled: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  resizeMode?: "contain" | "cover" | "stretch" | "center";
  accessibilityIgnoresInvertColors?: boolean;
};

/** Intenta CDN/GitHub primero (EAS Update); si falla, usa el PNG del bundle. */
export function HomeRemoteImage({
  uri,
  bundled,
  style,
  resizeMode = "contain",
  accessibilityIgnoresInvertColors,
}: Props) {
  const [useBundled, setUseBundled] = useState(false);

  if (useBundled) {
    return (
      <Image
        source={bundled}
        resizeMode={resizeMode}
        style={style}
        accessibilityIgnoresInvertColors={accessibilityIgnoresInvertColors}
      />
    );
  }

  return (
    <Image
      source={{ uri }}
      resizeMode={resizeMode}
      style={style}
      accessibilityIgnoresInvertColors={accessibilityIgnoresInvertColors}
      onError={() => setUseBundled(true)}
    />
  );
}
