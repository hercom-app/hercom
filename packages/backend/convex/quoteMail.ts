"use node";

import tls from "node:tls";

import { v } from "convex/values";

import { internalAction } from "./_generated/server";

const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 465;
const HERCOM_LOGO_URL = "https://www.hercom.pe/logo.png";
const HERCOM_LOGO_MUTED_URL = "https://www.hercom.pe/logo-inverted.png";
const HERCOM_SITE = "https://www.hercom.pe";
const SOCIAL_LINKS = [
  { label: "Facebook", url: "https://www.facebook.com/profile.php?id=61571135840620" },
  { label: "Instagram", url: "https://www.instagram.com/hercomperu/reels/" },
  { label: "TikTok", url: "https://www.tiktok.com/@hercomchoferes" },
] as const;

function centeredCta(label: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
    <tr>
      <td align="center" style="padding:0 0 48px;">
        <a href="${HERCOM_SITE}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;border-radius:999px;padding:12px 28px;font-size:14px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${label}</a>
      </td>
    </tr>
  </table>`;
}

function emailFooter(): string {
  const social = SOCIAL_LINKS.map(
    (item) =>
      `<a href="${item.url}" style="color:#6b7280;text-decoration:none;font-size:13px;font-weight:500;">${item.label}</a>`,
  ).join(
    `<span style="color:#d1d5db;padding:0 8px;">·</span>`,
  );
  return `<tr>
    <td style="padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;text-align:center;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="border-top:1px solid #e5e7eb;padding:48px 0 0;text-align:center;">
            <img src="${HERCOM_LOGO_MUTED_URL}" alt="" width="52" height="44" style="display:inline-block;border:0;outline:none;width:52px;height:auto;opacity:0.45;" />
            <p style="margin:20px 0 16px;font-size:14px;line-height:1.6;color:#6b7280;">Hercom es el mejor servicio de choferes en el Perú</p>
            <p style="margin:0 0 8px;line-height:1.6;">${social}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function appPassword(raw: string | undefined): string {
  return (raw ?? "").replace(/\s/g, "");
}

/** Cliente SMTP mínimo para Gmail (puerto 465). La clave es una contraseña de aplicación. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMailDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (match === null) return iso;
  const parsed = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  const label = new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function quoteEmailHtml(args: {
  contactName: string;
  who: string;
  origin: string;
  destination: string;
  serviceStart: string;
  serviceEnd: string;
  driverCount: number;
  serviceHours: number;
}): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:0 0 14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
      <div style="font-size:12px;line-height:1.4;color:#6b7280;">${label}</div>
      <div style="margin-top:2px;font-size:15px;line-height:1.4;color:#111111;">${escapeHtml(value)}</div>
    </td></tr>`;
  const hours = Number.isInteger(args.serviceHours)
    ? String(args.serviceHours)
    : args.serviceHours.toFixed(1);
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:56px 24px 40px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:480px;">
          <tr>
            <td style="padding:0 0 48px;">
              <a href="https://www.hercom.pe" style="text-decoration:none;">
                <img src="${HERCOM_LOGO_URL}" alt="HERCOM" width="64" height="54" style="display:block;border:0;outline:none;width:64px;height:auto;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              <p style="margin:0 0 10px;font-size:13px;line-height:1.4;color:#6b7280;">Solicitud recibida</p>
              <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;font-weight:600;letter-spacing:-0.03em;color:#111111;">Recibimos tu requerimiento</h1>
              <p style="margin:0 0 32px;font-size:16px;line-height:1.6;color:#374151;">Hola ${escapeHtml(args.contactName)}. Guardamos el viaje de ${escapeHtml(args.who)}. Un ejecutivo de HERCOM lo revisará y te escribirá con la cotización.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${row("Origen", args.origin)}
                ${row("Destino", args.destination)}
                ${row("Fecha de inicio", formatMailDate(args.serviceStart))}
                ${row("Fecha de fin", formatMailDate(args.serviceEnd))}
                ${row("Horas aproximadas", hours)}
                ${row("Choferes", String(args.driverCount))}
              </table>
              ${centeredCta("Visitar hercom")}
            </td>
          </tr>
          ${emailFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendGmail(args: {
  user: string;
  pass: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  if (/[\r\n]/.test(args.to) || /[\r\n]/.test(args.subject)) {
    throw new Error("Destinatario o asunto inválido.");
  }

  const socket = tls.connect({
    host: SMTP_HOST,
    port: SMTP_PORT,
    servername: SMTP_HOST,
  });
  socket.setEncoding("utf8");

  const queue: string[] = [];
  const waiters: Array<(line: string) => void> = [];
  let pending = "";

  const failed = new Promise<never>((_, reject) => {
    socket.once("error", reject);
  });

  socket.on("data", (chunk: string) => {
    pending += chunk;
    let breakAt = pending.indexOf("\n");
    while (breakAt !== -1) {
      const line = pending.slice(0, breakAt).replace(/\r$/, "");
      pending = pending.slice(breakAt + 1);
      const waiter = waiters.shift();
      if (waiter !== undefined) waiter(line);
      else queue.push(line);
      breakAt = pending.indexOf("\n");
    }
  });

  const nextLine = (): Promise<string> => {
    const queued = queue.shift();
    if (queued !== undefined) return Promise.resolve(queued);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("SMTP timeout")), 20_000);
      waiters.push((line) => {
        clearTimeout(timer);
        resolve(line);
      });
    });
  };

  const readReply = async (expected: number): Promise<void> => {
    let line = await Promise.race([nextLine(), failed]);
    while (line.length >= 4 && line[3] === "-") {
      line = await Promise.race([nextLine(), failed]);
    }
    const code = Number(line.slice(0, 3));
    if (code !== expected) {
      throw new Error(`SMTP ${line.slice(0, 180)}`);
    }
  };

  const write = (line: string) => {
    socket.write(`${line}\r\n`);
  };

  try {
    await readReply(220);
    write("EHLO hercom.pe");
    await readReply(250);
    write("AUTH LOGIN");
    await readReply(334);
    write(Buffer.from(args.user, "utf8").toString("base64"));
    await readReply(334);
    write(Buffer.from(args.pass, "utf8").toString("base64"));
    await readReply(235);
    write(`MAIL FROM:<${args.user}>`);
    await readReply(250);
    write(`RCPT TO:<${args.to}>`);
    await readReply(250);
    write("DATA");
    await readReply(354);
    const boundary = "hercom-quote-mail";
    const payload = [
      `From: ${args.from}`,
      `To: ${args.to}`,
      `Subject: ${args.subject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      args.text.replace(/^\./gm, ".."),
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "",
      args.html.replace(/^\./gm, ".."),
      `--${boundary}--`,
    ].join("\r\n");
    socket.write(`${payload}\r\n.\r\n`);
    await readReply(250);
    write("QUIT");
    await readReply(221);
  } finally {
    socket.end();
  }
}

function quoteOfferEmailHtml(args: {
  contactName: string;
  quoteAmount: number;
  profileLabels: string[];
  quoteDescription: string;
}): string {
  const profiles = args.profileLabels.map(escapeHtml).join(", ");
  const amount = args.quoteAmount.toFixed(2);
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:56px 24px 40px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:480px;">
          <tr>
            <td style="padding:0 0 48px;">
              <a href="${HERCOM_SITE}" style="text-decoration:none;">
                <img src="${HERCOM_LOGO_URL}" alt="HERCOM" width="64" height="54" style="display:block;border:0;outline:none;width:64px;height:auto;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              <p style="margin:0 0 10px;font-size:13px;line-height:1.4;color:#6b7280;">Cotización</p>
              <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;font-weight:600;letter-spacing:-0.03em;color:#111111;">Tu cotización HERCOM</h1>
              <p style="margin:0 0 32px;font-size:16px;line-height:1.6;color:#374151;">Hola ${escapeHtml(args.contactName)}. Compartimos la cotización para tu requerimiento de chofer corporativo.</p>
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Costo</p>
              <p style="margin:0 0 24px;font-size:32px;font-weight:600;letter-spacing:-0.02em;color:#111111;">S/ ${amount}</p>
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Perfiles de chofer</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#111111;">${profiles}</p>
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Detalle</p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">${escapeHtml(args.quoteDescription).replace(/\n/g, "<br>")}</p>
              ${centeredCta("Visitar hercom")}
            </td>
          </tr>
          ${emailFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const sendQuoteOffer = internalAction({
  args: {
    contactName: v.string(),
    email: v.string(),
    quoteAmount: v.number(),
    profileLabels: v.array(v.string()),
    quoteDescription: v.string(),
  },
  handler: async (_ctx, args): Promise<boolean> => {
    const user = process.env.GMAIL_SMTP_USER?.trim() ?? "";
    const pass = appPassword(process.env.GMAIL_SMTP_PASSWORD);
    if (user === "" || pass === "") {
      console.error(
        "corporateQuotes: falta GMAIL_SMTP_USER o GMAIL_SMTP_PASSWORD en Convex.",
      );
      return false;
    }
    const from = process.env.QUOTE_FROM_EMAIL?.trim() || `HERCOM <${user}>`;
    const amount = args.quoteAmount.toFixed(2);
    try {
      await sendGmail({
        user,
        pass,
        from,
        to: args.email,
        subject: `Cotización HERCOM — S/ ${amount}`,
        text: [
          `Hola ${args.contactName},`,
          "",
          "Tu cotización HERCOM:",
          `Costo: S/ ${amount}`,
          `Perfiles: ${args.profileLabels.join(", ")}`,
          "",
          args.quoteDescription,
          "",
          HERCOM_SITE,
        ].join("\n"),
        html: quoteOfferEmailHtml(args),
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error SMTP";
      console.error("corporateQuotes: Gmail rechazó la cotización", message);
      return false;
    }
  },
});

export const sendQuoteConfirmation = internalAction({
  args: {
    contactName: v.string(),
    email: v.string(),
    companyName: v.string(),
    origin: v.string(),
    destination: v.string(),
    serviceStart: v.string(),
    serviceEnd: v.string(),
    driverCount: v.number(),
    serviceHours: v.number(),
  },
  handler: async (_ctx, args): Promise<boolean> => {
    const user = process.env.GMAIL_SMTP_USER?.trim() ?? "";
    const pass = appPassword(process.env.GMAIL_SMTP_PASSWORD);
    if (user === "" || pass === "") {
      console.error(
        "corporateQuotes: falta GMAIL_SMTP_USER o GMAIL_SMTP_PASSWORD en Convex.",
      );
      return false;
    }
    const from = process.env.QUOTE_FROM_EMAIL?.trim() || `HERCOM <${user}>`;
    const who = args.companyName === "" ? args.contactName : args.companyName;
    const hours = Number.isInteger(args.serviceHours)
      ? String(args.serviceHours)
      : args.serviceHours.toFixed(1);
    try {
      await sendGmail({
        user,
        pass,
        from,
        to: args.email,
        subject: "Recibimos tu requerimiento",
        text: [
          `Hola ${args.contactName},`,
          "",
          `Recibimos el requerimiento de viaje de ${who}.`,
          `Origen: ${args.origin}`,
          `Destino: ${args.destination}`,
          `Fecha de inicio: ${formatMailDate(args.serviceStart)}`,
          `Fecha de fin: ${formatMailDate(args.serviceEnd)}`,
          `Horas aproximadas: ${hours}`,
          `Choferes: ${args.driverCount}`,
          "",
          "Un ejecutivo de HERCOM lo revisará y te escribirá con la cotización.",
          "",
          "HERCOM – Chofer para Remplazo",
          "www.hercom.pe",
        ].join("\n"),
        html: quoteEmailHtml({
          contactName: args.contactName,
          who,
          origin: args.origin,
          destination: args.destination,
          serviceStart: args.serviceStart,
          serviceEnd: args.serviceEnd,
          driverCount: args.driverCount,
          serviceHours: args.serviceHours,
        }),
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error SMTP";
      console.error("corporateQuotes: Gmail rechazó el correo", message);
      return false;
    }
  },
});
