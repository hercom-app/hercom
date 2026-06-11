import { createAccount } from "@convex-dev/auth/server";
import { internalMutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { computeDriverCommission } from "./lib/constants";

/**
 * Credenciales de la demo. Todas usan la misma contraseña para simplificar.
 * Cámbialas antes de cualquier entorno que no sea local.
 */
const DEMO_PASSWORD = "demo1234";

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
    const admin = await ensureUser(ctx, DEMO_ADMIN.email, DEMO_ADMIN.name, "admin");
    const driverUser = await ensureUser(ctx, DEMO_DRIVER.email, DEMO_DRIVER.name, "driver");
    const client = await ensureUser(ctx, DEMO_CLIENT.email, DEMO_CLIENT.name, "client");

    const driver = await ensureDriver(ctx, driverUser._id);

    const existingServices = await ctx.db
      .query("services")
      .withIndex("by_client", (q) => q.eq("clientId", client._id))
      .collect();

    let serviceId: Id<"services"> | null = null;
    if (existingServices.length === 0) {
      const totalPrice = 480;
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
        totalPrice,
        driverCommission: computeDriverCommission(totalPrice),
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
    // Asegura el rol esperado aunque la cuenta ya existiera.
    if (existing.role !== role) {
      await ctx.db.patch(existing._id, { role });
    }
    return (await ctx.db.get(existing._id)) as Doc<"users">;
  }

  await createAccount(ctx, {
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
  });
  return (await ctx.db.get(driverId)) as Doc<"drivers">;
}
