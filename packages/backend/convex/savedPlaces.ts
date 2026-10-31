import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";

/** Casa + unos pocos favoritos. El tope evita que la lista del home crezca sin control. */
const MAX_FAVORITES = 4;
const MAX_LABEL_LENGTH = 40;
const MAX_ADDRESS_LENGTH = 300;

const placeArgs = {
  address: v.string(),
  lat: v.number(),
  lng: v.number(),
  label: v.optional(v.string()),
};

function sameAddress(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function normalizeAddress(raw: string): string {
  const address = raw.trim();
  if (address === "") {
    throw new Error("Elige una dirección.");
  }
  if (address.length > MAX_ADDRESS_LENGTH) {
    throw new Error("La dirección es demasiado larga.");
  }
  return address;
}

function normalizeLabel(raw: string | undefined, fallback: string): string {
  const label = (raw ?? fallback).trim();
  if (label === "") {
    return fallback;
  }
  if (label.length > MAX_LABEL_LENGTH) {
    return label.slice(0, MAX_LABEL_LENGTH);
  }
  return label;
}

function assertCoordinates(lat: number, lng: number): void {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180 ||
    (lat === 0 && lng === 0)
  ) {
    throw new Error("Elige un lugar en el mapa.");
  }
}

function favoriteLabelFromAddress(address: string): string {
  const title = address
    .split(",")
    .map((part) => part.trim())
    .find((part) => part !== "");
  return normalizeLabel(title, "Favorito");
}

/**
 * Casa primero, luego favoritos del más reciente al más antiguo.
 */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("savedPlaces")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    rows.sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === "home" ? -1 : 1;
      }
      return right.updatedAt - left.updatedAt;
    });
    return rows;
  },
});

/** Crea o reemplaza la única casa del usuario. */
export const setHome = mutation({
  args: placeArgs,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const address = normalizeAddress(args.address);
    assertCoordinates(args.lat, args.lng);
    const label = normalizeLabel(args.label, "Casa");
    const now = Date.now();
    const rows = await ctx.db
      .query("savedPlaces")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const home = rows.find((row) => row.kind === "home");
    const homeId =
      home === undefined
        ? await ctx.db.insert("savedPlaces", {
            userId: user._id,
            kind: "home",
            label,
            address,
            lat: args.lat,
            lng: args.lng,
            updatedAt: now,
          })
        : home._id;

    if (home !== undefined) {
      await ctx.db.patch(home._id, {
        label,
        address,
        lat: args.lat,
        lng: args.lng,
        updatedAt: now,
      });
    }

    const duplicateFavorite = rows.find(
      (row) => row.kind === "favorite" && sameAddress(row.address, address),
    );
    if (duplicateFavorite !== undefined) {
      await ctx.db.delete(duplicateFavorite._id);
    }

    return homeId;
  },
});

/** Agrega un favorito. La misma dirección actualiza el existente. */
export const saveFavorite = mutation({
  args: placeArgs,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const address = normalizeAddress(args.address);
    assertCoordinates(args.lat, args.lng);
    const now = Date.now();
    const rows = await ctx.db
      .query("savedPlaces")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (rows.some((row) => row.kind === "home" && sameAddress(row.address, address))) {
      throw new Error("Esa dirección ya es tu casa.");
    }

    const existing = rows.find(
      (row) => row.kind === "favorite" && sameAddress(row.address, address),
    );
    if (existing !== undefined) {
      await ctx.db.patch(existing._id, {
        label: normalizeLabel(args.label, existing.label),
        address,
        lat: args.lat,
        lng: args.lng,
        updatedAt: now,
      });
      return existing._id;
    }

    const favoriteCount = rows.filter((row) => row.kind === "favorite").length;
    if (favoriteCount >= MAX_FAVORITES) {
      throw new Error(
        "Puedes guardar hasta 4 favoritos. Quita uno para agregar otro.",
      );
    }

    return await ctx.db.insert("savedPlaces", {
      userId: user._id,
      kind: "favorite",
      label: normalizeLabel(args.label, favoriteLabelFromAddress(address)),
      address,
      lat: args.lat,
      lng: args.lng,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: {
    placeId: v.id("savedPlaces"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const place = await ctx.db.get(args.placeId);
    if (place === null || place.userId !== user._id) {
      throw new Error("No encontramos ese lugar.");
    }
    await ctx.db.delete(place._id);
  },
});
