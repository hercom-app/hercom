import { Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../contexts/ThemeContext";
import { POPPINS } from "../../constants/theme";

type SegmentedTabsProps<K extends string> = {
  options: { key: K; label: string; badge?: number }[];
  value: K;
  onChange: (key: K) => void;
};

export function SegmentedTabs<K extends string>({
  options,
  value,
  onChange,
}: SegmentedTabsProps<K>) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.surfaceSunken,
        borderRadius: 14,
        padding: 4,
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 4,
      }}
    >
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <TouchableOpacity
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: selected ? colors.surface : "transparent",
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: selected ? POPPINS.semibold : POPPINS.medium,
                fontSize: 15,
                color: selected ? colors.textStrong : colors.steel,
              }}
            >
              {option.badge !== undefined && option.badge > 0
                ? `${option.label} (${option.badge})`
                : option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
