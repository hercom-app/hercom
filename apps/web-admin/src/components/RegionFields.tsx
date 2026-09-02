import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { DEFAULT_COUNTRY_CODE } from "../lib/adminFilters";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-hercom";

type RegionFieldsProps = {
  countryCode?: string;
  department: string;
  province: string;
  district: string;
  onCountryCodeChange?: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onProvinceChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  showCountrySelect?: boolean;
  provinceOptionalLabel?: string;
  districtOptionalLabel?: string;
};

export function RegionFields({
  countryCode = DEFAULT_COUNTRY_CODE,
  department,
  province,
  district,
  onCountryCodeChange,
  onDepartmentChange,
  onProvinceChange,
  onDistrictChange,
  showCountrySelect = true,
  provinceOptionalLabel,
  districtOptionalLabel,
}: RegionFieldsProps) {
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

  const level1Label = geoConfig?.level1Label ?? "Nivel 1";
  const level2Label = geoConfig?.level2Label ?? "Nivel 2";
  const level3Label = geoConfig?.level3Label ?? "Nivel 3";

  return (
    <div className="space-y-3">
      {showCountrySelect && onCountryCodeChange !== undefined && (
        <select
          value={countryCode}
          onChange={(event) => {
            onCountryCodeChange(event.target.value);
            onDepartmentChange("");
            onProvinceChange("");
            onDistrictChange("");
          }}
          className={inputClass}
        >
          {(countries ?? []).map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      )}
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
            {level1Label}
          </option>
          {(level1 ?? []).map((item) => (
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
          <option value="">
            {provinceOptionalLabel ?? `Toda la ${level2Label.toLowerCase()}`}
          </option>
          {(level2 ?? []).map((item) => (
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
          <option value="">
            {districtOptionalLabel ??
              `Todo el ${level3Label.toLowerCase()} / ${level2Label.toLowerCase()}`}
          </option>
          {(level3 ?? []).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export { inputClass };
