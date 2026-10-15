import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";

type WalletScreenTransitionProps = {
  screenKey: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Entrada lateral suave (estilo stack Yango). */
export function WalletScreenTransition({
  screenKey,
  children,
  style,
}: WalletScreenTransitionProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateX.setValue(24);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [screenKey, opacity, translateX]);

  return (
    <Animated.View
      style={[
        { flex: 1, opacity, transform: [{ translateX }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
