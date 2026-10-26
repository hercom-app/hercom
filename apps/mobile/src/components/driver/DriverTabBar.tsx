import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DrawerIcon, type DrawerIconName } from "../DrawerIcons";
import { useAppTheme } from "../../contexts/ThemeContext";
import { HERCOM_COLORS, POPPINS } from "../../constants/theme";

export type DriverTab = "servicio" | "lista" | "ingresos" | "chats" | "perfil";

const TABS: { key: DriverTab; label: string; icon: DrawerIconName }[] = [
  { key: "servicio", label: "Servicio", icon: "navigate" },
  { key: "lista", label: "Lista", icon: "list" },
  { key: "ingresos", label: "Ingresos", icon: "wallet" },
  { key: "chats", label: "Chats", icon: "chat" },
  { key: "perfil", label: "Perfil", icon: "user" },
];

type DriverTabBarProps = {
  active: DriverTab;
  onChange: (tab: DriverTab) => void;
  badges?: Partial<Record<DriverTab, number>>;
};

/** Menú inferior fijo del chofer. */
export function DriverTabBar({ active, onChange, badges = {} }: DriverTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, border } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.baseElevated,
        borderTopWidth: 1,
        borderTopColor: border,
        paddingTop: 6,
        paddingBottom: Math.max(insets.bottom, 8),
      }}
    >
      {TABS.map((tab) => {
        const selected = tab.key === active;
        const badge = badges[tab.key] ?? 0;
        const tint = selected ? colors.textStrong : colors.steel;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={badge > 0 ? `${tab.label}, ${badge} nuevos` : tab.label}
            style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}
          >
            <View>
              <DrawerIcon name={tab.icon} color={tint} size={24} />
              {badge > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -10,
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 4,
                    borderRadius: 9,
                    backgroundColor: HERCOM_COLORS.danger,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: POPPINS.bold,
                      fontSize: 11,
                      color: HERCOM_COLORS.white,
                    }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </Text>
                </View>
              )}
            </View>
            <Text
              numberOfLines={1}
              style={{
                marginTop: 3,
                fontFamily: selected ? POPPINS.semibold : POPPINS.medium,
                fontSize: 12,
                color: tint,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
