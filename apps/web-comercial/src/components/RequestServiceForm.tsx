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
        totalPrice: Number(form.get("totalPrice")),
        notes: String(form.get("notes") ?? "") || undefined,
      });
      setMessage("Solicitud creada. Un administrador asignará un chofer.");
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
          name="totalPrice"
          type="number"
          min="1"
          step="0.01"
          required
          placeholder="Precio acordado"
          className={inputClass}
        />
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
