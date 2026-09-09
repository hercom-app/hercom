import { useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";

const DEFAULT_COUNTRY_CODE = "PE";

type DriverRegionFieldsProps = {
  countryCode: string;
  department: string;
  province: string;
  district: string;
  onCountryCodeChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onProvinceChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
};

type PickerTarget = "country" | "level1" | "level2" | "level3" | null;

export function DriverRegionFields({
  countryCode,
  department,
  province,
  district,
  onCountryCodeChange,
  onDepartmentChange,
  onProvinceChange,
  onDistrictChange,
}: DriverRegionFieldsProps) {
  const insets = useSafeAreaInsets();
  const [picker, setPicker] = useState<PickerTarget>(null);
  const sheetMaxHeight = Math.round(Dimensions.get("window").height * 0.72);

  const countries = useQuery(api.geo.listCountries, {});
  const geoConfig = useQuery(api.geo.getCountryConfig, { countryCode });
  const level1 = useQuery(api.geo.listLevel1, { countryCode });
  const level2 = useQuery(
    api.geo.listLevel2,
    department !== "" ? { countryCode, level1: department } : "skip",
  );
  const level3 = useQuery(
    api.geo.listLevel3,
    department !== "" && province !== ""
      ? { countryCode, level1: department, level2: province }
      : "skip",
  );

  const level1Label = geoConfig?.level1Label ?? "Departamento";
  const level2Label = geoConfig?.level2Label ?? "Provincia";
  const level3Label = geoConfig?.level3Label ?? "Distrito";

  const pickerTitle = useMemo(() => {
    switch (picker) {
      case "country":
        return "País";
      case "level1":
        return level1Label;
      case "level2":
        return level2Label;
      case "level3":
        return level3Label;
      default:
        return "Seleccionar";
    }
  }, [level1Label, level2Label, level3Label, picker]);

  const pickerOptions = useMemo(() => {
    switch (picker) {
      case "country":
        return (countries ?? []).map((country) => ({
          value: country.code,
          label: country.name,
        }));
      case "level1":
        return (level1 ?? []).map((item) => ({ value: item, label: item }));
      case "level2":
        return (level2 ?? []).map((item) => ({ value: item, label: item }));
      case "level3":
        return (level3 ?? []).map((item) => ({ value: item, label: item }));
      default:
        return [];
    }
  }, [countries, level1, level2, level3, picker]);

  function handleSelect(value: string) {
    if (picker === "country") {
      onCountryCodeChange(value);
      onDepartmentChange("");
      onProvinceChange("");
      onDistrictChange("");
    } else if (picker === "level1") {
      onDepartmentChange(value);
      onProvinceChange("");
      onDistrictChange("");
    } else if (picker === "level2") {
      onProvinceChange(value);
      onDistrictChange("");
    } else if (picker === "level3") {
      onDistrictChange(value);
    }
    setPicker(null);
  }

  const countryName =
    countries?.find((country) => country.code === countryCode)?.name ??
    countryCode;

  return (
    <View className="mb-4 gap-2">
      <TouchableOpacity
        onPress={() => setPicker("country")}
        className="rounded-2xl bg-slate-100 px-4 py-3"
      >
        <Text className="text-xs text-slate-500">País</Text>
        <Text className="mt-0.5 text-base font-medium text-slate-900">
          {countryName}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setPicker("level1")}
        className="rounded-2xl bg-slate-100 px-4 py-3"
      >
        <Text className="text-xs text-slate-500">{level1Label}</Text>
        <Text className="mt-0.5 text-base font-medium text-slate-900">
          {department !== ""
            ? department
            : `Selecciona ${level1Label.toLowerCase()}`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => department !== "" && setPicker("level2")}
        disabled={department === ""}
        className={`rounded-2xl bg-slate-100 px-4 py-3 ${
          department === "" ? "opacity-50" : ""
        }`}
      >
        <Text className="text-xs text-slate-500">{level2Label}</Text>
        <Text className="mt-0.5 text-base font-medium text-slate-900">
          {province !== ""
            ? province
            : `Selecciona ${level2Label.toLowerCase()}`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => province !== "" && setPicker("level3")}
        disabled={department === "" || province === ""}
        className={`rounded-2xl bg-slate-100 px-4 py-3 ${
          department === "" || province === "" ? "opacity-50" : ""
        }`}
      >
        <Text className="text-xs text-slate-500">{level3Label}</Text>
        <Text className="mt-0.5 text-base font-medium text-slate-900">
          {district !== ""
            ? district
            : `Selecciona ${level3Label.toLowerCase()}`}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={picker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPicker(null)}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPicker(null)} />
          <View
            style={[
              styles.sheet,
              {
                maxHeight: sheetMaxHeight,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View className="mb-2 items-center">
              <View className="h-1 w-10 rounded-full bg-slate-300" />
            </View>
            <Text className="mb-3 text-center text-base font-bold text-slate-900">
              {pickerTitle}
            </Text>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              style={{ maxHeight: sheetMaxHeight - 88 }}
            >
              {pickerOptions.length === 0 ? (
                <Text className="py-6 text-center text-sm text-slate-500">
                  Cargando opciones…
                </Text>
              ) : (
                pickerOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => handleSelect(option.value)}
                    className="border-b border-slate-100 py-3.5"
                  >
                    <Text className="text-base text-slate-800">{option.label}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setPicker(null)}
              className="mt-3 items-center rounded-2xl bg-slate-100 py-3"
            >
              <Text className="font-semibold text-slate-700">Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});

export { DEFAULT_COUNTRY_CODE };
