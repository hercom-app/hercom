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
import { useAppTheme } from "../contexts/ThemeContext";
import { HERCOM_COLORS, POPPINS, UBER_RADIUS } from "../constants/theme";

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
  const { colors } = useAppTheme();
  const { width: screenW, height: screenH } = Dimensions.get("window");
  const diagramMarkCount = marks.filter((m) => m.view === "diagram").length;

  const embedW = screenW - 40;
  const embedH = embedW / DIAGRAM_ASPECT;

  const fullW = screenW - 16;
  const fullHByW = fullW / DIAGRAM_ASPECT;
  const maxFullH = screenH - insets.top - insets.bottom - 120;
  const fullH = Math.min(fullHByW, maxFullH);
  const fullWFinal = fullH * DIAGRAM_ASPECT;

  return (
    <View>
      <Text style={{ fontFamily: POPPINS.regular, fontSize: 15, color: colors.text, marginBottom: 10 }}>
        {diagramMarkCount > 0
          ? `${diagramMarkCount} ${diagramMarkCount === 1 ? "marca" : "marcas"}. Toca una marca para quitarla.`
          : "Toca el vehículo donde veas una abolladura."}
      </Text>

      <DiagramPad
        width={embedW}
        height={embedH}
        marks={marks}
        onChange={onChange}
      />

      <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
        <SoftButton label="Ampliar" onPress={() => setExpanded(true)} />
        {diagramMarkCount > 0 && (
          <SoftButton
            label="Limpiar marcas"
            danger
            onPress={() => onChange(marks.filter((m) => m.view !== "diagram"))}
          />
        )}
      </View>

      <Modal
        visible={expanded}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setExpanded(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.base,
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 8,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              marginBottom: 8,
            }}
          >
            <Text style={{ fontFamily: POPPINS.bold, fontSize: 24, color: colors.textStrong }}>
              Marcar abolladuras
            </Text>
            <TouchableOpacity
              onPress={() => setExpanded(false)}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: HERCOM_COLORS.primary,
              }}
            >
              <Text style={{ fontFamily: POPPINS.bold, fontSize: 16, color: HERCOM_COLORS.white }}>
                Listo
              </Text>
            </TouchableOpacity>
          </View>
          <Text
            style={{
              paddingHorizontal: 20,
              marginBottom: 12,
              fontFamily: POPPINS.regular,
              fontSize: 15,
              color: colors.text,
            }}
          >
            Toca el vehículo. Toca una marca roja para quitarla.
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
});

function SoftButton({
  label,
  onPress,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        flex: 1,
        height: 48,
        borderRadius: 999,
        backgroundColor: colors.surfaceSunken,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: POPPINS.semibold,
          fontSize: 16,
          color: danger ? colors.danger : colors.textStrong,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
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
  const { colors } = useAppTheme();
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
        backgroundColor: HERCOM_COLORS.white,
        borderRadius: UBER_RADIUS.card,
        borderWidth: 1,
        borderColor: colors.surfaceSunken,
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
              borderColor: HERCOM_COLORS.white,
              backgroundColor: HERCOM_COLORS.danger,
            }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: HERCOM_COLORS.white }}
            >
              ×
            </Text>
          </View>
        </View>
      ))}
    </Pressable>
  );
}
