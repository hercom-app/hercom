import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-hercom";

type RegionFieldsProps = {
  department: string;
  province: string;
  district: string;
  onDepartmentChange: (value: string) => void;
  onProvinceChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  provinceOptionalLabel?: string;
  districtOptionalLabel?: string;
};

export function RegionFields({
  department,
  province,
  district,
  onDepartmentChange,
  onProvinceChange,
  onDistrictChange,
  provinceOptionalLabel = "Toda la provincia",
  districtOptionalLabel = "Todo el distrito / provincia",
}: RegionFieldsProps) {
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
    <div className="grid gap-3 md:grid-cols-3">
      <select
        required
        value={department}
        onChange={(event) => {
          onDepartmentChange(event.target.value);
          onProvinceChange("");
          onDistrictChange("");
        }}
        className={inputClass}
      >
        <option value="" disabled>
          Departamento
        </option>
        {(departments ?? []).map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <select
        value={province}
        onChange={(event) => {
          onProvinceChange(event.target.value);
          onDistrictChange("");
        }}
        className={inputClass}
        disabled={department === ""}
      >
        <option value="">{provinceOptionalLabel}</option>
        {(provinces ?? []).map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <select
        value={district}
        onChange={(event) => onDistrictChange(event.target.value)}
        className={inputClass}
        disabled={department === "" || province === ""}
      >
        <option value="">{districtOptionalLabel}</option>
        {(districts ?? []).map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}

export { inputClass };
