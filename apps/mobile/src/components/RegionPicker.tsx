import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";

type RegionPickerProps = {
  department: string;
  province: string;
  district: string;
  onDepartmentChange: (value: string) => void;
  onProvinceChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  detectedRegionLabel?: string;
};

function OptionChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`mr-2 rounded-full px-3 py-1.5 ${
        selected ? "bg-hercom" : "bg-slate-200"
      }`}
    >
      <Text
        className={`text-xs font-semibold ${
          selected ? "text-white" : "text-slate-700"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function RegionPicker({
  department,
  province,
  district,
  onDepartmentChange,
  onProvinceChange,
  onDistrictChange,
  detectedRegionLabel,
}: RegionPickerProps) {
  const departments = useQuery(api.promotions.listDepartments, {});
  const provinces = useQuery(
    api.promotions.listProvinces,
    department !== "" ? { department } : "skip",
  );
  const districts = useQuery(
    api.promotions.listDistricts,
    department !== "" && province !== ""
      ? { department, province }
      : "skip",
  );

  return (
    <View className="gap-3">
      <Text className="text-xs font-semibold text-slate-600">
        Región del recojo (para promociones)
      </Text>
      {detectedRegionLabel !== undefined && detectedRegionLabel !== "" && (
        <Text className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          Detectado por GPS: {detectedRegionLabel}. Puedes ajustarlo manualmente.
        </Text>
      )}
      {department !== "" && (
        <View className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <Text className="mb-1 text-[10px] font-semibold uppercase text-slate-500">
            Región detectada
          </Text>
          <Text className="text-sm text-slate-800">
            <Text className="font-semibold">Departamento:</Text> {department}
          </Text>
          {province !== "" ? (
            <Text className="text-sm text-slate-800">
              <Text className="font-semibold">Provincia:</Text> {province}
            </Text>
          ) : (
            <Text className="text-sm text-slate-500">Provincia: (elige abajo)</Text>
          )}
          {district !== "" ? (
            <Text className="text-sm text-slate-800">
              <Text className="font-semibold">Distrito:</Text> {district}
            </Text>
          ) : province !== "" ? (
            <Text className="text-sm text-slate-500">Distrito: (elige abajo o deja toda la provincia)</Text>
          ) : null}
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(departments ?? []).map((item) => (
          <OptionChip
            key={item}
            label={item}
            selected={department === item}
            onPress={() => {
              onDepartmentChange(item);
              onProvinceChange("");
              onDistrictChange("");
            }}
          />
        ))}
      </ScrollView>
      {department !== "" && (provinces ?? []).length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <OptionChip
            label="Toda la provincia"
            selected={province === ""}
            onPress={() => {
              onProvinceChange("");
              onDistrictChange("");
            }}
          />
          {(provinces ?? []).map((item) => (
            <OptionChip
              key={item}
              label={item}
              selected={province === item}
              onPress={() => {
                onProvinceChange(item);
                onDistrictChange("");
              }}
            />
          ))}
        </ScrollView>
      )}
      {province !== "" && (districts ?? []).length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <OptionChip
            label="Todo el distrito"
            selected={district === ""}
            onPress={() => onDistrictChange("")}
          />
          {(districts ?? []).map((item) => (
            <OptionChip
              key={item}
              label={item}
              selected={district === item}
              onPress={() => onDistrictChange(item)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
