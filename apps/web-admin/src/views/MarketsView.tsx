import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import {
  AdminCard,
  AdminEmpty,
  AdminLoading,
  AdminPage,
} from "../components/AdminLayout";
import { DistrictPricingRulesPanel } from "../components/DistrictPricingRulesPanel";
import { btnPrimaryClass, inputClass, labelClass } from "../lib/adminUi";

type MarketFormState = {
  currencyCode: string;
  currencySymbol: string;
  usdExchangeRate: string;
  maxDriverMarkupPercent: string;
  maxDriverOfferDistanceKm: string;
  active: boolean;
};

const EMPTY_FORM: MarketFormState = {
  currencyCode: "",
  currencySymbol: "",
  usdExchangeRate: "",
  maxDriverMarkupPercent: "50",
  maxDriverOfferDistanceKm: "10",
  active: true,
};

/** Valores fijos del producto (no se editan desde admin). */
const FIXED_HOURLY_RATE = 40;
const FIXED_MIN_SERVICE_HOURS = 2;
const FIXED_COMMISSION_RATE = 0.25;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
      {hint !== undefined && (
        <span className="mt-1 block text-xs leading-5 text-zinc-500">{hint}</span>
      )}
    </label>
  );
}

export function MarketsView() {
  const markets = useQuery(api.markets.listForAdmin, {});
  const upsertMarket = useMutation(api.markets.upsert);
  const [selectedCountry, setSelectedCountry] = useState("PE");
  const [form, setForm] = useState<MarketFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = markets?.find((item) => item.countryCode === selectedCountry);
  const pricing = selected?.pricing;

  useEffect(() => {
    if (pricing === null || pricing === undefined) {
      return;
    }
    setForm({
      currencyCode: pricing.currencyCode,
      currencySymbol: pricing.currencySymbol,
      usdExchangeRate: String(pricing.usdExchangeRate),
      maxDriverMarkupPercent: String(
        (pricing.maxDriverMarkupOverBase ?? 0.5) * 100,
      ),
      maxDriverOfferDistanceKm: String(
        pricing.maxDriverOfferDistanceKm ?? 10,
      ),
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
        hourlyRate: pricing?.hourlyRate ?? FIXED_HOURLY_RATE,
        minServiceHours: pricing?.minServiceHours ?? FIXED_MIN_SERVICE_HOURS,
        commissionRate: pricing?.commissionRate ?? FIXED_COMMISSION_RATE,
        commissionRateFromHour3: pricing?.commissionRateFromHour3 ?? 0.15,
        commissionRateFromHour8: pricing?.commissionRateFromHour8 ?? 0.1,
        commissionFromHour3: pricing?.commissionFromHour3 ?? 3,
        commissionFromHour8: pricing?.commissionFromHour8 ?? 8,
        maxDriverMarkupOverBase: Number(form.maxDriverMarkupPercent) / 100,
        maxDriverOfferDistanceKm: Number(form.maxDriverOfferDistanceKm),
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

  return (
    <AdminPage>
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

            <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-950">
              <p className="font-semibold">Modelo comercial fijo</p>
              <p className="mt-1">
                Cliente: tarifa mínima S/80 (2 h × S/40/h). Chofer: recarga viajes
                prepagados — S/30 (1 viaje), S/50 (2 viajes), S/100 (5 viajes).
                Cada viaje cerrado consume 1 crédito; la comisión Hercom es el costo
                del crédito usado. Las horas extra las paga el cliente directo al
                chofer; en la app solo se avisa la extensión.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label="Código de moneda"
                  hint="ISO de tres letras. Perú: PEN. México: MXN."
                >
                  <input
                    required
                    value={form.currencyCode}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        currencyCode: event.target.value.toUpperCase(),
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="Símbolo"
                  hint="Lo que ve el cliente junto al precio. Perú: S/."
                >
                  <input
                    required
                    value={form.currencySymbol}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        currencySymbol: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field
                label="Tipo de cambio"
                hint="Cuántos de esta moneda equivalen a 1 dólar. Perú suele estar cerca de 3.75."
              >
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
              </Field>

              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label="Recargo máx. chofer sobre tarifa base (%)"
                  hint="Anti-estafa: tope de oferta = base × (1 + este %). Default 50."
                >
                  <input
                    required
                    type="number"
                    min="0"
                    max="200"
                    step="1"
                    value={form.maxDriverMarkupPercent}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        maxDriverMarkupPercent: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="Radio máx. chofer ↔ origen (km)"
                  hint="Distancia máxima para ver y ofertar solicitudes. Default 10 km."
                >
                  <input
                    required
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    value={form.maxDriverOfferDistanceKm}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        maxDriverOfferDistanceKm: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <label className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={form.active}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      active: event.target.checked,
                    }))
                  }
                />
                <span>
                  <span className="block font-medium text-zinc-900">
                    Usar este mercado en la app
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-zinc-500">
                    Marcado: clientes y choferes de este país usan moneda y límites
                    operativos de esta ficha. Desmarcado: se ignora hasta reactivarlo.
                  </span>
                </span>
              </label>

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

          <DistrictPricingRulesPanel countryCode={selectedCountry} />

          {markets.length === 0 && (
            <AdminEmpty message="No hay países configurados en el catálogo." />
          )}
        </>
      )}
    </AdminPage>
  );
}
