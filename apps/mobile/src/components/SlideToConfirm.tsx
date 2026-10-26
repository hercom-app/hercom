import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { useAppTheme } from "../contexts/ThemeContext";
import { HERCOM_COLORS, POPPINS } from "../constants/theme";

type SlideToConfirmProps = {
  label: string;
  onSlideComplete: () => Promise<void> | void;
  disabled?: boolean;
  loading?: boolean;
  resetSignal?: string | number;
};

const KNOB_SIZE = 52;
const TRACK_PADDING = 4;

export function SlideToConfirm({
  label,
  onSlideComplete,
  disabled = false,
  loading = false,
  resetSignal,
}: SlideToConfirmProps) {
  const { colors } = useAppTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const currentValue = useRef(0);
  const maxTranslate = Math.max(trackWidth - KNOB_SIZE - TRACK_PADDING * 2, 0);

  useEffect(() => {
    const listenerId = translateX.addListener(({ value }) => {
      currentValue.current = value;
    });
    return () => {
      translateX.removeListener(listenerId);
    };
  }, [translateX]);

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 6,
    }).start();
  }, [resetSignal, translateX]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          !disabled && !loading && Math.abs(gestureState.dx) > 3,
        onPanResponderMove: (_, gestureState) => {
          const next = Math.min(Math.max(gestureState.dx, 0), maxTranslate);
          translateX.setValue(next);
        },
        onPanResponderRelease: () => {
          const threshold = maxTranslate * 0.82;
          if (currentValue.current >= threshold && maxTranslate > 0) {
            Animated.timing(translateX, {
              toValue: maxTranslate,
              duration: 100,
              useNativeDriver: true,
            }).start(() => {
              void onSlideComplete();
            });
            return;
          }
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
          }).start();
        },
      }),
    [disabled, loading, maxTranslate, onSlideComplete, translateX],
  );

  function handleTrackLayout(event: LayoutChangeEvent) {
    const width = event.nativeEvent.layout.width;
    if (width !== trackWidth) {
      setTrackWidth(width);
    }
  }

  const slideHint = disabled
    ? "Acción deshabilitada. Completa los pasos anteriores."
    : loading
      ? "Procesando acción"
      : label;

  return (
    <View
      onLayout={handleTrackLayout}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={slideHint}
      accessibilityHint="Desliza el control hacia la derecha para confirmar"
      accessibilityState={{ disabled: disabled || loading }}
      style={{
        height: KNOB_SIZE + TRACK_PADDING * 2,
        width: "100%",
        justifyContent: "center",
        borderRadius: 999,
        backgroundColor: disabled ? colors.surfaceSunken : HERCOM_COLORS.primary,
        overflow: "hidden",
      }}
    >
      <View
        pointerEvents="none"
        style={{ position: "absolute", left: 0, right: 0, alignItems: "center" }}
      >
        <Text
          numberOfLines={1}
          style={{
            fontFamily: POPPINS.bold,
            fontSize: 16,
            color: disabled ? colors.steel : HERCOM_COLORS.white,
            paddingHorizontal: KNOB_SIZE + 16,
            textAlign: "center",
          }}
        >
          {loading ? "Procesando…" : label}
        </Text>
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateX }],
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          borderRadius: KNOB_SIZE / 2,
          marginLeft: TRACK_PADDING,
          backgroundColor: disabled ? colors.steel : HERCOM_COLORS.white,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color={HERCOM_COLORS.primary} />
        ) : (
          <Text
            style={{
              fontFamily: POPPINS.bold,
              fontSize: 26,
              marginTop: -3,
              color: disabled ? colors.surfaceSunken : HERCOM_COLORS.primary,
            }}
          >
            ›
          </Text>
        )}
      </Animated.View>
    </View>
  );
}
