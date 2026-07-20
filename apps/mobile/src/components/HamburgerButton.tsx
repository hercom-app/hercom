import { Text, TouchableOpacity, View } from "react-native";

type HamburgerButtonProps = {
  onPress: () => void;
};

/** Botón circular con 3 rayitas (estilo inDrive / Yango). */
export function HamburgerButton({ onPress }: HamburgerButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel="Abrir menú"
      activeOpacity={0.85}
      className="h-12 w-12 items-center justify-center rounded-full bg-white shadow-md"
      style={{
        shadowColor: "#0F172A",
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
      }}
    >
      <View className="gap-1.5">
        <View className="h-0.5 w-5 rounded-full bg-slate-900" />
        <View className="h-0.5 w-5 rounded-full bg-slate-900" />
        <View className="h-0.5 w-5 rounded-full bg-slate-900" />
      </View>
    </TouchableOpacity>
  );
}
