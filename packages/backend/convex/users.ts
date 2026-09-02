import { createAccount, modifyAccountCredentials } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { districtScopeValidator, userRoleValidator } from "./schema";
import {
  districtScopeKey,
  filterServicesByAccess,
  getAccessContext,
  listDistrictScopes,
} from "./lib/adminAccess";
import { normalizeCountryCode } from "./data/countryCatalog";
import { getCurrentUser, requireFullAdmin, requireStaff, requireUser } from "./lib/auth";

const MIN_PASSWORD_LENGTH = 8;

function normalizeDistricts(
  districts: Array<{
    countryCode: string;
    department: string;
    province: string;
    district: string;
  }>,
) {
  const unique = new Map<
    string,
    {
      countryCode: string;
      department: string;
      province: string;
      district: string;
    }
  >();
  for (const raw of districts) {
    const scope = {
      countryCode: normalizeCountryCode(raw.countryCode),
      department: raw.department.trim(),
      province: raw.province.trim(),
      district: raw.district.trim(),
    };
    if (
      scope.department === "" ||
      scope.province === "" ||
      scope.district === ""
    ) {
      throw new Error("Cada zona debe incluir departamento, provincia y distrito.");
    }
    unique.set(districtScopeKey(scope), scope);
  }
  if (unique.size === 0) {
    throw new Error("Asigna al menos un distrito.");
  }
  return [...unique.values()];
}

/**
 * Devuelve el usuario autenticado actual (o null si no hay sesión).
 */
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

/**
 * Contexto del panel interno: rol, si es dueño y distritos asignados.
 */
export const getAdminContext = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return null;
    }
    if (user.role !== "admin" && user.role !== "superadmin") {
      return {
        ...user,
        isFullAdmin: false,
        districtScopes: [],
      };
    }
    const access = await getAccessContext(ctx, user);
    return {
      ...user,
      isFullAdmin: access.isFullAdmin,
      districtScopes: access.districtScopes,
    };
  },
});

/**
 * Actualiza el perfil básico del usuario autenticado.
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ctx.db.patch(user._id, {
      ...(args.name !== undefined ? { name: args.name } : {}),
      ...(args.phone !== undefined ? { phone: args.phone } : {}),
      ...(args.image !== undefined ? { image: args.image } : {}),
    });
    return user._id;
  },
});

/**
 * Guarda el token Expo Push del dispositivo para avisos del sistema.
 */
export const saveExpoPushToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const token = args.token.trim();
    if (token === "") {
      throw new Error("Token de notificaciones inválido.");
    }
    if (user.expoPushToken === token) {
      return user._id;
    }
    await ctx.db.patch(user._id, { expoPushToken: token });
    return user._id;
  },
});

/**
 * Asigna un rol a un usuario. Solo superadmin.
 * No crea admins operativos: usa createAdminUser.
 */
export const setRole = mutation({
  args: {
    userId: v.id("users"),
    role: userRoleValidator,
  },
  handler: async (ctx, args) => {
    await requireFullAdmin(ctx);
    if (args.role === "admin") {
      throw new Error(
        "Para crear un admin operativo usa el formulario de equipo (con distritos y clave).",
      );
    }
    await ctx.db.patch(args.userId, { role: args.role });
    if (args.role !== "superadmin") {
      const existing = await listDistrictScopes(ctx, args.userId);
      for (const row of existing) {
        await ctx.db.delete(row._id);
      }
    }
    return args.userId;
  },
});

/**
 * Lista todos los usuarios (panel admin / superadmin).
 */
export const listAll = query({
  args: {
    role: v.optional(userRoleValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireStaff(ctx);
    const access = await getAccessContext(ctx, user);
    let users = await ctx.db.query("users").order("desc").collect();
    if (args.role !== undefined) {
      users = users.filter((item) => item.role === args.role);
    }
    if (!access.isFullAdmin) {
      const services = filterServicesByAccess(
        await ctx.db.query("services").collect(),
        access,
      );
      const allowedIds = new Set(services.map((service) => service.clientId));
      users = users.filter(
        (item) => item.role === "client" && allowedIds.has(item._id),
      );
    }
    return users;
  },
});

/**
 * Admins operativos creados por el superadmin, con sus distritos.
 */
export const listAdmins = query({
  args: {},
  handler: async (ctx) => {
    await requireFullAdmin(ctx);
    const users = await ctx.db.query("users").collect();
    const admins = users.filter((user) => user.role === "admin");
    return await Promise.all(
      admins.map(async (user) => {
        const access = await getAccessContext(ctx, user);
        return {
          ...user,
          districtScopes: access.districtScopes,
        };
      }),
    );
  },
});

/**
 * Crea un admin operativo con clave y uno o más distritos.
 */
export const createAdminUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    districts: v.array(districtScopeValidator),
  },
  handler: async (ctx, args) => {
    await requireFullAdmin(ctx);
    const email = args.email.trim().toLowerCase();
    const name = args.name.trim();
    const password = args.password;
    if (email === "" || !email.includes("@")) {
      throw new Error("Correo inválido.");
    }
    if (name === "") {
      throw new Error("El nombre es obligatorio.");
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`La clave debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
    }
    const districts = normalizeDistricts(args.districts);

    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (existing !== null) {
      throw new Error("Ya existe una cuenta con ese correo.");
    }

    await createAccount(ctx as never, {
      provider: "password",
      account: { id: email, secret: password },
      profile: { email, name, role: "admin" as const },
    });

    const created = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (created === null) {
      throw new Error("No se pudo crear el admin.");
    }
    if (created.role !== "admin") {
      await ctx.db.patch(created._id, { role: "admin", name });
    }

    for (const district of districts) {
      await ctx.db.insert("adminDistrictScopes", {
        userId: created._id,
        ...district,
      });
    }
    return created._id;
  },
});

export const updateAdminDistricts = mutation({
  args: {
    userId: v.id("users"),
    districts: v.array(districtScopeValidator),
  },
  handler: async (ctx, args) => {
    await requireFullAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (user === null || user.role !== "admin") {
      throw new Error("Solo se pueden editar distritos de admins operativos.");
    }
    const districts = normalizeDistricts(args.districts);
    const existing = await listDistrictScopes(ctx, args.userId);
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }
    for (const district of districts) {
      await ctx.db.insert("adminDistrictScopes", {
        userId: args.userId,
        ...district,
      });
    }
    return args.userId;
  },
});

export const setAdminPassword = mutation({
  args: {
    userId: v.id("users"),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    await requireFullAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (user === null || user.role !== "admin") {
      throw new Error("Solo se puede cambiar la clave de un admin operativo.");
    }
    const email = user.email?.trim().toLowerCase();
    if (email === undefined || email === "") {
      throw new Error("El admin no tiene correo.");
    }
    if (args.password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`La clave debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
    }
    await modifyAccountCredentials(ctx as never, {
      provider: "password",
      account: { id: email, secret: args.password },
    });
    return args.userId;
  },
});
