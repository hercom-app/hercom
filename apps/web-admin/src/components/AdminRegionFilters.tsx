import type { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { RegionFilter } from "../lib/adminFilters";
import { filterPanelClass, labelClass, selectClass } from "../lib/adminUi";

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
    <div className={filterPanelClass}>
      <p className={labelClass}>Filtros de región</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="sr-only" htmlFor="filter-department">
            Departamento
          </label>
          <select
            id="filter-department"
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
        </div>
        <div>
          <label className="sr-only" htmlFor="filter-province">
            Provincia
          </label>
          <select
            id="filter-province"
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
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="sr-only" htmlFor="filter-district">
            Distrito
          </label>
          <select
            id="filter-district"
            value={value.district}
            onChange={(event) =>
              onChange({ ...value, district: event.target.value })
            }
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
      </div>
      {children !== undefined ? (
        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}
