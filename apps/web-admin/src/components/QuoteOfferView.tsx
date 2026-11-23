import { FormEvent, useEffect, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
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
import { QuoteRequirementSummary } from "./QuoteRequirementSummary";

const PROFILES = [
  { id: "premium", label: "Chofer Premium" },
  { id: "corporativo", label: "Chofer Corporativo" },
  { id: "seguro", label: "Chofer Seguro" },
  { id: "flota", label: "Chofer de Flota" },
] as const;

type ProfileId = (typeof PROFILES)[number]["id"];

function validateForm(
  amount: string,
  profiles: ProfileId[],
  description: string,
): { quoteAmount: number } | { error: string } {
  const quoteAmount = Number(amount);
  if (!Number.isFinite(quoteAmount) || quoteAmount < 0) {
    return { error: "Indica el costo de la cotización." };
  }
  if (profiles.length === 0) {
    return { error: "Elige al menos un perfil de chofer." };
  }
  if (description.trim() === "") {
    return { error: "Escribe la descripción de la cotización." };
  }
  return { quoteAmount };
}

export function QuoteOfferView({
  quoteId,
  onBack,
}: {
  quoteId: Id<"corporateQuotes">;
  onBack: () => void;
}) {
  const quote = useQuery(api.corporateQuotes.getForAdmin, { id: quoteId });
  const saveQuote = useMutation(api.corporateQuotes.saveQuote);
  const deliverQuote = useAction(api.corporateQuotes.deliverQuote);
  const [amount, setAmount] = useState("");
  const [profiles, setProfiles] = useState<ProfileId[]>([]);
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState<"save" | "send" | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [sent, setSent] = useState<"sent" | "failed" | null>(null);

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

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setSent(null);
    const validated = validateForm(amount, profiles, description);
    if ("error" in validated) {
      setError(validated.error);
      return;
    }
    setPending("save");
    try {
      await saveQuote({
        id: quoteId,
        quoteAmount: validated.quoteAmount,
        driverProfiles: profiles,
        quoteDescription: description.trim(),
      });
      setSaved(true);
    } catch (cause) {
      setError(formatConvexError(cause, "No pudimos guardar la cotización."));
    } finally {
      setPending(null);
    }
  }

  async function onSend(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setSent(null);
    const validated = validateForm(amount, profiles, description);
    if ("error" in validated) {
      setError(validated.error);
      return;
    }
    setPending("send");
    try {
      const result = await deliverQuote({
        id: quoteId,
        quoteAmount: validated.quoteAmount,
        driverProfiles: profiles,
        quoteDescription: description.trim(),
      });
      setSent(result.quoteOfferEmailSent ? "sent" : "failed");
    } catch (cause) {
      setError(formatConvexError(cause, "No pudimos enviar la cotización."));
    } finally {
      setPending(null);
    }
  }

  return (
    <AdminPage>
      <div className="mb-4">
        <button type="button" className={btnSecondaryClass} onClick={onBack}>
          Volver a la lista
        </button>
      </div>

      {quote === undefined ? (
        <AdminLoading message="Cargando cotización…" />
      ) : quote === null ? (
        <AdminEmpty message="No encontramos este requerimiento." />
      ) : (
        <>
          <AdminCard>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
              Solicitud
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">
              Requerimiento
            </h3>
            <div className="mt-6">
              <QuoteRequirementSummary quote={quote} />
            </div>
          </AdminCard>

          <AdminCard className="mt-6">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
              Oferta
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">
              Cotización
            </h3>
            <form className="mt-6 space-y-5">
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
              {saved && (
                <p className="text-sm text-emerald-700">Cotización guardada.</p>
              )}
              {sent === "sent" && (
                <p className="text-sm text-emerald-700">
                  Cotización guardada y enviada al correo del cliente.
                </p>
              )}
              {sent === "failed" && (
                <p className="text-sm text-amber-800">
                  Cotización guardada, pero el correo no pudo enviarse. Revisa la
                  configuración SMTP.
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={pending !== null}
                  className={btnSecondaryClass}
                  onClick={(event) => void onSave(event)}
                >
                  {pending === "save" ? "Guardando…" : "Guardar"}
                </button>
                <button
                  type="button"
                  disabled={pending !== null}
                  className={btnPrimaryClass}
                  onClick={(event) => void onSend(event)}
                >
                  {pending === "send" ? "Enviando…" : "Enviar al cliente"}
                </button>
              </div>
            </form>
          </AdminCard>
        </>
      )}
    </AdminPage>
  );
}