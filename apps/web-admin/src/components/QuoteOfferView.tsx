import { useEffect, useState } from "react";
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
import {
  QUOTE_STATUS_BADGE,
  QUOTE_STATUS_LABEL,
  hasBeenSent,
  quoteStatusOf,
} from "../lib/quoteStatus";
import { QuotePdfPreview } from "./QuotePdfPreview";
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
  if (amount.trim() === "" || !Number.isFinite(quoteAmount) || quoteAmount < 0) {
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

function formatWhen(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
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
  const previewQuotePdf = useAction(api.quoteMail.previewQuotePdf);
  const [amount, setAmount] = useState("");
  const [profiles, setProfiles] = useState<ProfileId[]>([]);
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState<"save" | "send" | "preview" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ tone: "ok" | "warn"; text: string } | null>(
    null,
  );
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState<{ base64: string; filename: string } | null>(
    null,
  );

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

  function readForm(): { quoteAmount: number } | null {
    setError("");
    setNotice(null);
    const validated = validateForm(amount, profiles, description);
    if ("error" in validated) {
      setError(validated.error);
      return null;
    }
    return validated;
  }

  async function onPreview() {
    const validated = readForm();
    if (validated === null) return;
    setPending("preview");
    try {
      setPreview(
        await previewQuotePdf({
          id: quoteId,
          quoteAmount: validated.quoteAmount,
          driverProfiles: profiles,
          quoteDescription: description.trim(),
        }),
      );
    } catch (cause) {
      setError(formatConvexError(cause, "No pudimos generar el PDF."));
    } finally {
      setPending(null);
    }
  }

  async function onSave() {
    const validated = readForm();
    if (validated === null) return;
    setPending("save");
    try {
      await saveQuote({
        id: quoteId,
        quoteAmount: validated.quoteAmount,
        driverProfiles: profiles,
        quoteDescription: description.trim(),
      });
      setNotice({
        tone: "ok",
        text:
          quote !== undefined && quote !== null && hasBeenSent(quote)
            ? "Cambios guardados. Reenvía la cotización para que el cliente reciba la versión nueva."
            : "Cotización guardada como borrador.",
      });
    } catch (cause) {
      setError(formatConvexError(cause, "No pudimos guardar la cotización."));
    } finally {
      setPending(null);
    }
  }

  async function onSend() {
    const validated = readForm();
    if (validated === null) return;
    setPending("send");
    try {
      const result = await deliverQuote({
        id: quoteId,
        quoteAmount: validated.quoteAmount,
        driverProfiles: profiles,
        quoteDescription: description.trim(),
      });
      if (result.quoteOfferEmailSent) {
        setEditing(false);
        setNotice({
          tone: "ok",
          text: result.resend
            ? "Cotización actualizada y reenviada al cliente con el PDF."
            : "Cotización enviada al cliente con el PDF adjunto.",
        });
      } else {
        setNotice({
          tone: "warn",
          text: "Cotización guardada, pero el correo no pudo enviarse. Revisa la configuración SMTP.",
        });
      }
    } catch (cause) {
      setError(formatConvexError(cause, "No pudimos enviar la cotización."));
    } finally {
      setPending(null);
    }
  }

  const status = quote === undefined || quote === null ? null : quoteStatusOf(quote);
  const alreadySent = quote !== undefined && quote !== null && hasBeenSent(quote);
  const locked = (status === "sent" || status === "resent") && !editing;
  const sends = quote?.quoteSends ?? [];

  return (
    <AdminPage>
      <div className="mb-4">
        <button type="button" className={btnSecondaryClass} onClick={onBack}>
          Volver a la lista
        </button>
      </div>

      {quote === undefined ? (
        <AdminLoading message="Cargando cotización…" />
      ) : quote === null || status === null ? (
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                  Oferta
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">
                  Cotización
                </h3>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${QUOTE_STATUS_BADGE[status]}`}
              >
                {QUOTE_STATUS_LABEL[status]}
              </span>
            </div>

            {locked && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-sm text-zinc-700">
                  Esta cotización ya se envió. Si el cliente pide un descuento o un
                  cambio, edítala y reenvíala.
                </p>
                <button
                  type="button"
                  className={btnSecondaryClass}
                  onClick={() => {
                    setEditing(true);
                    setNotice(null);
                  }}
                >
                  Editar cotización
                </button>
              </div>
            )}
            {status === "revising" && (
              <p className="mt-5 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                Hay cambios guardados que el cliente todavía no recibió. Reenvía la
                cotización cuando esté lista.
              </p>
            )}

            <form className="mt-6 space-y-5" onSubmit={(event) => event.preventDefault()}>
              <fieldset disabled={locked} className="space-y-5 disabled:opacity-70">
                <label className="block max-w-xs">
                  <span className={labelClass}>Costo (S/, sin IGV) *</span>
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
              </fieldset>
              <p className="text-xs text-zinc-500">
                El PDF incluye al pie las condiciones de pago y la nota importante.
              </p>
              {error !== "" && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              {notice !== null && (
                <p
                  className={
                    notice.tone === "ok" ? "text-sm text-emerald-700" : "text-sm text-amber-800"
                  }
                >
                  {notice.text}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={pending !== null}
                  className={btnSecondaryClass}
                  onClick={() => void onPreview()}
                >
                  {pending === "preview" ? "Generando PDF…" : "Previsualizar PDF"}
                </button>
                <button
                  type="button"
                  disabled={pending !== null || locked}
                  className={btnSecondaryClass}
                  onClick={() => void onSave()}
                >
                  {pending === "save" ? "Guardando…" : "Guardar"}
                </button>
                <button
                  type="button"
                  disabled={pending !== null || locked}
                  className={btnPrimaryClass}
                  onClick={() => void onSend()}
                >
                  {pending === "send"
                    ? "Enviando…"
                    : alreadySent
                      ? "Reenviar al cliente"
                      : "Enviar al cliente"}
                </button>
                {editing && (
                  <button
                    type="button"
                    disabled={pending !== null}
                    className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
                    onClick={() => {
                      setEditing(false);
                      setAmount(quote.quoteAmount === undefined ? "" : String(quote.quoteAmount));
                      setProfiles((quote.driverProfiles ?? []) as ProfileId[]);
                      setDescription(quote.quoteDescription ?? "");
                      setError("");
                    }}
                  >
                    Cancelar edición
                  </button>
                )}
              </div>
            </form>
          </AdminCard>

          {sends.length > 0 && (
            <AdminCard className="mt-6">
              <h3 className="text-sm font-semibold text-zinc-900">Historial de envíos</h3>
              <ol className="mt-4 space-y-3">
                {[...sends].reverse().map((send) => (
                  <li
                    key={send.sentAt}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 text-sm last:border-0 last:pb-0"
                  >
                    <span className="text-zinc-700">
                      {send.ok ? (send.resend ? "Reenviada" : "Enviada") : "Falló el envío"}
                      <span className="text-zinc-400"> · {formatWhen(send.sentAt)}</span>
                    </span>
                    <span className="font-medium text-zinc-900">
                      S/ {send.quoteAmount.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ol>
            </AdminCard>
          )}
        </>
      )}

      {preview !== null && (
        <QuotePdfPreview
          base64={preview.base64}
          filename={preview.filename}
          onClose={() => setPreview(null)}
        />
      )}
    </AdminPage>
  );
}