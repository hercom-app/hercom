import type { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { RegionFilter } from "../lib/adminFilters";
import { selectClass } from "../lib/adminFilters";

type AdminRegionFiltersProps = {
  value: RegionFilter;
  onChange: (value: RegionFilter) => void;
  children?: ReactNode;
};

export function AdminRegionFilters({
  value,
  onChange,
  children,
}: AdminRegionFiltersProps) {
  const departments = useQuery(api.promotions.listDepartments, {});
  const provinces = useQuery(
    api.promotions.listProvinces,
    value.department !== "" ? { department: value.department } : "skip",
  );
  const districts = useQuery(
    api.promotions.listDistricts,
    value.department !== "" && value.province !== ""
      ? { department: value.department, province: value.province }
      : "skip",
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Filtros de región
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <select
          value={value.department}
          onChange={(event) =>
            onChange({
              department: event.target.value,
              province: "",
              district: "",
            })
          }
          className={selectClass}
        >
          <option value="">Todos los departamentos</option>
          {(departments ?? []).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={value.province}
          onChange={(event) =>
            onChange({ ...value, province: event.target.value, district: "" })
          }
          className={selectClass}
          disabled={value.department === ""}
        >
          <option value="">Todas las provincias</option>
          {(provinces ?? []).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={value.district}
          onChange={(event) => onChange({ ...value, district: event.target.value })}
          className={selectClass}
          disabled={value.department === "" || value.province === ""}
        >
          <option value="">Todos los distritos</option>
          {(districts ?? []).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      {children !== undefined ? <div className="mt-3 grid gap-3 md:grid-cols-3">{children}</div> : null}
    </div>
  );
}
