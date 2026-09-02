import { createAccount, modifyAccountCredentials } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { computePlatformCommission } from "./lib/constants";
import { ensureWallet } from "./driverWallets";

/**
 * Credenciales de la demo. Todas usan la misma contraseña para simplificar.
 * Cámbialas antes de cualquier entorno que no sea local.
 */
const DEMO_PASSWORD = "demo1234";
const OWNER_EMAIL = "ricardos@hercom.com";
const OWNER_PASSWORD = "Hercom2026";
const OWNER_NAME = "Ricardo Bejarano";

const DEMO_ADMIN = { email: "admin@demo.com", name: "Admin Demo" };
const DEMO_DRIVER = { email: "chofer@demo.com", name: "Carlos Chofer" };
const DEMO_CLIENT = { email: "cliente@demo.com", name: "Cliente Demo" };

/**
 * Crea las cuentas de demostración (admin, chofer y cliente) que SÍ pueden
 * iniciar sesión, además de un servicio de ejemplo ya asignado al chofer para
 * que se vea de inmediato en la app móvil.
 *
 * Idempotente: si las cuentas ya existen no las duplica, y solo crea el
 * servicio de ejemplo si el cliente aún no tiene servicios.
 *
 * Ejecutar con:
 *   npx convex run seed:seedDemo
 */
export const seedDemo = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.markets.ensureDefaults, {});

    const admin = await ensureUser(ctx, DEMO_ADMIN.email, DEMO_ADMIN.name, "superadmin");
    const driverUser = await ensureUser(ctx, DEMO_DRIVER.email, DEMO_DRIVER.name, "driver");
    const client = await ensureUser(ctx, DEMO_CLIENT.email, DEMO_CLIENT.name, "client");

    const driver = await ensureDriver(ctx, driverUser._id);
    await ensureDemoWalletBalance(ctx, driver._id);

    const existingServices = await ctx.db
      .query("services")
      .withIndex("by_client", (q) => q.eq("clientId", client._id))
      .collect();

    let serviceId: Id<"services"> | null = null;
    if (existingServices.length === 0) {
      const basePrice = 80;
      const offeredPrice = 80;
      const advanceAmount = 20;
      const totalPrice = offeredPrice;
      serviceId = await ctx.db.insert("services", {
        clientId: client._id,
        origin: {
          address: "Av. Reforma 100, CDMX",
          lat: 19.4326,
          lng: -99.1332,
        },
        destination: {
          address: "Aeropuerto Internacional CDMX (AICM)",
          lat: 19.4361,
          lng: -99.0719,
        },
        basePrice,
        offeredPrice,
        totalPrice,
        driverCommission: computePlatformCommission(offeredPrice),
        advanceAmount,
        serviceType: "app",
        requestChannel: "mobile_app",
        securityCode: "1234",
        status: "assigned",
        notes: "Servicio de demostración (seed)",
        requestedAt: Date.now(),
        assignedAt: Date.now(),
        driverId: driver._id,
      });
      // El chofer pasa a ocupado al tener un viaje asignado.
      await ctx.db.patch(driver._id, { status: "busy" });
    }

    return {
      message: "Seed completado.",
      credentials: {
        password: DEMO_PASSWORD,
        admin: DEMO_ADMIN.email,
        driver: DEMO_DRIVER.email,
        client: DEMO_CLIENT.email,
      },
      ids: {
        admin: admin._id,
        driverUser: driverUser._id,
        driver: driver._id,
        client: client._id,
        service: serviceId,
      },
    };
  },
});

export const DEMO_LIVE_SHARE_TOKEN = "demoviaje001";

/**
 * Viaje en curso con GPS para demo a gerencia (web comercial /live y admin).
 * Idempotente. Ejecutar: npx convex run seed:seedLiveDemo
 */
export const seedLiveDemo = internalMutation({
  args: {},
  handler: async (ctx) => {
    const driverUser = await ensureUser(
      ctx,
      DEMO_DRIVER.email,
      DEMO_DRIVER.name,
      "driver",
    );
    const client = await ensureUser(
      ctx,
      DEMO_CLIENT.email,
      DEMO_CLIENT.name,
      "client",
    );
    const driver = await ensureDriver(ctx, driverUser._id);
    await ensureDemoWalletBalance(ctx, driver._id);

    const origin = {
      address: "Av. Javier Prado Oeste 460, San Isidro",
      lat: -12.0931,
      lng: -77.0431,
      countryCode: "PE",
      department: "Lima",
      province: "Lima",
      district: "San Isidro",
    };
    const destination = {
      address: "Aeropuerto Internacional Jorge Chávez",
      lat: -12.0219,
      lng: -77.1143,
      countryCode: "PE",
      department: "Callao",
      province: "Callao",
      district: "Callao",
    };

    const existingTracking = await ctx.db
      .query("serviceTracking")
      .withIndex("by_share_token", (q) =>
        q.eq("shareToken", DEMO_LIVE_SHARE_TOKEN),
      )
      .unique();

    const now = Date.now();
    const trail = [
      { lat: -12.0931, lng: -77.0431, t: now - 180000 },
      { lat: -12.072, lng: -77.062, t: now - 120000 },
      { lat: -12.051, lng: -77.085, t: now - 60000 },
      { lat: -12.038, lng: -77.098, t: now },
    ];
    const last = trail[trail.length - 1]!;

    let serviceId: Id<"services">;
    if (existingTracking !== null) {
      serviceId = existingTracking.serviceId;
      await ctx.db.patch(serviceId, {
        status: "in_progress",
        origin,
        destination,
        driverId: driver._id,
        departedWithClientAt: now - 180000,
      });
      await ctx.db.patch(existingTracking._id, {
        lat: last.lat,
        lng: last.lng,
        updatedAt: now,
        trail,
      });
    } else {
      const offeredPrice = 80;
      serviceId = await ctx.db.insert("services", {
        clientId: client._id,
        driverId: driver._id,
        origin,
        destination,
        basePrice: offeredPrice,
        offeredPrice,
        totalPrice: offeredPrice,
        driverCommission: computePlatformCommission(offeredPrice),
        advanceAmount: 20,
        advanceConfirmedAt: now - 240000,
        serviceType: "app",
        requestChannel: "mobile_app",
        securityCode: "1234",
        status: "in_progress",
        notes: "Viaje demo en vivo (seedLiveDemo)",
        requestedAt: now - 360000,
        assignedAt: now - 300000,
        headingToPickupAt: now - 240000,
        arrivedPickupAt: now - 200000,
        departedWithClientAt: now - 180000,
      });
      await ctx.db.insert("serviceTracking", {
        serviceId,
        shareToken: DEMO_LIVE_SHARE_TOKEN,
        lat: last.lat,
        lng: last.lng,
        trail,
        updatedAt: now,
        createdAt: now - 240000,
      });
    }

    await ctx.db.patch(driver._id, { status: "busy" });

    return {
      message: "Viaje en vivo listo para demo.",
      shareToken: DEMO_LIVE_SHARE_TOKEN,
      liveUrl: `/live/${DEMO_LIVE_SHARE_TOKEN}`,
      serviceId,
    };
  },
});

/**
 * Busca un usuario por email; si no existe crea la cuenta (con contraseña real)
 * usando Convex Auth. Devuelve el documento de usuario.
 */
async function ensureUser(
  ctx: MutationCtx,
  email: string,
  name: string,
  role: Doc<"users">["role"],
): Promise<Doc<"users">> {
  const existing = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .unique();
  if (existing !== null) {
    if (existing.role !== role) {
      await ctx.db.patch(existing._id, { role });
    }
    await ensurePasswordAccount(ctx, email, name, role);
    return (await ctx.db.get(existing._id)) as Doc<"users">;
  }

  await createAccount(ctx as never, {
    provider: "password",
    account: { id: email, secret: DEMO_PASSWORD },
    profile: { email, name, role },
  });

  const created = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .unique();
  if (created === null) {
    throw new Error(`No se pudo crear la cuenta para ${email}.`);
  }
  return created;
}

async function ensurePasswordAccount(
  ctx: MutationCtx,
  email: string,
  name: string,
  role: Doc<"users">["role"],
): Promise<void> {
  const existingAccount = await ctx.db
    .query("authAccounts")
    .withIndex("providerAndAccountId", (q) =>
      q.eq("provider", "password").eq("providerAccountId", email),
    )
    .unique();

  if (existingAccount === null) {
    await createAccount(ctx as never, {
      provider: "password",
      account: { id: email, secret: DEMO_PASSWORD },
      profile: { email, name, role },
      shouldLinkViaEmail: true,
    });
    return;
  }

  await modifyAccountCredentials(ctx as never, {
    provider: "password",
    account: { id: email, secret: DEMO_PASSWORD },
  });
}

/**
 * Crea (o devuelve) el perfil de chofer asociado a un usuario.
 */
async function ensureDriver(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"drivers">> {
  const existing = await ctx.db
    .query("drivers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (existing !== null) {
    await ensureWallet(ctx, existing._id);
    return existing;
  }

  const driverId = await ctx.db.insert("drivers", {
    userId,
    status: "available",
    vehicle: {
      make: "Nissan",
      model: "Versa",
      plate: "DEMO-123",
      year: 2022,
      color: "Gris",
    },
    licenseNumber: "LIC-DEMO-0001",
    licenseExpiry: Date.now() + 365 * 24 * 60 * 60 * 1000,
    rating: 5,
    totalTrips: 0,
    countryCode: "PE",
    department: "Lima",
    province: "Lima",
    district: "Miraflores",
  });
  await ensureWallet(ctx, driverId);
  return (await ctx.db.get(driverId)) as Doc<"drivers">;
}

async function ensureDemoWalletBalance(
  ctx: MutationCtx,
  driverId: Id<"drivers">,
): Promise<void> {
  const wallet = await ensureWallet(ctx, driverId);
  if (wallet.balance >= 50) {
    return;
  }
  await ctx.db.patch(wallet._id, {
    balance: 50,
    updatedAt: Date.now(),
  });
  await ctx.db.insert("walletTransactions", {
    driverId,
    type: "top_up",
    amount: 50,
    balanceAfter: 50,
    note: "Recarga seed demo",
    createdAt: Date.now(),
  });
}

async function wipeTable(
  ctx: MutationCtx,
  table:
    | "serviceOffers"
    | "serviceTracking"
    | "serviceRatings"
    | "serviceVehicleChecklists"
    | "payments"
    | "walletTransactions"
    | "notifications"
    | "services"
    | "payouts"
    | "driverWallets"
    | "driverApplications"
    | "adminDistrictScopes"
    | "drivers"
    | "promotions",
): Promise<number> {
  const rows = await ctx.db.query(table).collect();
  for (const row of rows) {
    await ctx.db.delete(row._id);
  }
  return rows.length;
}

async function deleteAuthForUser(
  ctx: MutationCtx,
  userId: Id<"users">,
  email: string | undefined,
): Promise<void> {
  const sessions = await ctx.db.query("authSessions").collect();
  for (const session of sessions) {
    if (session.userId === userId) {
      await ctx.db.delete(session._id);
    }
  }
  const accounts = await ctx.db.query("authAccounts").collect();
  for (const account of accounts) {
    if (account.userId === userId) {
      await ctx.db.delete(account._id);
    }
  }
  if (email !== undefined && email !== "") {
    const byEmail = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", email),
      )
      .unique();
    if (byEmail !== null) {
      await ctx.db.delete(byEmail._id);
    }
  }
}

/**
 * Deja el entorno listo para mostrar al dueño: un solo superadmin,
 * sin admins, sin choferes, sin viajes ni solicitudes de registro.
 *
 *   npx convex run seed:resetForOwnerKickoff
 *   npx convex run seed:resetForOwnerKickoff --prod
 */
export const resetForOwnerKickoff = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.markets.ensureDefaults, {});

    const deleted = {
      serviceOffers: await wipeTable(ctx, "serviceOffers"),
      serviceTracking: await wipeTable(ctx, "serviceTracking"),
      serviceRatings: await wipeTable(ctx, "serviceRatings"),
      checklists: await wipeTable(ctx, "serviceVehicleChecklists"),
      payments: await wipeTable(ctx, "payments"),
      walletTransactions: await wipeTable(ctx, "walletTransactions"),
      notifications: await wipeTable(ctx, "notifications"),
      services: await wipeTable(ctx, "services"),
      payouts: await wipeTable(ctx, "payouts"),
      driverWallets: await wipeTable(ctx, "driverWallets"),
      driverApplications: await wipeTable(ctx, "driverApplications"),
      adminDistrictScopes: await wipeTable(ctx, "adminDistrictScopes"),
      drivers: await wipeTable(ctx, "drivers"),
      promotions: await wipeTable(ctx, "promotions"),
    };

    const users = await ctx.db.query("users").collect();
    let deletedUsers = 0;
    for (const user of users) {
      const email = user.email?.trim().toLowerCase() ?? "";
      if (email === OWNER_EMAIL) {
        await ctx.db.patch(user._id, {
          role: "superadmin",
          name: OWNER_NAME,
        });
        continue;
      }
      await deleteAuthForUser(ctx, user._id, user.email);
      await ctx.db.delete(user._id);
      deletedUsers += 1;
    }

    const owner = await ensureUserWithPassword(
      ctx,
      OWNER_EMAIL,
      OWNER_NAME,
      "superadmin",
      OWNER_PASSWORD,
    );

    return {
      message: "Entorno limpio para pruebas con el dueño.",
      superadmin: {
        email: OWNER_EMAIL,
        password: OWNER_PASSWORD,
        userId: owner._id,
      },
      deletedUsers,
      deleted,
    };
  },
});

async function ensureUserWithPassword(
  ctx: MutationCtx,
  email: string,
  name: string,
  role: Doc<"users">["role"],
  password: string,
): Promise<Doc<"users">> {
  const existing = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .unique();
  if (existing !== null) {
    if (existing.role !== role || existing.name !== name) {
      await ctx.db.patch(existing._id, { role, name });
    }
    const existingAccount = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", email),
      )
      .unique();
    if (existingAccount === null) {
      await createAccount(ctx as never, {
        provider: "password",
        account: { id: email, secret: password },
        profile: { email, name, role },
        shouldLinkViaEmail: true,
      });
    } else {
      await modifyAccountCredentials(ctx as never, {
        provider: "password",
        account: { id: email, secret: password },
      });
    }
    return (await ctx.db.get(existing._id)) as Doc<"users">;
  }

  await createAccount(ctx as never, {
    provider: "password",
    account: { id: email, secret: password },
    profile: { email, name, role },
  });
  const created = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .unique();
  if (created === null) {
    throw new Error(`No se pudo crear la cuenta para ${email}.`);
  }
  return created;
}
