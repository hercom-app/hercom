import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import {
  AdminCard,
  AdminEmpty,
  AdminLoading,
  AdminPage,
  AdminPageHeader,
} from "../components/AdminLayout";
import { inputClass } from "../components/RegionFields";
import { btnPrimaryClass } from "../lib/adminUi";

type MarketFormState = {
  currencyCode: string;
  currencySymbol: string;
  usdExchangeRate: string;
  hourlyRate: string;
  minServiceHours: string;
  commissionPercent: string;
  active: boolean;
};

const EMPTY_FORM: MarketFormState = {
  currencyCode: "",
  currencySymbol: "",
  usdExchangeRate: "",
  hourlyRate: "",
  minServiceHours: "",
  commissionPercent: "",
  active: true,
};

export function MarketsView() {
  const markets = useQuery(api.markets.listForAdmin, {});
  const upsertMarket = useMutation(api.markets.upsert);
  const [selectedCountry, setSelectedCountry] = useState("PE");
  const [form, setForm] = useState<MarketFormState>(EMPTY_FORM);
  const [converterAmount, setConverterAmount] = useState("100");
  const [converterDirection, setConverterDirection] = useState<
    "local_to_usd" | "usd_to_local"
  >("local_to_usd");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = markets?.find((item) => item.countryCode === selectedCountry);
  const pricing = selected?.pricing;

  const conversion = useQuery(
    api.markets.convert,
    converterAmount.trim() !== "" && Number.isFinite(Number(converterAmount))
      ? {
          countryCode: selectedCountry,
          amount: Number(converterAmount),
          direction: converterDirection,
        }
      : "skip",
  );

  useEffect(() => {
    if (pricing === null || pricing === undefined) {
      return;
    }
    setForm({
      currencyCode: pricing.currencyCode,
      currencySymbol: pricing.currencySymbol,
      usdExchangeRate: String(pricing.usdExchangeRate),
      hourlyRate: String(pricing.hourlyRate),
      minServiceHours: String(pricing.minServiceHours),
      commissionPercent: String(pricing.commissionRate * 100),
      active: pricing.active,
    });
  }, [selectedCountry, pricing]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      await upsertMarket({
        countryCode: selectedCountry,
        currencyCode: form.currencyCode.trim(),
        currencySymbol: form.currencySymbol.trim(),
        usdExchangeRate: Number(form.usdExchangeRate),
        hourlyRate: Number(form.hourlyRate),
        minServiceHours: Number(form.minServiceHours),
        commissionRate: Number(form.commissionPercent) / 100,
        active: form.active,
      });
      setMessage("Mercado guardado.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar el mercado.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const minPrice =
    pricing !== null && pricing !== undefined
      ? pricing.hourlyRate * pricing.minServiceHours
      : null;

  return (
    <AdminPage>
      <AdminPageHeader
        title="Moneda local y tipo de cambio"
        description="En Perú los precios salen en soles (S/). En otros países usa el símbolo y el tipo de cambio local a USD."
      />

      {markets === undefined ? (
        <AdminLoading message="Cargando mercados…" />
      ) : (
        <>
          <AdminCard>
            <div className="mb-4 flex flex-wrap gap-2">
              {markets.map((market) => (
                <button
                  key={market.countryCode}
                  type="button"
                  onClick={() => setSelectedCountry(market.countryCode)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    selectedCountry === market.countryCode
                      ? "bg-hercom text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {market.countryName}
                  {!market.configured && (
                    <span className="ml-2 text-xs opacity-80">sin guardar</span>
                  )}
                </button>
              ))}
            </div>

            {selected !== undefined && (
              <p className="mb-4 text-sm text-slate-600">
                División política:{" "}
                <span className="font-medium text-slate-800">
                  {selected.level1Label} → {selected.level2Label} →{" "}
                  {selected.level3Label}
                </span>
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  required
                  value={form.currencyCode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      currencyCode: event.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="Código moneda (PEN, MXN…)"
                  className={inputClass}
                />
                <input
                  required
                  value={form.currencySymbol}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      currencySymbol: event.target.value,
                    }))
                  }
                  placeholder="Símbolo (S/, $…)"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">
                    Tipo de cambio (moneda local por 1 USD)
                  </span>
                  <input
                    required
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={form.usdExchangeRate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        usdExchangeRate: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">
                    Tarifa horaria (moneda local)
                  </span>
                  <input
                    required
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.hourlyRate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        hourlyRate: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={form.minServiceHours}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      minServiceHours: event.target.value,
                    }))
                  }
                  placeholder="Horas mínimas de servicio"
                  className={inputClass}
                />
                <input
                  required
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={form.commissionPercent}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      commissionPercent: event.target.value,
                    }))
                  }
                  placeholder="Comisión Hercom %"
                  className={inputClass}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      active: event.target.checked,
                    }))
                  }
                />
                Mercado activo
              </label>

              {minPrice !== null && form.currencySymbol !== "" && (
                <p className="rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-900">
                  Tarifa mínima estimada: {form.currencySymbol}
                  {minPrice.toFixed(2)}
                  {form.usdExchangeRate !== "" &&
                    Number(form.usdExchangeRate) > 0 && (
                      <>
                        {" "}
                        · US$
                        {(minPrice / Number(form.usdExchangeRate)).toFixed(2)}
                      </>
                    )}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`${btnPrimaryClass} w-full sm:w-auto`}
              >
                {submitting ? "Guardando…" : "Guardar mercado"}
              </button>
              {message !== null && (
                <p className="text-sm text-emerald-700">{message}</p>
              )}
              {error !== null && <p className="text-sm text-red-600">{error}</p>}
            </form>
          </AdminCard>

          <AdminCard>
            <h2 className="mb-3 font-display text-lg font-bold text-slate-900">
              Conversor rápido
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                type="number"
                min="0"
                step="0.01"
                value={converterAmount}
                onChange={(event) => setConverterAmount(event.target.value)}
                className={inputClass}
              />
              <select
                value={converterDirection}
                onChange={(event) =>
                  setConverterDirection(
                    event.target.value as "local_to_usd" | "usd_to_local",
                  )
                }
                className={inputClass}
              >
                <option value="local_to_usd">Moneda local → USD</option>
                <option value="usd_to_local">USD → moneda local</option>
              </select>
              <div className="flex items-center rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
                {conversion === undefined ? (
                  "…"
                ) : (
                  <>
                    {conversion.formattedLocal} · {conversion.formattedUsd}
                  </>
                )}
              </div>
            </div>
          </AdminCard>

          {markets.length === 0 && (
            <AdminEmpty message="No hay países configurados en el catálogo." />
          )}
        </>
      )}
    </AdminPage>
  );
}
