import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { MONO, TACTICAL_COLORS, TACTICAL_RADIUS } from "../constants/theme";

type SlideToConfirmProps = {
  label: string;
  onSlideComplete: () => Promise<void> | void;
  disabled?: boolean;
  loading?: boolean;
  resetSignal?: string | number;
};

const KNOB_SIZE = 44;
const TRACK_PADDING = 4;

export function SlideToConfirm({
  label,
  onSlideComplete,
  disabled = false,
  loading = false,
  resetSignal,
}: SlideToConfirmProps) {
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

  return (
    <View
      onLayout={handleTrackLayout}
      className="h-14 w-full px-1"
      style={{
        justifyContent: "center",
        backgroundColor: disabled
          ? "rgba(91, 132, 177, 0.12)"
          : "rgba(161, 196, 253, 0.14)",
        borderRadius: TACTICAL_RADIUS.sharp,
        borderWidth: 1,
        borderColor: disabled
          ? "rgba(91, 132, 177, 0.28)"
          : TACTICAL_COLORS.accent,
      }}
    >
      <View className="absolute left-0 right-0 items-center">
        <Text
          style={{
            fontFamily: MONO.medium,
            fontSize: 11,
            letterSpacing: 1.4,
            color: disabled ? TACTICAL_COLORS.steel : TACTICAL_COLORS.accent,
          }}
        >
          {(loading ? "Procesando..." : label).toUpperCase()}
        </Text>
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateX }],
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          borderRadius: TACTICAL_RADIUS.sharp,
          marginLeft: TRACK_PADDING,
          backgroundColor: disabled
            ? TACTICAL_COLORS.steel
            : TACTICAL_COLORS.accent,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color={TACTICAL_COLORS.base} />
        ) : (
          <Text
            style={{
              fontFamily: MONO.bold,
              fontSize: 18,
              color: TACTICAL_COLORS.base,
            }}
          >
            ›
          </Text>
        )}
      </Animated.View>
    </View>
  );
}
