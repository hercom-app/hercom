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
  v.literal("heading_to_pickup"),
  v.literal("arrived_pickup"),
  v.literal("in_progress"),
  v.literal("arrived_destination"),
  // Legacy status kept for backward compatibility.
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

export const walletTransactionTypeValidator = v.union(
  v.literal("top_up"),
  v.literal("commission_debit"),
);

export const serviceOfferStatusValidator = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("rejected"),
);

/** Tipo comercial del servicio: app (autoservicio) o premium (gestionado). */
export const serviceTypeValidator = v.union(
  v.literal("app"),
  v.literal("premium"),
);

/** Canal por el que se registró la solicitud. */
export const serviceRequestChannelValidator = v.union(
  v.literal("mobile_app"),
  v.literal("web_comercial"),
  v.literal("phone"),
);

export const notificationTypeValidator = v.union(
  v.literal("offer_received"),
  v.literal("trip_confirmed_driver"),
  v.literal("trip_confirmed_client"),
  v.literal("driver_heading_pickup"),
  v.literal("driver_arrived_pickup"),
  v.literal("advance_confirmed"),
  v.literal("trip_route_updated"),
);

export const checklistPhaseValidator = v.union(
  v.literal("pickup"),
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
  department: v.optional(v.string()),
  province: v.optional(v.string()),
  district: v.optional(v.string()),
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
    // Datos de cobro (anticipo 25% del cliente → chofer).
    fullName: v.optional(v.string()),
    dni: v.optional(v.string()),
    yape: v.optional(v.string()),
    plin: v.optional(v.string()),
    bankAccount1: v.optional(v.string()),
    bankAccount2: v.optional(v.string()),
    bankAccount3: v.optional(v.string()),
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
    extraDestinations: v.optional(v.array(locationValidator)),
    // Índice de parada activa durante el viaje (0 = destino principal).
    currentStopIndex: v.optional(v.number()),
    // Tarifa base solicitada por el cliente (mín. S/80 = S/40/h × 2h).
    basePrice: v.number(),
    // Tarifa de lista antes de descuento festivo (si aplica promoción).
    catalogBasePrice: v.optional(v.number()),
    discountRate: v.optional(v.number()),
    promotionId: v.optional(v.id("promotions")),
    promotionName: v.optional(v.string()),
    // Tarifa ofertada por el chofer y aceptada por el cliente.
    offeredPrice: v.optional(v.number()),
    // Código de seguridad compartido (cliente/chofer) para iniciar viaje.
    securityCode: v.optional(v.string()),
    totalPrice: v.number(),
    // Comisión de plataforma (intermediación) descontada del saldo del chofer.
    driverCommission: v.number(),
    // Adelanto del 25% sobre tarifa ofertada; el cliente lo paga al chofer antes de salir.
    advanceAmount: v.optional(v.number()),
    advanceConfirmedAt: v.optional(v.number()),
    // Clasificación del viaje para operación y tablero admin.
    serviceType: v.optional(serviceTypeValidator),
    requestChannel: v.optional(serviceRequestChannelValidator),
    status: serviceStatusValidator,
    notes: v.optional(v.string()),
    requestedAt: v.number(),
    assignedAt: v.optional(v.number()),
    headingToPickupAt: v.optional(v.number()),
    arrivedPickupAt: v.optional(v.number()),
    departedWithClientAt: v.optional(v.number()),
    arrivedDestinationAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
  })
    .index("by_client", ["clientId"])
    .index("by_driver", ["driverId"])
    .index("by_status", ["status"])
    .index("by_driver_status", ["driverId", "status"])
    .index("by_service_type", ["serviceType"]),

  /**
   * Ofertas de choferes sobre servicios pendientes (flujo tipo inDriver).
   */
  serviceOffers: defineTable({
    serviceId: v.id("services"),
    driverId: v.id("drivers"),
    offeredPrice: v.number(),
    status: serviceOfferStatusValidator,
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_service", ["serviceId"])
    .index("by_driver", ["driverId"])
    .index("by_service_status", ["serviceId", "status"])
    .index("by_service_driver", ["serviceId", "driverId"]),

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

  /**
   * Saldo virtual del chofer para demo de recargas (modelo Yango/InDriver).
   */
  driverWallets: defineTable({
    driverId: v.id("drivers"),
    balance: v.number(),
    updatedAt: v.number(),
  }).index("by_driver", ["driverId"]),

  /**
   * Historial de movimientos del saldo del chofer.
   * `amount` es siempre positivo; el sentido lo define `type`.
   */
  walletTransactions: defineTable({
    driverId: v.id("drivers"),
    type: walletTransactionTypeValidator,
    amount: v.number(),
    balanceAfter: v.number(),
    serviceId: v.optional(v.id("services")),
    createdByUserId: v.optional(v.id("users")),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_driver", ["driverId"])
    .index("by_driver_created", ["driverId", "createdAt"])
    .index("by_type_created", ["type", "createdAt"])
    .index("by_service", ["serviceId"]),

  /**
   * Notificaciones in-app para cliente y chofer.
   */
  notifications: defineTable({
    userId: v.id("users"),
    type: notificationTypeValidator,
    title: v.string(),
    message: v.string(),
    serviceId: v.optional(v.id("services")),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"]),

  /**
   * Checklist de vehiculo/documentos al recoger al cliente.
   * damageMarks: puntos 0–1 sobre canvas (anterior / posterior / lateral).
   */
  serviceVehicleChecklists: defineTable({
    serviceId: v.id("services"),
    driverId: v.id("drivers"),
    phase: checklistPhaseValidator,
    hasVehicleDamage: v.boolean(),
    damageNotes: v.optional(v.string()),
    damageMarks: v.optional(
      v.array(
        v.object({
          view: v.union(
            v.literal("front"),
            v.literal("rear"),
            v.literal("side"),
            v.literal("diagram"),
          ),
          x: v.number(),
          y: v.number(),
        }),
      ),
    ),
    hasPropertyCard: v.boolean(),
    hasSoat: v.boolean(),
    hasTechnicalInspection: v.optional(v.boolean()),
    vehicleMake: v.optional(v.string()),
    vehicleModel: v.optional(v.string()),
    vehicleYear: v.optional(v.number()),
    hasInsurance: v.optional(v.boolean()),
    insuranceNotes: v.optional(v.string()),
    checkedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_service", ["serviceId"])
    .index("by_driver", ["driverId"]),

  /**
   * Valoración del cliente al chofer al finalizar el viaje (1–5 estrellas).
   */
  serviceRatings: defineTable({
    serviceId: v.id("services"),
    clientId: v.id("users"),
    driverId: v.id("drivers"),
    score: v.number(),
    comment: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_service", ["serviceId"])
    .index("by_driver", ["driverId"])
    .index("by_client", ["clientId"]),

  /**
   * Promociones festivas por región (departamento / provincia / distrito).
   */
  promotions: defineTable({
    name: v.string(),
    festivityLabel: v.optional(v.string()),
    department: v.string(),
    province: v.optional(v.string()),
    district: v.optional(v.string()),
    discountRate: v.number(),
    startsAt: v.number(),
    endsAt: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_active", ["active"])
    .index("by_department", ["department"]),
});
