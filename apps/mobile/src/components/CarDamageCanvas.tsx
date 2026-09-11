import { memo, useState } from "react";
import {
  Dimensions,
  Image,
  LayoutChangeEvent,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TacticalLabel, TacticalText, TacticalTitle } from "./tactical";
import {
  TACTICAL_BORDER,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";

export type CarView = "front" | "rear" | "side" | "diagram";

export type DamageMark = {
  view: CarView;
  /** 0–1 relativo al diagrama completo */
  x: number;
  y: number;
};

const DIAGRAM = require("../../assets/images/car-damage-diagram.png");
/** Proporción del diagrama moderno (828×630 nativo → 1656×1260 retina). */
const DIAGRAM_ASPECT = 828 / 630;

type Props = {
  marks: DamageMark[];
  onChange: (marks: DamageMark[]) => void;
};

/**
 * Diagrama de daños tipo taller (planta + laterales + frente + trasera).
 * Vista embebida grande + modal a pantalla completa para marcar con precisión.
 */
export const CarDamageCanvas = memo(function CarDamageCanvas({
  marks,
  onChange,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = Dimensions.get("window");

  const embedW = screenW - 24;
  const embedH = embedW / DIAGRAM_ASPECT;

  const fullW = screenW - 16;
  const fullHByW = fullW / DIAGRAM_ASPECT;
  const maxFullH = screenH - insets.top - insets.bottom - 120;
  const fullH = Math.min(fullHByW, maxFullH);
  const fullWFinal = fullH * DIAGRAM_ASPECT;

  return (
    <View>
      <TacticalText size={12} className="mb-2">
        Tocá el vehículo para marcar abolladuras. Tocá una marca para
        quitarla.
      </TacticalText>

      <DiagramPad
        width={embedW}
        height={embedH}
        marks={marks}
        onChange={onChange}
      />

      <TouchableOpacity
        onPress={() => setExpanded(true)}
        className="mt-3 items-center py-3"
        style={{
          backgroundColor: TACTICAL_COLORS.accent,
          borderRadius: TACTICAL_RADIUS.sharp,
        }}
      >
        <TacticalLabel size={11} style={{ color: TACTICAL_COLORS.base }}>
          Ampliar diagrama a pantalla completa
        </TacticalLabel>
      </TouchableOpacity>

      {marks.filter((m) => m.view === "diagram").length > 0 && (
        <TouchableOpacity
          onPress={() =>
            onChange(marks.filter((m) => m.view !== "diagram"))
          }
          className="mt-2 py-1"
        >
          <TacticalLabel size={10} className="text-center" style={{ color: TACTICAL_COLORS.danger }}>
            Limpiar marcas
          </TacticalLabel>
        </TouchableOpacity>
      )}

      <Modal
        visible={expanded}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setExpanded(false)}
      >
        <View
          className="flex-1"
          style={{
            backgroundColor: TACTICAL_COLORS.base,
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 8,
          }}
        >
          <View className="mb-3 flex-row items-center justify-between px-4">
            <TacticalTitle size={16}>Marcar abolladuras</TacticalTitle>
            <TouchableOpacity
              onPress={() => setExpanded(false)}
              className="px-4 py-2"
              style={{
                backgroundColor: TACTICAL_COLORS.accent,
                borderRadius: TACTICAL_RADIUS.sharp,
              }}
            >
              <TacticalLabel size={11} style={{ color: TACTICAL_COLORS.base }}>
                Listo
              </TacticalLabel>
            </TouchableOpacity>
          </View>
          <TacticalText size={12} className="mb-3 px-4">
            Tocá el vehículo. Tocá una marca roja para quitarla.
          </TacticalText>
          <View className="flex-1 items-center justify-center px-2">
            <DiagramPad
              width={fullWFinal}
              height={fullH}
              marks={marks}
              onChange={onChange}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
});

function DiagramPad({
  width,
  height,
  marks,
  onChange,
}: {
  width: number;
  height: number;
  marks: DamageMark[];
  onChange: (marks: DamageMark[]) => void;
}) {
  const [size, setSize] = useState({ w: width, h: height });
  const diagramMarks = marks.filter((m) => m.view === "diagram");

  function onLayout(e: LayoutChangeEvent) {
    const { width: w, height: h } = e.nativeEvent.layout;
    const nextW = Math.max(w, 1);
    const nextH = Math.max(h, 1);
    setSize((prev) =>
      Math.abs(prev.w - nextW) < 0.5 && Math.abs(prev.h - nextH) < 0.5
        ? prev
        : { w: nextW, h: nextH },
    );
  }

  function handlePress(locationX: number, locationY: number) {
    const x = Math.min(1, Math.max(0, locationX / size.w));
    const y = Math.min(1, Math.max(0, locationY / size.h));

    const hitIndex = marks.findIndex(
      (m) =>
        m.view === "diagram" && Math.hypot(m.x - x, m.y - y) < 0.04,
    );
    if (hitIndex >= 0) {
      onChange(marks.filter((_, i) => i !== hitIndex));
      return;
    }
    onChange([...marks, { view: "diagram", x, y }]);
  }

  return (
    <Pressable
      onLayout={onLayout}
      onPress={(e) =>
        handlePress(e.nativeEvent.locationX, e.nativeEvent.locationY)
      }
      className="overflow-hidden"
      style={{
        width,
        height,
        alignSelf: "center",
        backgroundColor: TACTICAL_COLORS.surfaceSunken,
        borderRadius: TACTICAL_RADIUS.panel,
        borderWidth: 1,
        borderColor: TACTICAL_BORDER,
      }}
    >
      <View pointerEvents="none" style={{ width, height }}>
        <Image
          source={DIAGRAM}
          style={{ width, height }}
          resizeMode="contain"
        />
      </View>
      {diagramMarks.map((m, i) => (
        <View
          key={`d-${m.x.toFixed(3)}-${m.y.toFixed(3)}-${i}`}
          pointerEvents="none"
          className="absolute items-center justify-center"
          style={{
            left: m.x * size.w - 14,
            top: m.y * size.h - 14,
            width: 28,
            height: 28,
          }}
        >
          <View
            className="h-7 w-7 items-center justify-center"
            style={{
              borderRadius: 14,
              borderWidth: 2,
              borderColor: TACTICAL_COLORS.textStrong,
              backgroundColor: TACTICAL_COLORS.danger,
            }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: TACTICAL_COLORS.textStrong }}
            >
              ×
            </Text>
          </View>
        </View>
      ))}
    </Pressable>
  );
}
