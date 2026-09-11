import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { HERCOM_COLORS } from "../constants/theme";
import { useAppTheme } from "../contexts/ThemeContext";

type OpsHudBackdropProps = {
  /** Login de ops: forzar paleta de consola aunque el tema de la app sea claro. */
  forceScheme?: "dark" | "light";
};

/**
 * Fondo de login tipo consola de ops (CoD / SilentArc):
 * grilla, curvas de nivel, ruta de misión y barrido — sin camo.
 */
export function OpsHudBackdrop({ forceScheme }: OpsHudBackdropProps) {
  const { scheme } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const isDark = (forceScheme ?? scheme) === "dark";
  const scan = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(scan, {
        toValue: 1,
        duration: 5600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
      scan.setValue(0);
    };
  }, [scan]);

  const bg = isDark ? "#07090D" : "#E8EEF4";
  const grid = isDark ? "rgba(11, 112, 254, 0.16)" : "rgba(11, 112, 254, 0.1)";
  const topo = isDark ? "rgba(107, 168, 255, 0.28)" : "rgba(11, 112, 254, 0.18)";
  const route = isDark ? HERCOM_COLORS.primary : "#0959CC";
  const glow = isDark ? "rgba(11, 112, 254, 0.38)" : "rgba(11, 112, 254, 0.22)";
  const scanColor = isDark
    ? "rgba(11, 112, 254, 0.45)"
    : "rgba(11, 112, 254, 0.28)";

  const translateY = scan.interpolate({
    inputRange: [0, 1],
    outputRange: [-24, height],
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="opsGlow" cx="50%" cy="38%" r="55%">
            <Stop offset="0" stopColor={glow} stopOpacity="1" />
            <Stop offset="1" stopColor={bg} stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="opsVignette" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={bg} stopOpacity="0.55" />
            <Stop offset="0.35" stopColor={bg} stopOpacity="0" />
            <Stop offset="0.72" stopColor={bg} stopOpacity="0.15" />
            <Stop offset="1" stopColor={bg} stopOpacity="0.82" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width={width} height={height} fill={bg} />
        {Array.from({ length: Math.ceil(width / 28) + 1 }, (_, index) => (
          <Line
            key={`v-${index}`}
            x1={index * 28}
            y1={0}
            x2={index * 28}
            y2={height}
            stroke={grid}
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: Math.ceil(height / 28) + 1 }, (_, index) => (
          <Line
            key={`h-${index}`}
            x1={0}
            y1={index * 28}
            x2={width}
            y2={index * 28}
            stroke={grid}
            strokeWidth={1}
          />
        ))}
        <Rect x="0" y="0" width={width} height={height} fill="url(#opsGlow)" />

        <Ellipse
          cx={width * 0.52}
          cy={height * 0.34}
          rx={width * 0.42}
          ry={width * 0.28}
          fill="none"
          stroke={topo}
          strokeWidth={1.2}
        />
        <Ellipse
          cx={width * 0.5}
          cy={height * 0.33}
          rx={width * 0.3}
          ry={width * 0.2}
          fill="none"
          stroke={topo}
          strokeWidth={1}
        />
        <Ellipse
          cx={width * 0.48}
          cy={height * 0.32}
          rx={width * 0.18}
          ry={width * 0.12}
          fill="none"
          stroke={topo}
          strokeWidth={1}
        />
        <Path
          d={`M ${width * 0.08} ${height * 0.22}
              C ${width * 0.22} ${height * 0.1}, ${width * 0.4} ${height * 0.18}, ${width * 0.55} ${height * 0.16}
              S ${width * 0.88} ${height * 0.08}, ${width * 0.96} ${height * 0.2}`}
          fill="none"
          stroke={topo}
          strokeWidth={1}
        />
        <Path
          d={`M ${width * 0.04} ${height * 0.42}
              C ${width * 0.28} ${height * 0.5}, ${width * 0.5} ${height * 0.38}, ${width * 0.78} ${height * 0.46}
              S ${width * 1.02} ${height * 0.4}, ${width * 1.08} ${height * 0.5}`}
          fill="none"
          stroke={topo}
          strokeWidth={1}
        />

        <Path
          d={`M ${width * 0.18} ${height * 0.48}
              L ${width * 0.34} ${height * 0.36}
              L ${width * 0.52} ${height * 0.4}
              L ${width * 0.7} ${height * 0.28}
              L ${width * 0.84} ${height * 0.34}`}
          fill="none"
          stroke={route}
          strokeWidth={1.6}
          strokeDasharray="5 6"
        />
        {[
          [0.18, 0.48],
          [0.34, 0.36],
          [0.52, 0.4],
          [0.7, 0.28],
          [0.84, 0.34],
        ].map(([x, y], index) => (
          <Circle
            key={`n-${index}`}
            cx={width * x}
            cy={height * y}
            r={index === 2 ? 4.5 : 3}
            fill={index === 2 ? route : bg}
            stroke={route}
            strokeWidth={1.5}
          />
        ))}

        <Line
          x1={width / 2 - 18}
          y1={height * 0.36}
          x2={width / 2 + 18}
          y2={height * 0.36}
          stroke={route}
          strokeWidth={1}
          opacity={0.45}
        />
        <Line
          x1={width / 2}
          y1={height * 0.36 - 18}
          x2={width / 2}
          y2={height * 0.36 + 18}
          stroke={route}
          strokeWidth={1}
          opacity={0.45}
        />

        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="url(#opsVignette)"
        />
      </Svg>

      <Animated.View
        style={[
          styles.scan,
          { backgroundColor: scanColor, transform: [{ translateY }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scan: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.7,
  },
});
