import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "@proyecto/backend";

export function RequestServiceForm() {
  const createService = useMutation(api.services.createService);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      await createService({
        origin: {
          address: String(form.get("originAddress")),
          lat: Number(form.get("originLat") ?? 0),
          lng: Number(form.get("originLng") ?? 0),
        },
        destination: {
          address: String(form.get("destinationAddress")),
          lat: Number(form.get("destinationLat") ?? 0),
          lng: Number(form.get("destinationLng") ?? 0),
        },
        basePrice: Number(form.get("basePrice")),
        tipAmount: Number(form.get("tipAmount") ?? 0),
        ...(String(form.get("notes") ?? "").trim() !== ""
          ? { notes: String(form.get("notes") ?? "").trim() }
          : {}),
      });
      setMessage("Solicitud creada. Espera ofertas de choferes y elige una.");
      event.currentTarget.reset();
    } catch {
      setMessage("No se pudo crear la solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-hercom";

  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg">
      <h2 className="mb-4 text-lg font-bold text-slate-900">
        Solicitar un chofer
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="originAddress"
          required
          placeholder="Dirección de origen"
          className={inputClass}
        />
        <input
          name="destinationAddress"
          required
          placeholder="Dirección de destino"
          className={inputClass}
        />
        <input
          name="basePrice"
          type="number"
          min="40"
          step="0.01"
          required
          placeholder="Tarifa base solicitada (mínimo S/40)"
          className={inputClass}
        />
        <input
          name="tipAmount"
          type="number"
          min="0"
          step="0.01"
          defaultValue="0"
          placeholder="Propina (opcional)"
          className={inputClass}
        />
        <p className="text-xs text-slate-500">
          Tarifa base mínima: S/40. Los choferes ofertan su tarifa y eliges una.
        </p>
        <textarea
          name="notes"
          placeholder="Notas (opcional)"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-2xl bg-hercom px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-hercom-dark disabled:opacity-60"
        >
          {submitting ? "Enviando..." : "Solicitar servicio"}
        </button>
        {message !== null && (
          <p className="text-sm text-slate-600">{message}</p>
        )}
      </form>
    </section>
  );
}
