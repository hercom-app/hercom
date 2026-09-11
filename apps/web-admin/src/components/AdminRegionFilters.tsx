import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import {
  EMPTY_REGION_FILTER,
  formatAdminScopeLabel,
  type RegionFilter,
} from "../lib/adminFilters";
import { btnPrimaryClass, btnSecondaryClass, selectClass } from "../lib/adminUi";

export type DistrictScopeOption = {
  countryCode: string;
  department: string;
  province: string;
  district: string;
};

type AdminRegionFiltersProps = {
  value: RegionFilter;
  onChange: (value: RegionFilter) => void;
  children?: ReactNode;
  allowedScopes?: DistrictScopeOption[] | undefined;
  onClear?: () => void;
};

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value !== ""))];
}

export function AdminRegionFilters({
  value,
  onChange,
  children,
  allowedScopes,
  onClear,
}: AdminRegionFiltersProps) {
  const [draft, setDraft] = useState<RegionFilter>(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const scoped = allowedScopes !== undefined && allowedScopes.length > 0;
  const countries = useQuery(api.geo.listCountries, {});
  const geoConfig = useQuery(api.geo.getCountryConfig, {
    countryCode: draft.countryCode,
  });
  const level1 = useQuery(
    api.geo.listLevel1,
    scoped ? "skip" : { countryCode: draft.countryCode },
  );
  const level2 = useQuery(
    api.geo.listLevel2,
    scoped || draft.department === ""
      ? "skip"
      : { countryCode: draft.countryCode, level1: draft.department },
  );
  const level3 = useQuery(
    api.geo.listLevel3,
    scoped || draft.department === "" || draft.province === ""
      ? "skip"
      : {
          countryCode: draft.countryCode,
          level1: draft.department,
          level2: draft.province,
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
          .filter((scope) => scope.countryCode === draft.countryCode)
          .map((scope) => scope.department),
      )
    : (level1 ?? []);
  const level2Options = scoped
    ? unique(
        allowedScopes
          .filter(
            (scope) =>
              scope.countryCode === draft.countryCode &&
              scope.department === draft.department,
          )
          .map((scope) => scope.province),
      )
    : (level2 ?? []);
  const level3Options = scoped
    ? unique(
        allowedScopes
          .filter(
            (scope) =>
              scope.countryCode === draft.countryCode &&
              scope.department === draft.department &&
              scope.province === draft.province &&
              scope.district.trim() !== "",
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
        {scoped ? "Zonas asignadas" : "Filtros"}
      </p>
      {scoped ? (
        <p className="text-xs text-slate-500">
          Solo ves {allowedScopes.map(formatAdminScopeLabel).join(" · ")}.
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select
          value={draft.countryCode}
          onChange={(event) =>
            setDraft({
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
            value={draft.department}
            onChange={(event) =>
              setDraft({
                ...draft,
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
          value={draft.province}
          onChange={(event) =>
            setDraft({
              ...draft,
              province: event.target.value,
              district: "",
            })
          }
          className={selectClass}
          disabled={draft.department === ""}
        >
          <option value="">Todas las {level2Label.toLowerCase()}s</option>
          {level2Options.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={draft.district}
          onChange={(event) =>
            setDraft({ ...draft, district: event.target.value })
          }
          className={selectClass}
          disabled={draft.department === "" || draft.province === ""}
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className={`${btnSecondaryClass} w-full sm:w-auto`}
          onClick={() => {
            setDraft(EMPTY_REGION_FILTER);
            onChange(EMPTY_REGION_FILTER);
            onClear?.();
          }}
        >
          Limpiar
        </button>
        <button
          type="button"
          className={`${btnPrimaryClass} w-full sm:w-auto`}
          onClick={() => onChange(draft)}
        >
          Filtrar
        </button>
      </div>
    </div>
  );
}
