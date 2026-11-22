import { ConvexError, v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
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
  serviceHours: v.number(),
  driverCount: v.number(),
  detail: v.string(),
};

const driverProfile = v.union(
  v.literal("premium"),
  v.literal("corporativo"),
  v.literal("seguro"),
  v.literal("flota"),
);

const insertArgs = {
  ...quoteArgs,
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
  serviceHours: number;
  driverCount: number;
  detail: string;
};

function clean(value: string, max: number): string {
  return value.trim().slice(0, max);
}

function place(department: string, province: string, district: string): string {
  return [district, province, department].filter((part) => part !== "").join(", ");
}

function parseServiceDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (match === null) {
    throw new ConvexError("Indica la fecha de inicio y la fecha de fin.");
  }
  const iso = `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new ConvexError("Indica la fecha de inicio y la fecha de fin.");
  }
  return iso;
}

function normalizeRuc(ruc: string): string {
  return ruc.replace(/\D/g, "");
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
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
  serviceHours: number;
  driverCount: number;
  phone: string;
}): { email: string; ruc: string; phone: string; serviceHours: number; serviceStart: string; serviceEnd: string } {
  const email = args.email.trim().toLowerCase();
  const ruc = normalizeRuc(args.ruc);
  const phone = normalizePhone(args.phone);
  if (!email.includes("@") || args.contactName.trim() === "") {
    throw new ConvexError("Completa el nombre y un correo válido.");
  }
  if (ruc.length !== 11) {
    throw new ConvexError("El RUC debe tener 11 dígitos.");
  }
  if (phone.length !== 9) {
    throw new ConvexError("El teléfono debe tener 9 dígitos.");
  }
  if (
    args.originDepartment.trim() === "" ||
    args.originProvince.trim() === "" ||
    args.originDistrict.trim() === "" ||
    args.destinationDepartment.trim() === "" ||
    args.destinationProvince.trim() === "" ||
    args.destinationDistrict.trim() === ""
  ) {
    throw new ConvexError("Elige el origen y el destino del servicio.");
  }
  const serviceStart = parseServiceDate(args.serviceStart);
  const serviceEnd = parseServiceDate(args.serviceEnd);
  if (serviceEnd < serviceStart) {
    throw new ConvexError("La fecha de fin no puede ser anterior a la fecha de inicio.");
  }
  if (!Number.isFinite(args.driverCount) || args.driverCount < 1) {
    throw new ConvexError("Indica la cantidad de choferes.");
  }
  if (!Number.isFinite(args.serviceHours) || args.serviceHours < 1 || args.serviceHours > 720) {
    throw new ConvexError("Indica las horas aproximadas del servicio.");
  }
  const serviceHours = Math.round(args.serviceHours * 100) / 100;
  return { email, ruc, phone, serviceHours, serviceStart, serviceEnd };
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
      phone: clean(args.phone, 9),
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

export const getForAdmin = query({
  args: { id: v.id("corporateQuotes") },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    return await ctx.db.get(args.id);
  },
});

export const saveQuote = mutation({
  args: {
    id: v.id("corporateQuotes"),
    quoteAmount: v.number(),
    driverProfiles: v.array(driverProfile),
    quoteDescription: v.string(),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const existing = await ctx.db.get(args.id);
    if (existing === null) {
      throw new ConvexError("No encontramos el requerimiento.");
    }
    if (!Number.isFinite(args.quoteAmount) || args.quoteAmount < 0) {
      throw new ConvexError("Indica el costo de la cotización.");
    }
    if (args.driverProfiles.length === 0) {
      throw new ConvexError("Elige al menos un perfil de chofer.");
    }
    if (args.quoteDescription.trim() === "") {
      throw new ConvexError("Escribe la descripción de la cotización.");
    }
    const uniqueProfiles = [...new Set(args.driverProfiles)];
    await ctx.db.patch(args.id, {
      quoteAmount: Math.round(args.quoteAmount * 100) / 100,
      driverProfiles: uniqueProfiles,
      quoteDescription: args.quoteDescription.trim().slice(0, 2000),
      quotedAt: Date.now(),
    });
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
    sent = await ctx.runAction(internal.quoteMail.sendQuoteConfirmation, {
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
    const validated = validateQuote(args);
    return await persistAndMaybeEmail(ctx, {
      ...args,
      ...validated,
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
    const validated = validateQuote(args);
    const sendConfirmation = args.sendConfirmation !== false;
    return await persistAndMaybeEmail(ctx, {
      companyName: args.companyName,
      contactName: args.contactName,
      originDepartment: args.originDepartment,
      originProvince: args.originProvince,
      originDistrict: args.originDistrict,
      destinationDepartment: args.destinationDepartment,
      destinationProvince: args.destinationProvince,
      destinationDistrict: args.destinationDistrict,
      driverCount: args.driverCount,
      detail: args.detail,
      ...validated,
      source: "manual",
      createdByUserId: staff._id,
      sendConfirmation,
    });
  },
});