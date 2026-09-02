import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { RegionFilter } from "../lib/adminFilters";
import { selectClass } from "../lib/adminUi";

type AdminRegionFiltersProps = {
  value: RegionFilter;
  onChange: (value: RegionFilter) => void;
  children?: React.ReactNode;
};

export function AdminRegionFilters({
  value,
  onChange,
  children,
}: AdminRegionFiltersProps) {
  const countries = useQuery(api.geo.listCountries, {});
  const geoConfig = useQuery(api.geo.getCountryConfig, {
    countryCode: value.countryCode,
  });
  const level1 = useQuery(api.geo.listLevel1, { countryCode: value.countryCode });
  const level2 = useQuery(
    api.geo.listLevel2,
    value.department !== ""
      ? { countryCode: value.countryCode, level1: value.department }
      : "skip",
  );
  const level3 = useQuery(
    api.geo.listLevel3,
    value.department !== "" && value.province !== ""
      ? {
          countryCode: value.countryCode,
          level1: value.department,
          level2: value.province,
        }
      : "skip",
  );

  const level1Label = geoConfig?.level1Label ?? "Nivel 1";
  const level2Label = geoConfig?.level2Label ?? "Nivel 2";
  const level3Label = geoConfig?.level3Label ?? "Nivel 3";

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Filtro geográfico
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select
          value={value.countryCode}
          onChange={(event) =>
            onChange({
              countryCode: event.target.value,
              department: "",
              province: "",
              district: "",
            })
          }
          className={selectClass}
        >
          {(countries ?? []).map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
        <div>
          <label className="sr-only" htmlFor="filter-department">
            {level1Label}
          </label>
          <select
            id="filter-department"
            value={value.department}
            onChange={(event) =>
              onChange({
                ...value,
                department: event.target.value,
                province: "",
                district: "",
              })
            }
            className={selectClass}
          >
            <option value="">Todos los {level1Label.toLowerCase()}s</option>
            {(level1 ?? []).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <select
          value={value.province}
          onChange={(event) =>
            onChange({
              ...value,
              province: event.target.value,
              district: "",
            })
          }
          className={selectClass}
          disabled={value.department === ""}
        >
          <option value="">Todas las {level2Label.toLowerCase()}s</option>
          {(level2 ?? []).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={value.district}
          onChange={(event) =>
            onChange({ ...value, district: event.target.value })
          }
          className={selectClass}
          disabled={value.department === "" || value.province === ""}
        >
          <option value="">Todos los {level3Label.toLowerCase()}s</option>
          {(level3 ?? []).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      {children !== undefined && (
        <div className="grid gap-3 sm:grid-cols-2">{children}</div>
      )}
    </div>
  );
}
