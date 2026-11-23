import type { Doc } from "@proyecto/backend/dataModel";

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

export function QuoteRequirementSummary({ quote }: { quote: Doc<"corporateQuotes"> }) {
  return (
    <>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <Fact
          label="Cotización"
          value={
            quote.quoteAmount === undefined
              ? "Pendiente"
              : `S/ ${quote.quoteAmount.toFixed(2)}`
          }
        />
        <Fact
          label="Cotización enviada"
          value={
            quote.quoteOfferEmailSent === true
              ? "Sí"
              : quote.quoteOfferEmailSent === false
                ? "Falló el envío"
                : "Pendiente"
          }
        />
      </dl>
      <div className="mt-6">
        <p className="text-xs font-medium text-zinc-500">Detalle</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800">{quote.detail}</p>
      </div>
    </>
  );
}