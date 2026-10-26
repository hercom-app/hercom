import Svg, { Circle, Path, Polyline, Rect } from "react-native-svg";
import { TACTICAL_COLORS } from "../constants/theme";

export type DrawerIconName =
  | "mapPin"
  | "clock"
  | "bell"
  | "chat"
  | "shield"
  | "gear"
  | "car"
  | "clipboard"
  | "wallet"
  | "trend"
  | "card"
  | "logout"
  | "close"
  | "navigate"
  | "list"
  | "user"
  | "phone"
  | "share"
  | "key"
  | "medical"
  | "chevron";

type DrawerIconProps = {
  name: DrawerIconName;
  selected?: boolean;
  /** Fuerza el color del trazo (ignora `selected`). */
  color?: string;
  size?: number;
};

function strokeOf(selected: boolean | undefined): string {
  return selected === true ? TACTICAL_COLORS.accent : TACTICAL_COLORS.steel;
}

/** Iconos de trazo gris, mismo lenguaje visual que Seguridad / Configuración. */
export function DrawerIcon({
  name,
  selected = false,
  color,
  size = 22,
}: DrawerIconProps) {
  const stroke = color ?? strokeOf(selected);
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke,
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "mapPin":
      return (
        <Svg {...common}>
          <Path d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11z" />
          <Circle cx="12" cy="10" r="2.25" fill="none" />
        </Svg>
      );
    case "clock":
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="8" />
          <Path d="M12 8v4.5l3 1.5" />
        </Svg>
      );
    case "bell":
      return (
        <Svg {...common}>
          <Path d="M6.5 9a5.5 5.5 0 1111 0c0 6 2.5 7.5 2.5 7.5H4S6.5 15 6.5 9z" />
          <Path d="M10 19a2 2 0 004 0" />
        </Svg>
      );
    case "chat":
      return (
        <Svg {...common}>
          <Path d="M5 6h14a2 2 0 012 2v7a2 2 0 01-2 2H9l-4 3v-3H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
        </Svg>
      );
    case "shield":
      return (
        <Svg {...common}>
          <Path d="M12 3l8 3.2v6.3c0 4.7-3.2 8.1-8 9.5-4.8-1.4-8-4.8-8-9.5V6.2L12 3z" />
        </Svg>
      );
    case "gear":
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="3" />
          <Path d="M19.4 13a1.6 1.6 0 000-2l1.8-1.4-1.8-3.1-2.2.9a6.8 6.8 0 00-1.7-1L15 4h-6l-.5 2.4a6.8 6.8 0 00-1.7 1l-2.2-.9-1.8 3.1L8.6 11a1.6 1.6 0 000 2l-1.8 1.4 1.8 3.1 2.2-.9a6.8 6.8 0 001.7 1L9 20h6l.5-2.4a6.8 6.8 0 001.7-1l2.2.9 1.8-3.1z" />
        </Svg>
      );
    case "car":
      return (
        <Svg {...common}>
          <Path d="M5 16l1.6-5.2A2 2 0 018.5 9.5h7a2 2 0 011.9 1.3L19 16" />
          <Path d="M5 16h14v2.5a1 1 0 01-1 1h-1.2a2.2 2.2 0 01-4.2 0h-2.2a2.2 2.2 0 01-4.2 0H6a1 1 0 01-1-1V16z" />
          <Path d="M7.5 9.5l.8-2A1.5 1.5 0 019.7 6.5h4.6a1.5 1.5 0 011.4 1l.8 2" />
        </Svg>
      );
    case "clipboard":
      return (
        <Svg {...common}>
          <Rect x="7" y="5" width="10" height="15" rx="2" />
          <Path d="M9 5.5V4.8A1.8 1.8 0 0110.8 3h2.4A1.8 1.8 0 0115 4.8v.7" />
          <Path d="M10 10h4M10 13h4M10 16h2.5" />
        </Svg>
      );
    case "wallet":
      return (
        <Svg {...common}>
          <Rect x="3.5" y="6.5" width="17" height="12" rx="2" />
          <Path d="M3.5 10.5h17" />
          <Circle cx="16.5" cy="14.2" r="1" fill={stroke} stroke="none" />
        </Svg>
      );
    case "trend":
      return (
        <Svg {...common}>
          <Polyline points="4 16 9 11 13 14.5 20 7" />
          <Polyline points="14 7 20 7 20 13" />
        </Svg>
      );
    case "card":
      return (
        <Svg {...common}>
          <Rect x="3" y="6" width="18" height="12" rx="2" />
          <Path d="M3 10h18" />
        </Svg>
      );
    case "logout":
      return (
        <Svg {...common}>
          <Path d="M10 7V5.8A1.8 1.8 0 0111.8 4H18a2 2 0 012 2v12a2 2 0 01-2 2h-6.2A1.8 1.8 0 0110 18.2V17" />
          <Path d="M4 12h11" />
          <Path d="M12 8.5L15.5 12 12 15.5" />
        </Svg>
      );
    case "close":
      return (
        <Svg {...common} width={size === 22 ? 18 : size} height={size === 22 ? 18 : size}>
          <Path d="M6 6l12 12M18 6L6 18" />
        </Svg>
      );
    case "navigate":
      return (
        <Svg {...common}>
          <Path d="M20 4L4 11l7 2 2 7 7-16z" />
        </Svg>
      );
    case "list":
      return (
        <Svg {...common}>
          <Rect x="5" y="3.5" width="14" height="17" rx="2" />
          <Path d="M9 8.5h6M9 12h6M9 15.5h4" />
        </Svg>
      );
    case "user":
      return (
        <Svg {...common}>
          <Circle cx="12" cy="8.5" r="3.5" />
          <Path d="M5 20a7 7 0 0114 0" />
        </Svg>
      );
    case "phone":
      return (
        <Svg {...common}>
          <Path d="M6.6 3.5h2.6l1.4 4.2-2 1.4a11 11 0 006.3 6.3l1.4-2 4.2 1.4v2.6a2 2 0 01-2.2 2A16.5 16.5 0 014.6 5.7a2 2 0 012-2.2z" />
        </Svg>
      );
    case "share":
      return (
        <Svg {...common}>
          <Path d="M14 5l6 6-6 6" />
          <Path d="M20 11h-8a7 7 0 00-7 7v1" />
        </Svg>
      );
    case "key":
      return (
        <Svg {...common}>
          <Path d="M12 3l8 3.2v6.3c0 4.7-3.2 8.1-8 9.5-4.8-1.4-8-4.8-8-9.5V6.2L12 3z" />
          <Circle cx="12" cy="11" r="2" />
          <Path d="M12 13v3" />
        </Svg>
      );
    case "medical":
      return (
        <Svg {...common}>
          <Rect x="4" y="4" width="16" height="16" rx="3" />
          <Path d="M12 8v8M8 12h8" />
        </Svg>
      );
    case "chevron":
      return (
        <Svg {...common} width={18} height={18}>
          <Path d="M9 6l6 6-6 6" />
        </Svg>
      );
  }
}
