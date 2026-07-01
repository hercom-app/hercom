import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";

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
      className={`h-14 w-full rounded-full px-1 ${
        disabled ? "bg-slate-200" : "bg-emerald-100"
      }`}
      style={{ justifyContent: "center" }}
    >
      <View className="absolute left-0 right-0 items-center">
        <Text className={`text-sm font-semibold ${disabled ? "text-slate-500" : "text-emerald-800"}`}>
          {loading ? "Procesando..." : label}
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
          backgroundColor: disabled ? "#94A3B8" : "#059669",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-xl font-bold text-white">›</Text>
        )}
      </Animated.View>
    </View>
  );
}
