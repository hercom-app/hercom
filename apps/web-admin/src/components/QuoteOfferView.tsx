import { FormEvent, useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import { AdminCard, AdminEmpty, AdminLoading, AdminPage } from "./AdminLayout";
import {
  btnPrimaryClass,
  btnSecondaryClass,
  inputClass,
  labelClass,
} from "../lib/adminUi";
import { formatConvexError } from "../lib/convexError";

const PROFILES = [
  { id: "premium", label: "Chofer Premium" },
  { id: "corporativo", label: "Chofer Corporativo" },
  { id: "seguro", label: "Chofer Seguro" },
  { id: "flota", label: "Chofer de Flota" },
] as const;

type ProfileId = (typeof PROFILES)[number]["id"];

export function QuoteOfferView({
  quoteId,
  onBack,
}: {
  quoteId: Id<"corporateQuotes">;
  onBack: () => void;
}) {
  const quote = useQuery(api.corporateQuotes.getForAdmin, { id: quoteId });
  const deliverQuote = useAction(api.corporateQuotes.deliverQuote);
  const [amount, setAmount] = useState("");
  const [profiles, setProfiles] = useState<ProfileId[]>([]);
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"sent" | "failed" | null>(null);

  useEffect(() => {
    if (quote === undefined || quote === null) return;
    setAmount(quote.quoteAmount === undefined ? "" : String(quote.quoteAmount));
    setProfiles((quote.driverProfiles ?? []) as ProfileId[]);
    setDescription(quote.quoteDescription ?? "");
  }, [quote]);

  function toggleProfile(id: ProfileId) {
    setProfiles((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setDone(null);
    const quoteAmount = Number(amount);
    if (!Number.isFinite(quoteAmount) || quoteAmount < 0) {
      setError("Indica el costo de la cotización.");
      return;
    }
    if (profiles.length === 0) {
      setError("Elige al menos un perfil de chofer.");
      return;
    }
    if (description.trim() === "") {
      setError("Escribe la descripción de la cotización.");
      return;
    }
    setPending(true);
    try {
      const result = await deliverQuote({
        id: quoteId,
        quoteAmount,
        driverProfiles: profiles,
        quoteDescription: description.trim(),
      });
      setDone(result.quoteOfferEmailSent ? "sent" : "failed");
    } catch (cause) {
      setError(formatConvexError(cause, "No pudimos enviar la cotización."));
    } finally {
      setPending(false);
    }
  }

  return (
    <AdminPage>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className={btnSecondaryClass} onClick={onBack}>
          Volver al requerimiento
        </button>
      </div>

      {quote === undefined ? (
        <AdminLoading message="Cargando cotización…" />
      ) : quote === null ? (
        <AdminEmpty message="No encontramos este requerimiento." />
      ) : (
        <AdminCard>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
            Oferta
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">
            Cotización
          </h3>
          <p className="mt-2 text-sm text-zinc-500">
            Para {quote.contactName}
            {quote.companyName !== "" ? ` · ${quote.companyName}` : ""} (
            {quote.email}).
          </p>
          <form className="mt-6 space-y-5" onSubmit={onSubmit}>
            <label className="block max-w-xs">
              <span className={labelClass}>Costo (S/) *</span>
              <input
                required
                className={inputClass}
                inputMode="decimal"
                min={0}
                step="0.01"
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            <fieldset>
              <legend className={labelClass}>Perfiles de chofer *</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {PROFILES.map((profile) => (
                  <label
                    key={profile.id}
                    className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-zinc-300"
                      checked={profiles.includes(profile.id)}
                      onChange={() => toggleProfile(profile.id)}
                    />
                    {profile.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className={labelClass}>Descripción *</span>
              <textarea
                required
                className={`${inputClass} min-h-28 resize-y`}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            {error !== "" && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            {done === "sent" && (
              <p className="text-sm text-emerald-700">
                Cotización guardada y enviada al correo del cliente.
              </p>
            )}
            {done === "failed" && (
              <p className="text-sm text-amber-800">
                Cotización guardada, pero el correo no pudo enviarse. Revisa la
                configuración SMTP.
              </p>
            )}
            <button type="submit" disabled={pending} className={btnPrimaryClass}>
              {pending ? "Enviando…" : "Enviar cotización"}
            </button>
          </form>
        </AdminCard>
      )}
    </AdminPage>
  );
}