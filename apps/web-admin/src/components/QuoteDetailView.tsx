import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
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

function formatWhen(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function formatServiceDate(value: string | undefined): string {
  if (value === undefined || value === "") return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match === null) return value.replace("T", " ");
  const parsed = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  const label = new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(parsed);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function place(
  department: string | undefined,
  province: string | undefined,
  district: string | undefined,
): string {
  const text = [district, province, department]
    .filter((part) => part !== undefined && part !== "")
    .join(", ");
  return text === "" ? "—" : text;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm text-zinc-900">{value}</dd>
    </div>
  );
}

export function QuoteDetailView({
  quoteId,
  notice,
  onBack,
}: {
  quoteId: Id<"corporateQuotes">;
  notice: string | null;
  onBack: () => void;
}) {
  const quote = useQuery(api.corporateQuotes.getForAdmin, { id: quoteId });
  const saveQuote = useMutation(api.corporateQuotes.saveQuote);
  const [amount, setAmount] = useState("");
  const [profiles, setProfiles] = useState<ProfileId[]>([]);
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

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
    setSaved(false);
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
      await saveQuote({
        id: quoteId,
        quoteAmount,
        driverProfiles: profiles,
        quoteDescription: description.trim(),
      });
      setSaved(true);
    } catch (cause) {
      setError(formatConvexError(cause, "No se pudo guardar la cotización."));
    } finally {
      setPending(false);
    }
  }

  return (
    <AdminPage>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className={btnSecondaryClass} onClick={onBack}>
          Volver a la lista
        </button>
      </div>

      {notice !== null && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {notice}
        </p>
      )}

      {quote === undefined ? (
        <AdminLoading message="Cargando requerimiento…" />
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
            <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Fact label="Recibido" value={formatWhen(quote.createdAt)} />
              <Fact label="Canal" value={quote.source === "manual" ? "Manual" : "Web"} />
              <Fact
                label="Confirmación"
                value={quote.emailSent ? "Correo enviado" : "Correo pendiente"}
              />
              <Fact label="Contacto" value={quote.contactName} />
              <Fact label="Empresa" value={quote.companyName === "" ? "—" : quote.companyName} />
              <Fact label="RUC" value={quote.ruc ?? "—"} />
              <Fact label="Correo" value={quote.email} />
              <Fact label="Teléfono" value={quote.phone} />
              <Fact
                label="Origen"
                value={place(quote.originDepartment, quote.originProvince, quote.originDistrict)}
              />
              <Fact label="Fecha de inicio" value={formatServiceDate(quote.serviceStart)} />
              <Fact
                label="Destino"
                value={place(
                  quote.destinationDepartment,
                  quote.destinationProvince,
                  quote.destinationDistrict,
                )}
              />
              <Fact label="Fecha de fin" value={formatServiceDate(quote.serviceEnd)} />
              <Fact
                label="Horas aproximadas"
                value={quote.serviceHours === undefined ? "—" : String(quote.serviceHours)}
              />
              <Fact
                label="Choferes"
                value={quote.driverCount === undefined ? "—" : String(quote.driverCount)}
              />
            </dl>
            <div className="mt-6">
              <p className="text-xs font-medium text-zinc-500">Detalle</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800">{quote.detail}</p>
            </div>
          </AdminCard>

          <AdminCard>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
              Oferta
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">
              Cotización
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              Costo, perfiles de chofer y el texto que acompaña la oferta.
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
              {saved && (
                <p className="text-sm text-emerald-700">Cotización guardada.</p>
              )}
              <button type="submit" disabled={pending} className={btnPrimaryClass}>
                {pending ? "Guardando…" : "Guardar cotización"}
              </button>
            </form>
          </AdminCard>
        </>
      )}
    </AdminPage>
  );
}
