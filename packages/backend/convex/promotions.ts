import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  listDistrictsForProvince,
  listProvincesForDepartment,
  PERU_DEPARTMENTS,
} from "./data/peruLocations";
import {
  HOURLY_SERVICE_RATE_PEN,
  MAX_PROMOTION_DISCOUNT_RATE,
  MIN_SERVICE_HOURS,
  MIN_SERVICE_PRICE_PEN,
} from "./lib/constants";
import { computePromotionalPricing } from "./lib/pricing";
import { applyPromotionToListPrice, findActivePromotion } from "./lib/promotions";
import { requireRole, requireUser } from "./lib/auth";

function normalizeMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function parseDateStartMs(dateStr: string): number {
  const parsed = new Date(`${dateStr}T00:00:00.000-05:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Fecha de inicio inválida.");
  }
  return parsed.getTime();
}

function parseDateEndMs(dateStr: string): number {
  const parsed = new Date(`${dateStr}T23:59:59.999-05:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Fecha de fin inválida.");
  }
  return parsed.getTime();
}

export const listDepartments = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return [...PERU_DEPARTMENTS];
  },
});

export const listProvinces = query({
  args: { department: v.string() },
  handler: async (_ctx, args) => {
    await requireUser(_ctx);
    return listProvincesForDepartment(args.department);
  },
});

export const listDistricts = query({
  args: {
    department: v.string(),
    province: v.string(),
  },
  handler: async (_ctx, args) => {
    await requireUser(_ctx);
    return listDistrictsForProvince(args.department, args.province);
  },
});

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    return await ctx.db.query("promotions").order("desc").collect();
  },
});

export const previewPricing = query({
  args: {
    listPrice: v.number(),
    discountRate: v.number(),
  },
  handler: async (_ctx, args) => {
    await requireRole(_ctx, "admin");
    const rate = Math.min(Math.max(args.discountRate, 0), MAX_PROMOTION_DISCOUNT_RATE);
    const pricing = computePromotionalPricing(args.listPrice, rate);
    return {
      ...pricing,
      maxDiscountRate: MAX_PROMOTION_DISCOUNT_RATE,
      minListPrice: MIN_SERVICE_PRICE_PEN,
      hourlyRate: HOURLY_SERVICE_RATE_PEN,
      minHours: MIN_SERVICE_HOURS,
    };
  },
});

export const previewForRegion = query({
  args: {
    department: v.string(),
    province: v.optional(v.string()),
    district: v.optional(v.string()),
    listPrice: v.number(),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const applied = await applyPromotionToListPrice(ctx, args.listPrice, {
      department: args.department,
      province: args.province,
      district: args.district,
    });
    return applied;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    festivityLabel: v.optional(v.string()),
    department: v.string(),
    province: v.optional(v.string()),
    district: v.optional(v.string()),
    discountRate: v.number(),
    startDate: v.string(),
    endDate: v.string(),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "admin");
    const discountRate = normalizeMoney(args.discountRate);
    if (discountRate <= 0 || discountRate > MAX_PROMOTION_DISCOUNT_RATE) {
      throw new Error(
        `El descuento debe estar entre 1% y ${MAX_PROMOTION_DISCOUNT_RATE * 100}% (tope donde Hercom deja de ganar).`,
      );
    }
    const startsAt = parseDateStartMs(args.startDate);
    const endsAt = parseDateEndMs(args.endDate);
    if (endsAt < startsAt) {
      throw new Error("La fecha de fin debe ser posterior a la de inicio.");
    }

    return await ctx.db.insert("promotions", {
      name: args.name.trim(),
      ...(args.festivityLabel !== undefined
        ? { festivityLabel: args.festivityLabel.trim() }
        : {}),
      department: args.department,
      ...(args.province !== undefined && args.province !== ""
        ? { province: args.province }
        : {}),
      ...(args.district !== undefined && args.district !== ""
        ? { district: args.district }
        : {}),
      discountRate,
      startsAt,
      endsAt,
      active: args.active ?? true,
      createdAt: Date.now(),
      createdBy: user._id,
    });
  },
});

export const setActive = mutation({
  args: {
    promotionId: v.id("promotions"),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    const promotion = await ctx.db.get(args.promotionId);
    if (promotion === null) {
      throw new Error("Promoción no encontrada.");
    }
    await ctx.db.patch(promotion._id, { active: args.active });
    return promotion._id;
  },
});

export const remove = mutation({
  args: { promotionId: v.id("promotions") },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    const promotion = await ctx.db.get(args.promotionId);
    if (promotion === null) {
      throw new Error("Promoción no encontrada.");
    }
    await ctx.db.delete(promotion._id);
    return promotion._id;
  },
});

export const getActiveForRegion = query({
  args: {
    department: v.string(),
    province: v.optional(v.string()),
    district: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await findActivePromotion(ctx, {
      department: args.department,
      province: args.province,
      district: args.district,
    });
  },
});
