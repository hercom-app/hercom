import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { normalizeCountryCode } from "./data/countryCatalog";
import { MAX_PROMOTION_DISCOUNT_RATE } from "./lib/constants";
import { getMarketByCountry } from "./lib/markets";
import { normalizeMoney } from "./lib/money";
import { computePromotionalPricing } from "./lib/pricing";
import { applyPromotionToListPrice, findActivePromotion } from "./lib/promotions";
import { requireFullAdmin, requireUser } from "./lib/auth";
import {
  listLevel1ForCountry,
  listLevel2ForCountry,
  listLevel3ForCountry,
} from "./lib/regionFilters";

function parseDateStartMs(dateStr: string, timezone: string): number {
  const offset = timezone === "America/Lima" ? "-05:00" : "Z";
  const parsed = new Date(`${dateStr}T00:00:00.000${offset}`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Fecha de inicio inválida.");
  }
  return parsed.getTime();
}

function parseDateEndMs(dateStr: string, timezone: string): number {
  const offset = timezone === "America/Lima" ? "-05:00" : "Z";
  const parsed = new Date(`${dateStr}T23:59:59.999${offset}`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Fecha de fin inválida.");
  }
  return parsed.getTime();
}

/** @deprecated Usar geo.listLevel1 */
export const listDepartments = query({
  args: { countryCode: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return listLevel1ForCountry(normalizeCountryCode(args.countryCode));
  },
});

/** @deprecated Usar geo.listLevel2 */
export const listProvinces = query({
  args: {
    countryCode: v.optional(v.string()),
    department: v.string(),
  },
  handler: async (_ctx, args) => {
    await requireUser(_ctx);
    return listLevel2ForCountry(
      normalizeCountryCode(args.countryCode),
      args.department,
    );
  },
});

/** @deprecated Usar geo.listLevel3 */
export const listDistricts = query({
  args: {
    countryCode: v.optional(v.string()),
    department: v.string(),
    province: v.string(),
  },
  handler: async (_ctx, args) => {
    await requireUser(_ctx);
    return listLevel3ForCountry(
      normalizeCountryCode(args.countryCode),
      args.department,
      args.province,
    );
  },
});

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireFullAdmin(ctx);
    return await ctx.db.query("promotions").order("desc").collect();
  },
});

export const previewPricing = query({
  args: {
    listPrice: v.number(),
    discountRate: v.number(),
    countryCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireFullAdmin(ctx);
    const market = await getMarketByCountry(ctx, args.countryCode);
    const rate = Math.min(
      Math.max(args.discountRate, 0),
      MAX_PROMOTION_DISCOUNT_RATE,
    );
    const pricing = computePromotionalPricing(args.listPrice, rate);
    return {
      ...pricing,
      maxDiscountRate: MAX_PROMOTION_DISCOUNT_RATE,
      minListPrice: market.minServicePrice,
      hourlyRate: market.hourlyRate,
      minHours: market.minServiceHours,
      currencySymbol: market.currencySymbol,
      currencyCode: market.currencyCode,
    };
  },
});

export const previewForRegion = query({
  args: {
    countryCode: v.optional(v.string()),
    department: v.string(),
    province: v.optional(v.string()),
    district: v.optional(v.string()),
    listPrice: v.number(),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const applied = await applyPromotionToListPrice(ctx, args.listPrice, {
      countryCode: normalizeCountryCode(args.countryCode),
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
    countryCode: v.optional(v.string()),
    department: v.string(),
    province: v.optional(v.string()),
    district: v.optional(v.string()),
    discountRate: v.number(),
    startDate: v.string(),
    endDate: v.string(),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireFullAdmin(ctx);
    const countryCode = normalizeCountryCode(args.countryCode);
    const market = await getMarketByCountry(ctx, countryCode);
    const discountRate = normalizeMoney(args.discountRate);
    if (discountRate <= 0 || discountRate > MAX_PROMOTION_DISCOUNT_RATE) {
      throw new Error(
        `El descuento debe estar entre 1% y ${MAX_PROMOTION_DISCOUNT_RATE * 100}% (tope donde Hercom deja de ganar).`,
      );
    }
    const startsAt = parseDateStartMs(args.startDate, market.timezone);
    const endsAt = parseDateEndMs(args.endDate, market.timezone);
    if (endsAt < startsAt) {
      throw new Error("La fecha de fin debe ser posterior a la de inicio.");
    }

    return await ctx.db.insert("promotions", {
      name: args.name.trim(),
      countryCode,
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
    await requireFullAdmin(ctx);
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
    await requireFullAdmin(ctx);
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
    countryCode: v.optional(v.string()),
    department: v.string(),
    province: v.optional(v.string()),
    district: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await findActivePromotion(ctx, {
      countryCode: normalizeCountryCode(args.countryCode),
      department: args.department,
      province: args.province,
      district: args.district,
    });
  },
});
