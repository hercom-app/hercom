import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/**
 * Validadores reutilizables para los "enums" del dominio.
 * Se exportan para reutilizarlos en los args de las funciones (queries/mutations).
 */
export const userRoleValidator = v.union(
  v.literal("client"),
  v.literal("driver"),
  v.literal("admin"),
);

export const driverStatusValidator = v.union(
  v.literal("available"),
  v.literal("busy"),
  v.literal("offline"),
);

export const serviceStatusValidator = v.union(
  v.literal("pending"),
  v.literal("assigned"),
  v.literal("en_route"),
  v.literal("finished"),
  v.literal("cancelled"),
);

export const paymentStatusValidator = v.union(
  v.literal("pending"),
  v.literal("paid"),
);

export const payoutStatusValidator = v.union(
  v.literal("pending"),
  v.literal("paid"),
);

export const sexValidator = v.union(v.literal("M"), v.literal("F"));

export const driverApplicationStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
);

export const locationValidator = v.object({
  address: v.string(),
  lat: v.number(),
  lng: v.number(),
});

export default defineSchema({
  // Tablas internas de Convex Auth (sessions, accounts, verificaciones, etc.).
  ...authTables,

  /**
   * Clientes y administradores. Sobrescribe la tabla `users` por defecto de
   * Convex Auth para añadir `role` y `phone`. Los campos de auth deben
   * permanecer opcionales tal como los espera el provider.
   */
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: userRoleValidator,
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  /**
   * Choferes. Cada chofer está ligado 1:1 a un `user`.
   */
  drivers: defineTable({
    userId: v.id("users"),
    status: driverStatusValidator,
    vehicle: v.object({
      make: v.string(),
      model: v.string(),
      plate: v.string(),
      year: v.number(),
      color: v.optional(v.string()),
    }),
    licenseNumber: v.string(),
    licenseExpiry: v.number(),
    rating: v.number(),
    totalTrips: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  /**
   * Solicitudes de registro de chofer (RENIEC + brevete + documentos).
   */
  driverApplications: defineTable({
    userId: v.id("users"),
    dni: v.string(),
    firstName: v.string(),
    firstLastName: v.string(),
    secondLastName: v.string(),
    sex: sexValidator,
    licenseNumber: v.string(),
    licenseCategory: v.string(),
    licensePhotoIds: v.array(v.id("_storage")),
    culPdfId: v.id("_storage"),
    status: driverApplicationStatusValidator,
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_dni", ["dni"])
    .index("by_status", ["status"]),

  /**
   * Solicitudes de viaje (servicios de chofer).
   */
  services: defineTable({
    clientId: v.id("users"),
    driverId: v.optional(v.id("drivers")),
    origin: locationValidator,
    destination: locationValidator,
    totalPrice: v.number(),
    driverCommission: v.number(),
    status: serviceStatusValidator,
    notes: v.optional(v.string()),
    requestedAt: v.number(),
    assignedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
  })
    .index("by_client", ["clientId"])
    .index("by_driver", ["driverId"])
    .index("by_status", ["status"])
    .index("by_driver_status", ["driverId", "status"]),

  /**
   * Historial de pagos de los clientes (uno por servicio).
   */
  payments: defineTable({
    serviceId: v.id("services"),
    clientId: v.id("users"),
    amount: v.number(),
    method: v.optional(v.string()),
    status: paymentStatusValidator,
    paidAt: v.optional(v.number()),
  })
    .index("by_service", ["serviceId"])
    .index("by_client", ["clientId"])
    .index("by_status", ["status"]),

  /**
   * Control de comisiones acumuladas y liquidadas por chofer.
   */
  payouts: defineTable({
    driverId: v.id("drivers"),
    accumulatedAmount: v.number(),
    paidAmount: v.number(),
    status: payoutStatusValidator,
    periodStart: v.optional(v.number()),
    periodEnd: v.optional(v.number()),
    paidAt: v.optional(v.number()),
  })
    .index("by_driver", ["driverId"])
    .index("by_status", ["status"])
    .index("by_driver_status", ["driverId", "status"]),
});
