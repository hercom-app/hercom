import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { AdminCard } from "./AdminLayout";
import { btnPrimaryClass, inputClass, labelClass } from "../lib/adminUi";

type Props = {
  countryCode: string;
};

export function DistrictPricingRulesPanel({ countryCode }: Props) {
  const rules = useQuery(api.districtPricingRules.listForAdmin, {
    countryCode,
  });
  const upsert = useMutation(api.districtPricingRules.upsert);
  const removeRule = useMutation(api.districtPricingRules.remove);

  const [department, setDepartment] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [maxOffer, setMaxOffer] = useState("");
  const [maxMarkupPercent, setMaxMarkupPercent] = useState("50");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const provinceTrim = province.trim();
      const districtTrim = district.trim();
      const maxOfferTrim = maxOffer.trim();
      const maxMarkupTrim = maxMarkupPercent.trim();
      await upsert({
        countryCode,
        department: department.trim(),
        active: true,
        ...(provinceTrim !== "" ? { province: provinceTrim } : {}),
        ...(districtTrim !== "" ? { district: districtTrim } : {}),
        ...(maxOfferTrim !== "" ? { maxDriverOfferPrice: Number(maxOfferTrim) } : {}),
        ...(maxMarkupTrim !== ""
          ? { maxDriverMarkupOverBase: Number(maxMarkupTrim) / 100 }
          : {}),
      });
      setMessage("Regla guardada.");
      setDepartment("");
      setProvince("");
      setDistrict("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar.",
      );
    }
  }

  return (
    <AdminCard>
      <h2 className="mb-2 text-lg font-semibold text-slate-900">
        Topes de oferta por distrito
      </h2>
      <p className="mb-4 text-sm text-slate-600">
        Limita cuánto puede ofertar un chofer sobre la tarifa base (anti-estafa).
        Si no hay regla, se usa el recargo máximo del mercado (+50% por defecto).
      </p>

      <form onSubmit={handleSubmit} className="mb-6 grid gap-3 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className={labelClass}>Departamento *</span>
          <input
            required
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Provincia (opcional)</span>
          <input
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Distrito (opcional)</span>
          <input
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Tope máximo oferta (S/)</span>
          <input
            type="number"
            min="1"
            step="0.01"
            value={maxOffer}
            onChange={(e) => setMaxOffer(e.target.value)}
            className={inputClass}
            placeholder="Ej. 120"
          />
        </label>
        <label className="block">
          <span className={labelClass}>Recargo máx. sobre base (%)</span>
          <input
            type="number"
            min="0"
            max="200"
            step="1"
            value={maxMarkupPercent}
            onChange={(e) => setMaxMarkupPercent(e.target.value)}
            className={inputClass}
          />
        </label>
        <button type="submit" className={`${btnPrimaryClass} md:col-span-2`}>
          Guardar regla
        </button>
        {message !== null && (
          <p className="text-sm text-emerald-700 md:col-span-2">{message}</p>
        )}
        {error !== null && (
          <p className="text-sm text-red-600 md:col-span-2">{error}</p>
        )}
      </form>

      {(rules ?? []).length === 0 ? (
        <p className="text-sm text-slate-500">Sin reglas para este país.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {(rules ?? []).map((rule) => (
            <li
              key={rule._id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
            >
              <span>
                {[rule.department, rule.province, rule.district]
                  .filter(Boolean)
                  .join(" · ")}
                {rule.maxDriverOfferPrice !== undefined &&
                  ` · máx S/${rule.maxDriverOfferPrice.toFixed(2)}`}
                {rule.maxDriverMarkupOverBase !== undefined &&
                  ` · +${Math.round(rule.maxDriverMarkupOverBase * 100)}%`}
              </span>
              <button
                type="button"
                className="text-xs font-semibold text-red-600"
                onClick={() => void removeRule({ ruleId: rule._id })}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}
