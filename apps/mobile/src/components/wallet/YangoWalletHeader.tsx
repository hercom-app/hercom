import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WALLET_FONT, WALLET_TYPE, useWalletTheme } from "./walletUiTheme";

type YangoWalletHeaderProps = {
  title: string;
  onBack: () => void;
};

export function YangoWalletHeader({ title, onBack }: YangoWalletHeaderProps) {
  const insets = useSafeAreaInsets();
  const wallet = useWalletTheme();

  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 8,
        backgroundColor: wallet.bg,
      }}
    >
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          className="h-11 w-11 items-center justify-center"
        >
          <Text
            style={{
              fontFamily: WALLET_FONT.bold,
              fontSize: 28,
              color: wallet.text,
              marginTop: -2,
            }}
          >
            ‹
          </Text>
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: WALLET_FONT.semibold,
            fontSize: WALLET_TYPE.screenTitle,
            color: wallet.text,
            marginRight: 44,
          }}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}
