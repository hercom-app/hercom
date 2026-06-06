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

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        Solicitar un chofer
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="originAddress"
          required
          placeholder="Dirección de origen"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="destinationAddress"
          required
          placeholder="Dirección de destino"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="totalPrice"
          type="number"
          min="1"
          step="0.01"
          required
          placeholder="Precio acordado"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          name="notes"
          placeholder="Notas (opcional)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
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
