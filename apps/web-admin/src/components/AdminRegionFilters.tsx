import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { RegionFilter } from "../lib/adminFilters";
import { selectClass } from "../lib/adminUi";

export type DistrictScopeOption = {
  countryCode: string;
  department: string;
  province: string;
  district: string;
};

type AdminRegionFiltersProps = {
  value: RegionFilter;
  onChange: (value: RegionFilter) => void;
  children?: React.ReactNode;
  allowedScopes?: DistrictScopeOption[] | undefined;
};

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value !== ""))];
}

export function AdminRegionFilters({
  value,
  onChange,
  children,
  allowedScopes,
}: AdminRegionFiltersProps) {
  const scoped = allowedScopes !== undefined && allowedScopes.length > 0;
  const countries = useQuery(api.geo.listCountries, {});
  const geoConfig = useQuery(api.geo.getCountryConfig, {
    countryCode: value.countryCode,
  });
  const level1 = useQuery(
    api.geo.listLevel1,
    scoped ? "skip" : { countryCode: value.countryCode },
  );
  const level2 = useQuery(
    api.geo.listLevel2,
    scoped || value.department === ""
      ? "skip"
      : { countryCode: value.countryCode, level1: value.department },
  );
  const level3 = useQuery(
    api.geo.listLevel3,
    scoped || value.department === "" || value.province === ""
      ? "skip"
      : {
          countryCode: value.countryCode,
          level1: value.department,
          level2: value.province,
        },
  );

  const countryOptions = scoped
    ? unique(allowedScopes.map((scope) => scope.countryCode))
    : (countries ?? []).map((country) => country.code);
  const countryNames = new Map(
    (countries ?? []).map((country) => [country.code, country.name]),
  );

  const level1Options = scoped
    ? unique(
        allowedScopes
          .filter((scope) => scope.countryCode === value.countryCode)
          .map((scope) => scope.department),
      )
    : (level1 ?? []);
  const level2Options = scoped
    ? unique(
        allowedScopes
          .filter(
            (scope) =>
              scope.countryCode === value.countryCode &&
              scope.department === value.department,
          )
          .map((scope) => scope.province),
      )
    : (level2 ?? []);
  const level3Options = scoped
    ? unique(
        allowedScopes
          .filter(
            (scope) =>
              scope.countryCode === value.countryCode &&
              scope.department === value.department &&
              scope.province === value.province,
          )
          .map((scope) => scope.district),
      )
    : (level3 ?? []);

  const level1Label = geoConfig?.level1Label ?? "Nivel 1";
  const level2Label = geoConfig?.level2Label ?? "Nivel 2";
  const level3Label = geoConfig?.level3Label ?? "Nivel 3";

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {scoped ? "Zonas asignadas" : "Filtro geográfico"}
      </p>
      {scoped ? (
        <p className="text-xs text-slate-500">
          Solo puedes ver{" "}
          {allowedScopes.map((scope) => scope.district).join(", ")}.
        </p>
      ) : null}
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
          {countryOptions.map((code) => (
            <option key={code} value={code}>
              {countryNames.get(code) ?? code}
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
            {level1Options.map((item) => (
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
          {level2Options.map((item) => (
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
          {level3Options.map((item) => (
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
