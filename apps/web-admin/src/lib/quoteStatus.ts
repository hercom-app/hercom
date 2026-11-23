import type { Doc } from "@proyecto/backend/dataModel";

export type QuoteStatus = "pending" | "draft" | "sent" | "revising" | "resent";

export function quoteStatusOf(quote: Doc<"corporateQuotes">): QuoteStatus {
  if (quote.quoteStatus !== undefined) return quote.quoteStatus;
  if (quote.quoteOfferEmailSent === true) return "sent";
  if (quote.quoteAmount !== undefined) return "draft";
  return "pending";
}

export function hasBeenSent(quote: Doc<"corporateQuotes">): boolean {
  return (
    quote.quoteOfferEmailSent === true ||
    (quote.quoteSends ?? []).some((send) => send.ok)
  );
}

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  pending: "Pendiente",
  draft: "Borrador",
  sent: "Enviada",
  revising: "En revisión",
  resent: "Reenviada",
};

export const QUOTE_STATUS_BADGE: Record<QuoteStatus, string> = {
  pending: "bg-zinc-100 text-zinc-700",
  draft: "bg-amber-100 text-amber-900",
  sent: "bg-emerald-100 text-emerald-900",
  revising: "bg-orange-100 text-orange-900",
  resent: "bg-sky-100 text-sky-900",
};