import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { normalizeCountryCode } from "./data/countryCatalog";
import {
  getCountryGeoConfig,
  listLevel1ForCountry,
  listLevel2ForCountry,
  listLevel3ForCountry,
  listSupportedCountries,
} from "./lib/regionFilters";

const countryCodeArg = v.optional(v.string());

export const listCountries = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return listSupportedCountries();
  },
});

export const getCountryConfig = query({
  args: {
    countryCode: countryCodeArg,
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return getCountryGeoConfig(normalizeCountryCode(args.countryCode));
  },
});

/** Nivel 1 (Perú: departamento). */
export const listLevel1 = query({
  args: {
    countryCode: countryCodeArg,
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return listLevel1ForCountry(normalizeCountryCode(args.countryCode));
  },
});

/** Nivel 2 (Perú: provincia). */
export const listLevel2 = query({
  args: {
    countryCode: countryCodeArg,
    level1: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return listLevel2ForCountry(
      normalizeCountryCode(args.countryCode),
      args.level1,
    );
  },
});

/** Nivel 3 (Perú: distrito). */
export const listLevel3 = query({
  args: {
    countryCode: countryCodeArg,
    level1: v.string(),
    level2: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return listLevel3ForCountry(
      normalizeCountryCode(args.countryCode),
      args.level1,
      args.level2,
    );
  },
});
