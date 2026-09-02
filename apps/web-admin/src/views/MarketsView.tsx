import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import {
  AdminCard,
  AdminEmpty,
  AdminLoading,
  AdminPage,
} from "../components/AdminLayout";
import { btnPrimaryClass, inputClass, labelClass } from "../lib/adminUi";

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

              <div className="grid gap-3 md:grid-cols-2">
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
                <Field
                  label="Tarifa horaria"
                  hint="Precio de una hora de servicio, en esta moneda."
                >
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
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label="Horas mínimas"
                  hint="El cliente no puede pedir un servicio más corto que esto."
                >
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
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="Comisión de Hercom (%)"
                  hint="Porcentaje del viaje que se queda la plataforma. 25 significa 25%."
                >
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
                    Usar estas tarifas en la app
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-zinc-500">
                    Marcado: clientes y choferes de este país ven estos precios.
                    Desmarcado: esta ficha se ignora y la app cobra como en Perú
                    (soles) hasta que lo vuelvas a activar.
                  </span>
                </span>
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

          {markets.length === 0 && (
            <AdminEmpty message="No hay países configurados en el catálogo." />
          )}
        </>
      )}
    </AdminPage>
  );
}
