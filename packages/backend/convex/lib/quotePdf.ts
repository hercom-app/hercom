import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  type RGB,
} from "pdf-lib";

import type { Doc } from "../_generated/dataModel";

export const QUOTE_VALID_DAYS = 7;

export const PROFILE_LABELS: Record<
  "premium" | "corporativo" | "seguro" | "flota",
  string
> = {
  premium: "Chofer Premium",
  corporativo: "Chofer Corporativo",
  seguro: "Chofer Seguro",
  flota: "Chofer de Flota",
};

const PAYMENT_TERMS = [
  "La cotización es válida solo por 7 días calendarios, sujeto a cambios o modificaciones por condiciones ajenas a la empresa.",
  "Forma de pago: Abonar a la Cta BCP 19420831965087; solicitar Boleta o Factura en su correo para que se lo hagan llegar por el mismo medio.",
  "Los montos no incluyen IGV.",
];

const IMPORTANT_NOTES = [
  "Los pasajes, estadía, seguros u otros gastos que incurran de los choferes por viajes de trabajo son asumidas por el cliente.",
  "La solicitud de agenda de choferes son mínimo con 03 días de anticipación; de lo contrario tendrá costos modificados a los costos promedios comerciales.",
  "Domingos y feriados están sujeto a evaluación la programación de los choferes.",
  "Cambio de agenda se realizará mínimo con 24 horas de anticipación, de lo contrario pierde su servicio programado sin devolución económica, ni derecho a reclamos.",
];

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const RIGHT = PAGE_W - MARGIN;
const CONTENT_W = RIGHT - MARGIN;
const FOOTER_SPACE = 44;

const INK = rgb(0.07, 0.07, 0.07);
const MUTED = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.88, 0.89, 0.91);
const BRAND = rgb(0.09, 0.42, 0.95);

export type QuotePdfInput = {
  quoteNumber: string;
  issuedAt: number;
  issuerEmail: string;
  companyName: string;
  contactName: string;
  ruc: string;
  email: string;
  phone: string;
  origin: string;
  destination: string;
  serviceStart: string;
  serviceEnd: string;
  serviceHours: number | undefined;
  driverCount: number | undefined;
  quoteAmount: number;
  profileLabels: string[];
  quoteDescription: string;
};

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

function limaDateParts(timestamp: number): { y: string; m: string; d: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { y: get("year"), m: get("month"), d: get("day") };
}

export function quoteNumberOf(quote: Doc<"corporateQuotes">): string {
  const { y, m, d } = limaDateParts(quote.createdAt);
  return `COT-${y}${m}${d}-${quote._id.slice(-5).toUpperCase()}`;
}

export function quotePdfInput(
  quote: Doc<"corporateQuotes">,
  offer: { quoteAmount: number; profileLabels: string[]; quoteDescription: string },
  issuerEmail: string,
): QuotePdfInput {
  return {
    quoteNumber: quoteNumberOf(quote),
    issuedAt: Date.now(),
    issuerEmail,
    companyName: quote.companyName,
    contactName: quote.contactName,
    ruc: quote.ruc ?? "",
    email: quote.email,
    phone: quote.phone,
    origin: place(quote.originDepartment, quote.originProvince, quote.originDistrict),
    destination: place(
      quote.destinationDepartment,
      quote.destinationProvince,
      quote.destinationDistrict,
    ),
    serviceStart: quote.serviceStart ?? "",
    serviceEnd: quote.serviceEnd ?? "",
    serviceHours: quote.serviceHours,
    driverCount: quote.driverCount,
    ...offer,
  };
}

function longDate(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(timestamp));
}

function serviceDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (match === null) return iso === "" ? "—" : iso;
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))));
}

function money(amount: number): string {
  return `S/ ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

const WIN_ANSI_EXTRA = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");

/** Las fuentes estándar del PDF solo codifican WinAnsi; lo demás rompería el render. */
function pdfSafe(value: string): string {
  let out = "";
  for (const char of value.replace(/\t/g, "  ")) {
    const code = char.codePointAt(0) ?? 0;
    if (char === "\n" || (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff)) {
      out += char;
    } else if (WIN_ANSI_EXTRA.has(char)) {
      out += char;
    } else if (char !== "\r") {
      out += "?";
    }
  }
  return out;
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of pdfSafe(text).split("\n")) {
    const words = paragraph.split(/\s+/).filter((word) => word !== "");
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const candidate = line === "" ? word : `${line} ${word}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line !== "") lines.push(line);
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > maxWidth && rest.length > 1) {
        let cut = rest.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > maxWidth) cut--;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      line = rest;
    }
    lines.push(line);
  }
  return lines;
}

type TextStyle = { font: PDFFont; size: number; color?: RGB };

class Layout {
  page: PDFPage;
  y: number;

  constructor(private readonly doc: PDFDocument) {
    this.page = doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
  }

  ensure(height: number) {
    if (this.y - height >= MARGIN + FOOTER_SPACE) return;
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
  }

  draw(value: string, x: number, baselineY: number, style: TextStyle) {
    this.page.drawText(pdfSafe(value), {
      x,
      y: baselineY,
      size: style.size,
      font: style.font,
      color: style.color ?? INK,
    });
  }

  drawRight(value: string, right: number, baselineY: number, style: TextStyle) {
    const width = style.font.widthOfTextAtSize(pdfSafe(value), style.size);
    this.draw(value, right - width, baselineY, style);
  }

  paragraph(
    value: string,
    style: TextStyle & { x?: number; width?: number; leading?: number },
  ) {
    const x = style.x ?? MARGIN;
    const width = style.width ?? CONTENT_W;
    const leading = style.leading ?? style.size * 1.45;
    for (const line of wrap(value, style.font, style.size, width)) {
      this.ensure(leading);
      this.draw(line, x, this.y - style.size, style);
      this.y -= leading;
    }
  }

  rule(color: RGB = LINE) {
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: RIGHT, y: this.y },
      thickness: 0.75,
      color,
    });
  }
}

export async function buildQuotePdf(
  input: QuotePdfInput,
  logoPng: Uint8Array | null,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Cotización ${input.quoteNumber}`);
  doc.setAuthor("HERCOM – Chofer para Remplazo");
  doc.setCreator("HERCOM");
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let logo: PDFImage | null = null;
  if (logoPng !== null) {
    try {
      logo = await doc.embedPng(logoPng);
    } catch {
      logo = null;
    }
  }

  const layout = new Layout(doc);
  const body: TextStyle = { font: regular, size: 9.5 };
  const muted: TextStyle = { font: regular, size: 9.5, color: MUTED };
  const strong: TextStyle = { font: bold, size: 9.5 };

  const top = layout.y;
  layout.draw("Cotización", MARGIN, top - 24, { font: bold, size: 24 });
  if (logo !== null) {
    const width = 62;
    const height = (logo.height / logo.width) * width;
    layout.page.drawImage(logo, { x: RIGHT - width, y: top - height, width, height });
  } else {
    layout.drawRight("HERCOM", RIGHT, top - 20, { font: bold, size: 18, color: BRAND });
  }
  layout.y = top - 52;

  const validUntil = input.issuedAt + QUOTE_VALID_DAYS * 24 * 60 * 60 * 1000;
  const meta: Array<[string, string]> = [
    ["N.° de cotización", input.quoteNumber],
    ["Fecha de emisión", longDate(input.issuedAt)],
    ["Válida hasta", longDate(validUntil)],
  ];
  for (const [label, value] of meta) {
    layout.draw(label, MARGIN, layout.y - 9.5, muted);
    layout.draw(value, MARGIN + 110, layout.y - 9.5, strong);
    layout.y -= 15;
  }
  layout.y -= 16;

  const columnTop = layout.y;
  const colW = CONTENT_W / 2 - 12;
  const issuer = [
    "Lima, Perú",
    "www.hercom.pe",
    ...(input.issuerEmail !== "" ? [input.issuerEmail] : []),
  ];
  layout.draw("HERCOM – Chofer para Remplazo", MARGIN, layout.y - 9.5, strong);
  layout.y -= 15;
  for (const line of issuer) {
    layout.draw(line, MARGIN, layout.y - 9.5, muted);
    layout.y -= 14;
  }
  const leftBottom = layout.y;

  const clientX = MARGIN + CONTENT_W / 2 + 12;
  layout.y = columnTop;
  layout.draw("Cotizado a", clientX, layout.y - 9.5, muted);
  layout.y -= 15;
  const clientLines: Array<[string, TextStyle]> = [
    [input.companyName !== "" ? input.companyName : input.contactName, strong],
    ...(input.companyName !== "" ? [[input.contactName, body] as [string, TextStyle]] : []),
    ...(input.ruc !== "" ? [[`RUC ${input.ruc}`, body] as [string, TextStyle]] : []),
    [input.email, body],
    [input.phone, body],
  ];
  for (const [line, style] of clientLines) {
    for (const wrapped of wrap(line, style.font, style.size, colW)) {
      layout.draw(wrapped, clientX, layout.y - 9.5, style);
      layout.y -= 14;
    }
  }
  layout.y = Math.min(leftBottom, layout.y) - 18;

  const headline = money(input.quoteAmount);
  layout.draw(headline, MARGIN, layout.y - 18, { font: bold, size: 18 });
  const headlineWidth = bold.widthOfTextAtSize(pdfSafe(headline), 18);
  layout.draw("· no incluye IGV", MARGIN + headlineWidth + 8, layout.y - 17, {
    font: regular,
    size: 11,
    color: MUTED,
  });
  layout.y -= 36;

  const qtyRight = MARGIN + 330;
  const unitRight = MARGIN + 420;
  const descWidth = 270;
  layout.draw("Descripción", MARGIN, layout.y - 9, { font: regular, size: 9, color: MUTED });
  layout.drawRight("Cant.", qtyRight, layout.y - 9, { font: regular, size: 9, color: MUTED });
  layout.drawRight("Precio unit.", unitRight, layout.y - 9, {
    font: regular,
    size: 9,
    color: MUTED,
  });
  layout.drawRight("Importe", RIGHT, layout.y - 9, { font: regular, size: 9, color: MUTED });
  layout.y -= 16;
  layout.rule(INK);
  layout.y -= 12;

  const rowTop = layout.y;
  layout.drawRight("1", qtyRight, rowTop - 10, body);
  layout.drawRight(money(input.quoteAmount), unitRight, rowTop - 10, body);
  layout.drawRight(money(input.quoteAmount), RIGHT, rowTop - 10, body);
  layout.paragraph("Servicio de chofer corporativo", {
    font: bold,
    size: 10,
    width: descWidth,
  });
  const hours =
    input.serviceHours === undefined
      ? null
      : `${Number.isInteger(input.serviceHours) ? input.serviceHours : input.serviceHours.toFixed(1)} horas aprox.`;
  const rowDetails = [
    input.profileLabels.length > 0 ? `Perfil: ${input.profileLabels.join(", ")}` : null,
    `Ruta: ${input.origin} – ${input.destination}`,
    `Del ${serviceDate(input.serviceStart)} al ${serviceDate(input.serviceEnd)}`,
    [
      input.driverCount === undefined
        ? null
        : `${input.driverCount} ${input.driverCount === 1 ? "chofer" : "choferes"}`,
      hours,
    ]
      .filter((part) => part !== null)
      .join(" · "),
  ].filter((line): line is string => line !== null && line !== "");
  for (const line of rowDetails) {
    layout.paragraph(line, { font: regular, size: 9, color: MUTED, width: descWidth });
  }
  layout.y -= 8;
  layout.rule();
  layout.y -= 14;

  const totalsLabelX = MARGIN + 300;
  const totals: Array<[string, string, boolean]> = [
    ["Subtotal", money(input.quoteAmount), false],
    ["IGV", "No incluido", false],
    ["Total", money(input.quoteAmount), true],
  ];
  for (const [label, value, isTotal] of totals) {
    layout.ensure(16);
    const style = isTotal ? { font: bold, size: 10.5 } : body;
    layout.draw(label, totalsLabelX, layout.y - 10, style);
    layout.drawRight(value, RIGHT, layout.y - 10, style);
    layout.y -= 16;
  }
  layout.y -= 12;

  if (input.quoteDescription.trim() !== "") {
    layout.ensure(40);
    layout.draw("Detalle de la cotización", MARGIN, layout.y - 10.5, { font: bold, size: 10.5 });
    layout.y -= 19;
    layout.paragraph(input.quoteDescription.trim(), { font: regular, size: 9.5 });
    layout.y -= 12;
  }

  const section = (title: string, items: string[]) => {
    const wrapped = items.map((item) => wrap(item, regular, 8.5, CONTENT_W - 14));
    const height =
      30 + wrapped.reduce((total, lines) => total + lines.length * 12 + 3, 0);
    layout.ensure(height);
    layout.rule();
    layout.y -= 12;
    layout.draw(title, MARGIN, layout.y - 9, { font: bold, size: 9, color: BRAND });
    layout.y -= 18;
    for (const lines of wrapped) {
      layout.draw("•", MARGIN + 2, layout.y - 8.5, { font: bold, size: 8.5, color: MUTED });
      for (const line of lines) {
        layout.ensure(12);
        layout.draw(line, MARGIN + 14, layout.y - 8.5, {
          font: regular,
          size: 8.5,
          color: MUTED,
        });
        layout.y -= 12;
      }
      layout.y -= 3;
    }
    layout.y -= 6;
  };
  section("CONDICIONES DE PAGO", PAYMENT_TERMS);
  section("NOTA IMPORTANTE", IMPORTANT_NOTES);

  const pages = doc.getPages();
  pages.forEach((page, index) => {
    page.drawLine({
      start: { x: MARGIN, y: MARGIN + 18 },
      end: { x: RIGHT, y: MARGIN + 18 },
      thickness: 0.5,
      color: LINE,
    });
    const footer = `${input.quoteNumber} · HERCOM – Chofer para Remplazo · www.hercom.pe`;
    page.drawText(pdfSafe(footer), { x: MARGIN, y: MARGIN, size: 8, font: regular, color: MUTED });
    const label = `Página ${index + 1} de ${pages.length}`;
    page.drawText(pdfSafe(label), {
      x: RIGHT - regular.widthOfTextAtSize(pdfSafe(label), 8),
      y: MARGIN,
      size: 8,
      font: regular,
      color: MUTED,
    });
  });

  return await doc.save();
}