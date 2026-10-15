import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireFullAdmin } from "./lib/auth";
import { normalizeCountryCode } from "./data/countryCatalog";
import { normalizeMoney } from "./lib/money";

export const listForAdmin = query({
  args: {
    countryCode: v.optional(v.string()),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireFullAdmin(ctx);
    const countryCode =
      args.countryCode !== undefined
        ? normalizeCountryCode(args.countryCode)
        : undefined;
    const rules = await ctx.db.query("districtPricingRules").collect();
    return rules
      .filter((rule) => {
        if (countryCode !== undefined && rule.countryCode !== countryCode) {
          return false;
        }
        if (
          args.department !== undefined &&
          args.department !== "" &&
          rule.department !== args.department
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const upsert = mutation({
  args: {
    ruleId: v.optional(v.id("districtPricingRules")),
    countryCode: v.string(),
    department: v.string(),
    province: v.optional(v.string()),
    district: v.optional(v.string()),
    maxDriverOfferPrice: v.optional(v.number()),
    maxDriverMarkupOverBase: v.optional(v.number()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await requireFullAdmin(ctx);
    const countryCode = normalizeCountryCode(args.countryCode);
    const department = args.department.trim();
    if (department === "") {
      throw new Error("Indica el departamento.");
    }
    if (
      args.maxDriverOfferPrice !== undefined &&
      args.maxDriverOfferPrice <= 0
    ) {
      throw new Error("El tope máximo debe ser mayor a 0.");
    }
    if (
      args.maxDriverMarkupOverBase !== undefined &&
      (args.maxDriverMarkupOverBase < 0 || args.maxDriverMarkupOverBase > 2)
    ) {
      throw new Error("El recargo máximo debe estar entre 0% y 200%.");
    }

    const payload: {
      countryCode: string;
      department: string;
      province?: string;
      district?: string;
      maxDriverOfferPrice?: number;
      maxDriverMarkupOverBase?: number;
      active: boolean;
      updatedAt: number;
      updatedBy: typeof admin._id;
    } = {
      countryCode,
      department,
      active: args.active,
      updatedAt: Date.now(),
      updatedBy: admin._id,
    };
    if (args.province !== undefined && args.province.trim() !== "") {
      payload.province = args.province.trim();
    }
    if (args.district !== undefined && args.district.trim() !== "") {
      payload.district = args.district.trim();
    }
    if (args.maxDriverOfferPrice !== undefined) {
      payload.maxDriverOfferPrice = normalizeMoney(args.maxDriverOfferPrice);
    }
    if (args.maxDriverMarkupOverBase !== undefined) {
      payload.maxDriverMarkupOverBase = args.maxDriverMarkupOverBase;
    }

    if (args.ruleId !== undefined) {
      await ctx.db.patch(args.ruleId, payload);
      return args.ruleId;
    }

    return await ctx.db.insert("districtPricingRules", payload);
  },
});

export const remove = mutation({
  args: { ruleId: v.id("districtPricingRules") },
  handler: async (ctx, args) => {
    await requireFullAdmin(ctx);
    await ctx.db.delete(args.ruleId);
  },
});
