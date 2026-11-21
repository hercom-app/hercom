import { v } from "convex/values";
import { action, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { requireStaff } from "./lib/auth";

const quoteArgs = {
  companyName: v.string(),
  contactName: v.string(),
  ruc: v.string(),
  email: v.string(),
  phone: v.string(),
  originDepartment: v.string(),
  originProvince: v.string(),
  originDistrict: v.string(),
  destinationDepartment: v.string(),
  destinationProvince: v.string(),
  destinationDistrict: v.string(),
  serviceEnd: v.string(),
  driverCount: v.number(),
  serviceHours: v.number(),
  detail: v.string(),
};

function clean(value: string, max: number): string {
  return value.trim().slice(0, max);
}

function place(department: string, province: string, district: string): string {
  return [district, province, department].filter((part) => part !== "").join(", ");
}

export const insert = internalMutation({
  args: quoteArgs,
  handler: async (ctx, args) => {
    return await ctx.db.insert("corporateQuotes", {
      companyName: clean(args.companyName, 120),
      contactName: clean(args.contactName, 120),
      ruc: clean(args.ruc, 11),
      email: clean(args.email, 160).toLowerCase(),
      phone: clean(args.phone, 40),
      originDepartment: clean(args.originDepartment, 80),
      originProvince: clean(args.originProvince, 80),
      originDistrict: clean(args.originDistrict, 80),
      destinationDepartment: clean(args.destinationDepartment, 80),
      destinationProvince: clean(args.destinationProvince, 80),
      destinationDistrict: clean(args.destinationDistrict, 80),
      serviceEnd: clean(args.serviceEnd, 40),
      driverCount: Math.round(args.driverCount),
      serviceHours: args.serviceHours,
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
  origin: string;
  destination: string;
  serviceEnd: string;
  driverCount: number;
  serviceHours: number;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (key === undefined || key.trim() === "") return false;
  const from =
    process.env.QUOTE_FROM_EMAIL ?? "HERCOM <noreply@hercom.pe>";
  const who =
    args.companyName === "" ? args.contactName : args.companyName;
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
        `Recibimos la solicitud de viaje de ${who}.`,
        `Origen: ${args.origin}`,
        `Destino: ${args.destination}`,
        `Fin del servicio: ${args.serviceEnd}`,
        `Choferes: ${args.driverCount}`,
        `Horas: ${args.serviceHours}`,
        "",
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
    const ruc = args.ruc.replace(/\D/g, "");
    if (!email.includes("@") || args.contactName.trim() === "") {
      throw new Error("Completa el nombre y un correo válido.");
    }
    if (ruc.length !== 11) {
      throw new Error("El RUC debe tener 11 dígitos.");
    }
    if (
      args.originDepartment.trim() === "" ||
      args.originProvince.trim() === "" ||
      args.originDistrict.trim() === "" ||
      args.destinationDepartment.trim() === "" ||
      args.destinationProvince.trim() === "" ||
      args.destinationDistrict.trim() === ""
    ) {
      throw new Error("Elige el origen y el destino del servicio.");
    }
    if (args.serviceEnd.trim() === "") {
      throw new Error("Indica el fin del servicio.");
    }
    if (!Number.isFinite(args.driverCount) || args.driverCount < 1) {
      throw new Error("Indica la cantidad de choferes.");
    }
    if (!Number.isFinite(args.serviceHours) || args.serviceHours <= 0) {
      throw new Error("Indica las horas del servicio.");
    }
    const id: Id<"corporateQuotes"> = await ctx.runMutation(
      internal.corporateQuotes.insert,
      { ...args, ruc },
    );
    const sent = await sendConfirmation({
      contactName: args.contactName.trim(),
      email,
      companyName: args.companyName.trim(),
      origin: place(args.originDepartment, args.originProvince, args.originDistrict),
      destination: place(
        args.destinationDepartment,
        args.destinationProvince,
        args.destinationDistrict,
      ),
      serviceEnd: args.serviceEnd.trim(),
      driverCount: args.driverCount,
      serviceHours: args.serviceHours,
    });
    await ctx.runMutation(internal.corporateQuotes.markEmail, { id, sent });
    return { id, emailSent: sent };
  },
});
