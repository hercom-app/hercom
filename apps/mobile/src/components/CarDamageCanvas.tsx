import { useState } from "react";
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
export function CarDamageCanvas({ marks, onChange }: Props) {
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
      <Text className="mb-2 text-xs text-slate-500">
        Tocá el vehículo para marcar abolladuras. Tocá una marca para
        quitarla.
      </Text>

      <DiagramPad
        width={embedW}
        height={embedH}
        marks={marks}
        onChange={onChange}
      />

      <TouchableOpacity
        onPress={() => setExpanded(true)}
        className="mt-3 rounded-xl bg-hercom py-3"
      >
        <Text className="text-center text-sm font-bold text-white">
          Ampliar diagrama a pantalla completa
        </Text>
      </TouchableOpacity>

      {marks.filter((m) => m.view === "diagram").length > 0 && (
        <TouchableOpacity
          onPress={() =>
            onChange(marks.filter((m) => m.view !== "diagram"))
          }
          className="mt-2 py-1"
        >
          <Text className="text-center text-xs font-semibold text-red-600">
            Limpiar marcas
          </Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={expanded}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setExpanded(false)}
      >
        <View
          className="flex-1 bg-slate-100"
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 8,
          }}
        >
          <View className="mb-3 flex-row items-center justify-between px-4">
            <Text className="text-base font-bold text-slate-900">
              Marcar abolladuras
            </Text>
            <TouchableOpacity
              onPress={() => setExpanded(false)}
              className="rounded-xl bg-brand px-4 py-2"
            >
              <Text className="text-sm font-bold text-white">Listo</Text>
            </TouchableOpacity>
          </View>
          <Text className="mb-3 px-4 text-xs text-slate-500">
            Tocá el vehículo. Tocá una marca roja para quitarla.
          </Text>
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
}

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
    setSize({ w: Math.max(w, 1), h: Math.max(h, 1) });
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
      className="overflow-hidden rounded-xl border border-slate-300 bg-white"
      style={{ width, height, alignSelf: "center" }}
    >
      <Image
        source={DIAGRAM}
        style={{ width, height }}
        resizeMode="contain"
        pointerEvents="none"
      />
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
          <View className="h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-red-600">
            <Text className="text-xs font-bold text-white">×</Text>
          </View>
        </View>
      ))}
    </Pressable>
  );
}
