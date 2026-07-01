import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { AdminRegionFilters } from "../components/AdminRegionFilters";
import { RegionFields, inputClass } from "../components/RegionFields";
import {
  EMPTY_REGION_FILTER,
  matchesPromotionRegion,
  matchesTextSearch,
  selectClass,
  type RegionFilter,
} from "../lib/adminFilters";

function formatDateInput(timestamp: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
}

function formatRegion(promotion: {
  department: string;
  province?: string;
  district?: string;
}): string {
  const parts = [promotion.department];
  if (promotion.province !== undefined) {
    parts.push(promotion.province);
  }
  if (promotion.district !== undefined) {
    parts.push(promotion.district);
  }
  return parts.join(" · ");
}

type ActiveFilter = "" | "active" | "inactive";

export function PromotionsView() {
  const promotions = useQuery(api.promotions.listForAdmin, {});
  const createPromotion = useMutation(api.promotions.create);
  const setActive = useMutation(api.promotions.setActive);
  const removePromotion = useMutation(api.promotions.remove);

  const [listRegion, setListRegion] = useState<RegionFilter>(EMPTY_REGION_FILTER);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("");
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [festivityLabel, setFestivityLabel] = useState("");
  const [department, setDepartment] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const discountRate = Number(discountPercent) / 100;
  const pricingPreview = useQuery(
    api.promotions.previewPricing,
    Number.isFinite(discountRate) && discountRate > 0
      ? { listPrice: 80, discountRate }
      : "skip",
  );

  const filteredPromotions = useMemo(() => {
    if (promotions === undefined) {
      return undefined;
    }
    return promotions.filter((promotion) => {
      if (activeFilter === "active" && !promotion.active) {
        return false;
      }
      if (activeFilter === "inactive" && promotion.active) {
        return false;
      }
      if (
        listRegion.department !== "" &&
        !matchesPromotionRegion(promotion, listRegion)
      ) {
        return false;
      }
      return matchesTextSearch(search, [
        promotion.name,
        promotion.festivityLabel,
        formatRegion(promotion),
      ]);
    });
  }, [promotions, listRegion, activeFilter, search]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      await createPromotion({
        name: name.trim(),
        ...(festivityLabel.trim() !== ""
          ? { festivityLabel: festivityLabel.trim() }
          : {}),
        department,
        ...(province !== "" ? { province } : {}),
        ...(district !== "" ? { district } : {}),
        discountRate: Number(discountPercent) / 100,
        startDate,
        endDate,
        active: true,
      });
      setMessage("Promoción creada y activada.");
      setName("");
      setFestivityLabel("");
      setDepartment("");
      setProvince("");
      setDistrict("");
      setStartDate("");
      setEndDate("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo crear la promoción.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Promociones</h1>
        <p className="text-sm text-slate-500">
          Campañas festivas por región. Tope de descuento 25%.
        </p>
      </div>

      <AdminRegionFilters value={listRegion} onChange={setListRegion}>
        <select
          value={activeFilter}
          onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}
          className={selectClass}
        >
          <option value="">Estado: todas</option>
          <option value="active">Solo activas</option>
          <option value="inactive">Solo inactivas</option>
        </select>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar nombre o festividad"
          className={inputClass}
        />
      </AdminRegionFilters>

      <section className="rounded-3xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Nueva promoción</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre interno de la promoción"
            className={inputClass}
          />
          <input
            value={festivityLabel}
            onChange={(event) => setFestivityLabel(event.target.value)}
            placeholder="Etiqueta de festividad (ej. Fiestas Patrias)"
            className={inputClass}
          />
          <RegionFields
            department={department}
            province={province}
            district={district}
            onDepartmentChange={setDepartment}
            onProvinceChange={setProvince}
            onDistrictChange={setDistrict}
          />
          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="number"
              min="1"
              max="25"
              step="1"
              required
              value={discountPercent}
              onChange={(event) => setDiscountPercent(event.target.value)}
              placeholder="Descuento % (máx. 25)"
              className={inputClass}
            />
            <input
              type="date"
              required
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className={inputClass}
            />
            <input
              type="date"
              required
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className={inputClass}
            />
          </div>
          {pricingPreview !== undefined && pricingPreview !== null && (
            <p className="rounded-xl bg-violet-50 px-3 py-2 text-xs text-violet-800">
              Vista previa S/80: cliente S/{pricingPreview.clientPrice.toFixed(2)}{" "}
              · chofer S/{pricingPreview.driverNet.toFixed(2)} · Hercom S/
              {pricingPreview.platformCommission.toFixed(2)}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || department === ""}
            className="rounded-2xl bg-violet-700 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-violet-800 disabled:opacity-60"
          >
            {submitting ? "Guardando..." : "Activar promoción"}
          </button>
          {message !== null && <p className="text-sm text-emerald-700">{message}</p>}
          {error !== null && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-lg">
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          Promociones registradas
        </h2>
        {filteredPromotions === undefined ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : filteredPromotions.length === 0 ? (
          <p className="text-sm text-slate-500">No hay promociones con estos filtros.</p>
        ) : (
          <div className="space-y-2">
            {filteredPromotions.map((promotion) => (
              <div
                key={promotion._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {promotion.name}
                    {promotion.festivityLabel !== undefined && (
                      <span className="ml-2 text-xs font-normal text-violet-700">
                        {promotion.festivityLabel}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-600">
                    {formatRegion(promotion)} · {(promotion.discountRate * 100).toFixed(0)}%
                    {" · "}
                    {formatDateInput(promotion.startsAt)} →{" "}
                    {formatDateInput(promotion.endsAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void setActive({
                        promotionId: promotion._id,
                        active: !promotion.active,
                      })
                    }
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      promotion.active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {promotion.active ? "Activa" : "Inactiva"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void removePromotion({ promotionId: promotion._id })}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
