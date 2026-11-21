import { v } from "convex/values";
import { action, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { requireStaff } from "./lib/auth";

const quoteArgs = {
  companyName: v.string(),
  contactName: v.string(),
  email: v.string(),
  phone: v.string(),
  city: v.string(),
  detail: v.string(),
};

function clean(value: string, max: number): string {
  return value.trim().slice(0, max);
}

export const insert = internalMutation({
  args: quoteArgs,
  handler: async (ctx, args) => {
    return await ctx.db.insert("corporateQuotes", {
      companyName: clean(args.companyName, 120),
      contactName: clean(args.contactName, 120),
      email: clean(args.email, 160).toLowerCase(),
      phone: clean(args.phone, 40),
      city: clean(args.city, 80),
      detail: clean(args.detail, 2000),
      createdAt: Date.now(),
      emailSent: false,
    });
  },
});

export const markEmail = internalMutation({
  args: { id: v.id("corporateQuotes"), sent: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { emailSent: args.sent });
  },
});

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    return await ctx.db
      .query("corporateQuotes")
      .withIndex("by_createdAt")
      .order("desc")
      .take(200);
  },
});

async function sendConfirmation(args: {
  contactName: string;
  email: string;
  companyName: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (key === undefined || key.trim() === "") return false;
  const from =
    process.env.QUOTE_FROM_EMAIL ?? "HERCOM <noreply@hercom.pe>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.email],
      subject: "Recibimos tu solicitud de viaje corporativo",
      text: [
        `Hola ${args.contactName},`,
        "",
        `Recibimos la solicitud de viaje corporativo de ${args.companyName}.`,
        "Un ejecutivo de HERCOM la revisará y te escribirá para confirmar la cotización.",
        "",
        "HERCOM – Chofer para Remplazo",
        "www.hercom.pe",
      ].join("\n"),
    }),
  });
  return response.ok;
}

/** La web comercial guarda la cotización y envía la confirmación al correo del cliente. */
export const submit = action({
  args: quoteArgs,
  handler: async (
    ctx,
    args,
  ): Promise<{ id: Id<"corporateQuotes">; emailSent: boolean }> => {
    const email = args.email.trim().toLowerCase();
    if (!email.includes("@") || args.contactName.trim() === "") {
      throw new Error("Completa el nombre y un correo válido.");
    }
    const id: Id<"corporateQuotes"> = await ctx.runMutation(
      internal.corporateQuotes.insert,
      args,
    );
    const sent = await sendConfirmation({
      contactName: args.contactName.trim(),
      email,
      companyName: args.companyName.trim() || "tu empresa",
    });
    await ctx.runMutation(internal.corporateQuotes.markEmail, { id, sent });
    return { id, emailSent: sent };
  },
});
