import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { SUPPORTED_COUNTRIES } from "./data/countryCatalog";
import { requireFullAdmin, requireUser } from "./lib/auth";
import {
  buildDefaultMarketRecord,
  getMarketByCountry,
  localToUsd,
  marketMoneySummary,
  usdToLocal,
} from "./lib/markets";
import { normalizeMoney } from "./lib/money";
import { normalizeCountryCode } from "./data/countryCatalog";

function validateMarketNumbers(args: {
  usdExchangeRate: number;
  hourlyRate: number;
  minServiceHours: number;
  commissionRate: number;
}) {
  if (args.usdExchangeRate <= 0) {
    throw new Error("El tipo de cambio debe ser mayor a 0 (moneda local por 1 USD).");
  }
  if (args.hourlyRate <= 0) {
    throw new Error("La tarifa horaria debe ser mayor a 0.");
  }
  if (args.minServiceHours < 1) {
    throw new Error("Las horas mínimas deben ser al menos 1.");
  }
  if (args.commissionRate <= 0 || args.commissionRate > 1) {
    throw new Error("La comisión debe estar entre 1% y 100%.");
  }
}

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireFullAdmin(ctx);
    const markets = await ctx.db.query("markets").collect();
    const byCode = new Map(markets.map((market) => [market.countryCode, market]));

    return SUPPORTED_COUNTRIES.map((country) => {
      const market = byCode.get(country.code) ?? null;
      const pricing =
        market !== null
          ? {
              hourlyRate: market.hourlyRate,
              minServiceHours: market.minServiceHours,
              minServicePrice: normalizeMoney(
                market.hourlyRate * market.minServiceHours,
              ),
              currencyCode: market.currencyCode,
              currencySymbol: market.currencySymbol,
              usdExchangeRate: market.usdExchangeRate,
              commissionRate: market.commissionRate,
              commissionRateFromHour3: market.commissionRateFromHour3,
              commissionRateFromHour8: market.commissionRateFromHour8,
              commissionFromHour3: market.commissionFromHour3,
              commissionFromHour8: market.commissionFromHour8,
              maxDriverMarkupOverBase: market.maxDriverMarkupOverBase,
              maxDriverOfferDistanceKm: market.maxDriverOfferDistanceKm,
              active: market.active,
            }
          : null;

      return {
        countryCode: country.code,
        countryName: country.name,
        level1Label: country.level1Label,
        level2Label: country.level2Label,
        level3Label: country.level3Label,
        marketId: market?._id ?? null,
        configured: market !== null,
        active: market?.active ?? false,
        pricing,
      };
    });
  },
});

export const getPricing = query({
  args: {
    countryCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireFullAdmin(ctx);
    const pricing = await getMarketByCountry(ctx, args.countryCode);
    const sample = marketMoneySummary(pricing, pricing.minServicePrice);
    return {
      ...pricing,
      sampleMinPriceLocal: sample.formattedLocal,
      sampleMinPriceUsd: sample.formattedUsd,
    };
  },
});

/** Público para apps autenticadas (cliente/chofer). */
export const getPublicPricing = query({
  args: {
    countryCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const pricing = await getMarketByCountry(ctx, args.countryCode);
    return {
      countryCode: pricing.countryCode,
      countryName: pricing.countryName,
      currencyCode: pricing.currencyCode,
      currencySymbol: pricing.currencySymbol,
      usdExchangeRate: pricing.usdExchangeRate,
      hourlyRate: pricing.hourlyRate,
      minServiceHours: pricing.minServiceHours,
      minServicePrice: pricing.minServicePrice,
      commissionRate: pricing.commissionRate,
      commissionRateFromHour3: pricing.commissionRateFromHour3,
      commissionRateFromHour8: pricing.commissionRateFromHour8,
      commissionFromHour3: pricing.commissionFromHour3,
      commissionFromHour8: pricing.commissionFromHour8,
      maxDriverMarkupOverBase: pricing.maxDriverMarkupOverBase,
      maxDriverOfferDistanceKm: pricing.maxDriverOfferDistanceKm,
      level1Label: pricing.level1Label,
      level2Label: pricing.level2Label,
      level3Label: pricing.level3Label,
    };
  },
});

export const convert = query({
  args: {
    countryCode: v.optional(v.string()),
    amount: v.number(),
    direction: v.union(v.literal("local_to_usd"), v.literal("usd_to_local")),
  },
  handler: async (ctx, args) => {
    await requireFullAdmin(ctx);
    const pricing = await getMarketByCountry(ctx, args.countryCode);
    const local =
      args.direction === "usd_to_local"
        ? usdToLocal(args.amount, pricing.usdExchangeRate)
        : normalizeMoney(args.amount);
    const usd =
      args.direction === "local_to_usd"
        ? localToUsd(args.amount, pricing.usdExchangeRate)
        : normalizeMoney(args.amount);

    return {
      countryCode: pricing.countryCode,
      currencyCode: pricing.currencyCode,
      currencySymbol: pricing.currencySymbol,
      usdExchangeRate: pricing.usdExchangeRate,
      amountLocal: local,
      amountUsd: usd,
      formattedLocal: `${pricing.currencySymbol}${local.toFixed(2)}`,
      formattedUsd: `US$${usd.toFixed(2)}`,
    };
  },
});

export const upsert = mutation({
  args: {
    countryCode: v.string(),
    currencyCode: v.string(),
    currencySymbol: v.string(),
    usdExchangeRate: v.number(),
    hourlyRate: v.number(),
    minServiceHours: v.number(),
    commissionRate: v.number(),
    commissionRateFromHour3: v.optional(v.number()),
    commissionRateFromHour8: v.optional(v.number()),
    commissionFromHour3: v.optional(v.number()),
    commissionFromHour8: v.optional(v.number()),
    maxDriverMarkupOverBase: v.optional(v.number()),
    maxDriverOfferDistanceKm: v.optional(v.number()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireFullAdmin(ctx);
    const countryCode = normalizeCountryCode(args.countryCode);
    const country = SUPPORTED_COUNTRIES.find((item) => item.code === countryCode);
    if (country === undefined) {
      throw new Error(`País no soportado: ${countryCode}`);
    }

    validateMarketNumbers(args);

    const existing = await ctx.db
      .query("markets")
      .withIndex("by_country", (q) => q.eq("countryCode", countryCode))
      .unique();

    const payload = {
      countryCode,
      name: country.name,
      currencyCode: args.currencyCode.trim().toUpperCase(),
      currencySymbol: args.currencySymbol.trim(),
      usdExchangeRate: normalizeMoney(args.usdExchangeRate),
      hourlyRate: normalizeMoney(args.hourlyRate),
      minServiceHours: Math.round(args.minServiceHours),
      commissionRate: normalizeMoney(args.commissionRate),
      ...(args.commissionRateFromHour3 !== undefined
        ? { commissionRateFromHour3: normalizeMoney(args.commissionRateFromHour3) }
        : {}),
      ...(args.commissionRateFromHour8 !== undefined
        ? { commissionRateFromHour8: normalizeMoney(args.commissionRateFromHour8) }
        : {}),
      ...(args.commissionFromHour3 !== undefined
        ? { commissionFromHour3: Math.round(args.commissionFromHour3) }
        : {}),
      ...(args.commissionFromHour8 !== undefined
        ? { commissionFromHour8: Math.round(args.commissionFromHour8) }
        : {}),
      ...(args.maxDriverMarkupOverBase !== undefined
        ? { maxDriverMarkupOverBase: normalizeMoney(args.maxDriverMarkupOverBase) }
        : {}),
      ...(args.maxDriverOfferDistanceKm !== undefined
        ? {
            maxDriverOfferDistanceKm: normalizeMoney(
              args.maxDriverOfferDistanceKm,
            ),
          }
        : {}),
      active: args.active,
      updatedAt: Date.now(),
    };

    if (existing === null) {
      return await ctx.db.insert("markets", {
        ...payload,
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(existing._id, payload);
    return existing._id;
  },
});

/**
 * Crea mercados por defecto para países soportados (idempotente).
 */
export const ensureDefaults = internalMutation({
  args: {},
  handler: async (ctx) => {
    let created = 0;
    for (const country of SUPPORTED_COUNTRIES) {
      const existing = await ctx.db
        .query("markets")
        .withIndex("by_country", (q) => q.eq("countryCode", country.code))
        .unique();
      if (existing !== null) {
        continue;
      }
      await ctx.db.insert("markets", buildDefaultMarketRecord(country));
      created += 1;
    }
    return { created };
  },
});
