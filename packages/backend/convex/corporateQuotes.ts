import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  query,
  type ActionCtx,
} from "./_generated/server";
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
  serviceStart: v.string(),
  serviceEnd: v.string(),
  driverCount: v.number(),
  detail: v.string(),
};

const insertArgs = {
  ...quoteArgs,
  serviceHours: v.number(),
  source: v.union(v.literal("web"), v.literal("manual")),
  createdByUserId: v.optional(v.id("users")),
};

type QuoteFields = {
  companyName: string;
  contactName: string;
  ruc: string;
  email: string;
  phone: string;
  originDepartment: string;
  originProvince: string;
  originDistrict: string;
  destinationDepartment: string;
  destinationProvince: string;
  destinationDistrict: string;
  serviceStart: string;
  serviceEnd: string;
  driverCount: number;
  detail: string;
};

function clean(value: string, max: number): string {
  return value.trim().slice(0, max);
}

function place(department: string, province: string, district: string): string {
  return [district, province, department].filter((part) => part !== "").join(", ");
}

function parseServiceMoment(value: string): number {
  const at = new Date(value.trim()).getTime();
  if (Number.isNaN(at)) {
    throw new Error("Indica hora de inicio y hora de fin válidas.");
  }
  return at;
}

function serviceHoursBetween(start: string, end: string): number {
  const startAt = parseServiceMoment(start);
  const endAt = parseServiceMoment(end);
  if (endAt <= startAt) {
    throw new Error("La hora de fin debe ser posterior a la hora de inicio.");
  }
  const hours = (endAt - startAt) / (60 * 60 * 1000);
  return Math.round(hours * 100) / 100;
}

function normalizeRuc(ruc: string): string {
  return ruc.replace(/\D/g, "");
}

function validateQuote(args: {
  contactName: string;
  email: string;
  ruc: string;
  originDepartment: string;
  originProvince: string;
  originDistrict: string;
  destinationDepartment: string;
  destinationProvince: string;
  destinationDistrict: string;
  serviceStart: string;
  serviceEnd: string;
  driverCount: number;
}): { email: string; ruc: string; serviceHours: number } {
  const email = args.email.trim().toLowerCase();
  const ruc = normalizeRuc(args.ruc);
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
  if (args.serviceStart.trim() === "" || args.serviceEnd.trim() === "") {
    throw new Error("Indica la hora de inicio y la hora de fin.");
  }
  if (!Number.isFinite(args.driverCount) || args.driverCount < 1) {
    throw new Error("Indica la cantidad de choferes.");
  }
  const serviceHours = serviceHoursBetween(args.serviceStart, args.serviceEnd);
  return { email, ruc, serviceHours };
}

export const assertStaffUser = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await requireStaff(ctx);
  },
});

export const insert = internalMutation({
  args: insertArgs,
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
      serviceStart: clean(args.serviceStart, 40),
      serviceEnd: clean(args.serviceEnd, 40),
      driverCount: Math.round(args.driverCount),
      serviceHours: args.serviceHours,
      detail: clean(args.detail, 2000),
      source: args.source,
      ...(args.createdByUserId !== undefined
        ? { createdByUserId: args.createdByUserId }
        : {}),
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
  serviceStart: string;
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
        `Inicio: ${args.serviceStart}`,
        `Fin: ${args.serviceEnd}`,
        `Horas: ${args.serviceHours}`,
        `Choferes: ${args.driverCount}`,
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

async function persistAndMaybeEmail(
  ctx: ActionCtx,
  args: QuoteFields & {
    ruc: string;
    serviceHours: number;
    source: "web" | "manual";
    createdByUserId?: Id<"users">;
    sendConfirmation: boolean;
  },
): Promise<{ id: Id<"corporateQuotes">; emailSent: boolean }> {
  const id: Id<"corporateQuotes"> = await ctx.runMutation(
    internal.corporateQuotes.insert,
    {
      companyName: args.companyName,
      contactName: args.contactName,
      ruc: args.ruc,
      email: args.email,
      phone: args.phone,
      originDepartment: args.originDepartment,
      originProvince: args.originProvince,
      originDistrict: args.originDistrict,
      destinationDepartment: args.destinationDepartment,
      destinationProvince: args.destinationProvince,
      destinationDistrict: args.destinationDistrict,
      serviceStart: args.serviceStart,
      serviceEnd: args.serviceEnd,
      driverCount: args.driverCount,
      detail: args.detail,
      serviceHours: args.serviceHours,
      source: args.source,
      ...(args.createdByUserId !== undefined
        ? { createdByUserId: args.createdByUserId }
        : {}),
    },
  );
  let sent = false;
  if (args.sendConfirmation) {
    sent = await sendConfirmation({
      contactName: args.contactName.trim(),
      email: args.email,
      companyName: args.companyName.trim(),
      origin: place(args.originDepartment, args.originProvince, args.originDistrict),
      destination: place(
        args.destinationDepartment,
        args.destinationProvince,
        args.destinationDistrict,
      ),
      serviceStart: args.serviceStart.trim(),
      serviceEnd: args.serviceEnd.trim(),
      driverCount: args.driverCount,
      serviceHours: args.serviceHours,
    });
    await ctx.runMutation(internal.corporateQuotes.markEmail, { id, sent });
  }
  return { id, emailSent: sent };
}

/** La web comercial guarda la cotización y envía la confirmación al correo del cliente. */
export const submit = action({
  args: quoteArgs,
  handler: async (ctx, args): Promise<{ id: Id<"corporateQuotes">; emailSent: boolean }> => {
    const { email, ruc, serviceHours } = validateQuote(args);
    return await persistAndMaybeEmail(ctx, {
      ...args,
      email,
      ruc,
      serviceHours,
      source: "web",
      sendConfirmation: true,
    });
  },
});

/** El panel interno registra una cotización tomada por teléfono u otro medio. */
export const createFromAdmin = action({
  args: {
    ...quoteArgs,
    sendConfirmation: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ id: Id<"corporateQuotes">; emailSent: boolean }> => {
    const staff = await ctx.runQuery(internal.corporateQuotes.assertStaffUser, {});
    const { email, ruc, serviceHours } = validateQuote(args);
    const sendConfirmation = args.sendConfirmation !== false;
    const quoteFields = {
      companyName: args.companyName,
      contactName: args.contactName,
      ruc: args.ruc,
      email: args.email,
      phone: args.phone,
      originDepartment: args.originDepartment,
      originProvince: args.originProvince,
      originDistrict: args.originDistrict,
      destinationDepartment: args.destinationDepartment,
      destinationProvince: args.destinationProvince,
      destinationDistrict: args.destinationDistrict,
      serviceStart: args.serviceStart,
      serviceEnd: args.serviceEnd,
      driverCount: args.driverCount,
      detail: args.detail,
    };
    return await persistAndMaybeEmail(ctx, {
      ...quoteFields,
      email,
      ruc,
      serviceHours,
      source: "manual",
      createdByUserId: staff._id,
      sendConfirmation,
    });
  },
});