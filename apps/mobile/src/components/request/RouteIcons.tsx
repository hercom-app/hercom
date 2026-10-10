import Svg, { Circle, Path, Rect } from "react-native-svg";

type GlyphProps = {
  size?: number;
  color?: string;
};

/** Busto simple, trazo redondo. */
export function PersonGlyph({ size = 22, color = "#0F172A" }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.15" stroke={color} strokeWidth={1.8} />
      <Path
        d="M5.2 19.4c.7-3.35 3.15-5.15 6.8-5.15s6.1 1.8 6.8 5.15"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SearchGlyph({ size = 22, color = "#0F172A" }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="6.25" stroke={color} strokeWidth={1.8} />
      <Path
        d="M16 16.5L20 20.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CloseGlyph({ size = 18, color = "#64748B" }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 6l12 12M18 6L6 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Mapa con un punto, para abrir el selector con el dedo. */
export function MapGlyph({ size = 22, color = "#0B70FE" }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3.2"
        y="4.2"
        width="17.6"
        height="15.6"
        rx="2.2"
        stroke={color}
        strokeWidth={1.7}
      />
      <Path
        d="M3.5 15.2l4.6-3.1 3.8 2.6 4.4-3.4 4.2 2.2"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="15.2" cy="8.6" r="1.35" fill={color} />
    </Svg>
  );
}

export function PinGlyph({ size = 20, color = "#0F172A" }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21s6.2-4.9 6.2-9.6a6.2 6.2 0 10-12.4 0C5.8 16.1 12 21 12 21z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="11.2" r="2" stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}
