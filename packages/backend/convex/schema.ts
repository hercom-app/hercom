import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { driverTopUpPackageIdValidator } from "./lib/driverTopUpPackages";

/**
 * Validadores reutilizables para los "enums" del dominio.
 * Se exportan para reutilizarlos en los args de las funciones (queries/mutations).
 */
export const userRoleValidator = v.union(
  v.literal("client"),
  v.literal("driver"),
  v.literal("admin"),
  v.literal("superadmin"),
  /** Recursos humanos: solo expedientes de choferes (sin viajes ni ingresos). */
  v.literal("hr"),
);

export const districtScopeValidator = v.object({
  countryCode: v.string(),
  department: v.string(),
  province: v.string(),
  district: v.string(),
});

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
  /** Expiró el TTL (2 h) sin chofer; distinto de cancelación por usuario. */
  v.literal("unattended"),
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
  v.literal("trip_debit"),
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

/** Motivo cuando status = cancelled (no aplica a status = unattended). */
export const serviceClosureReasonValidator = v.union(
  v.literal("cancelled_by_client"),
  v.literal("cancelled_by_staff"),
  /** Legacy: antes se guardaba cancelled + este motivo. */
  v.literal("unattended"),
);

export const notificationTypeValidator = v.union(
  v.literal("offer_received"),
  v.literal("trip_confirmed_driver"),
  v.literal("trip_confirmed_client"),
  v.literal("driver_heading_pickup"),
  v.literal("driver_arrived_pickup"),
  v.literal("advance_confirmed"),
  v.literal("trip_route_updated"),
  v.literal("trip_extended"),
  v.literal("support_reply"),
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
  /** ISO 3166-1 alpha-2 (ej. PE). Default PE si no se envía. */
  countryCode: v.optional(v.string()),
  /** Nivel 1: departamento (PE), estado, etc. */
  department: v.optional(v.string()),
  /** Nivel 2: provincia (PE), municipio, etc. */
  province: v.optional(v.string()),
  /** Nivel 3: distrito (PE), comuna, etc. */
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
    /** Token Expo Push para notificaciones del sistema. */
    expoPushToken: v.optional(v.string()),
    /** Identidad declarada (DNI y nombres). RENIEC se verifica en el panel interno. */
    dni: v.optional(v.string()),
    firstName: v.optional(v.string()),
    firstLastName: v.optional(v.string()),
    secondLastName: v.optional(v.string()),
    /** Selfie de identidad del cliente (obligatoria para pedir servicio). */
    selfieStorageId: v.optional(v.id("_storage")),
    identityVerifiedAt: v.optional(v.number()),
    /** Años manejando (declarado en inscripción chofer). */
    yearsDrivingExperience: v.optional(v.number()),
    /** Consultas RENIEC desde app chofer (máx. 2, luego bloqueo 8 h). */
    reniecDriverLookupCount: v.optional(v.number()),
    reniecDriverLookupBlockedUntil: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_dni", ["dni"]),

  /**
   * Zonas asignadas a un admin operativo.
   * Distrito vacío = toda la provincia. Un admin puede mezclar provincias.
   */
  adminDistrictScopes: defineTable({
    userId: v.id("users"),
    countryCode: v.string(),
    department: v.string(),
    province: v.string(),
    district: v.string(),
  }).index("by_user", ["userId"]),

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
    yearsDrivingExperience: v.optional(v.number()),
    yape: v.optional(v.string()),
    plin: v.optional(v.string()),
    bankAccount1: v.optional(v.string()),
    bankAccount2: v.optional(v.string()),
    bankAccount3: v.optional(v.string()),
    /** Zona de operación del chofer (país + niveles 1/2/3). */
    countryCode: v.optional(v.string()),
    department: v.optional(v.string()),
    province: v.optional(v.string()),
    district: v.optional(v.string()),
    /** Última ubicación reportada (ofertas / disponibilidad). */
    lastLat: v.optional(v.number()),
    lastLng: v.optional(v.number()),
    lastLocationAt: v.optional(v.number()),
    /** Radio de búsqueda elegido por el chofer (km); tope = máximo del mercado. */
    offerRadiusKm: v.optional(v.number()),
    /** N.° licencia de armas (vacío = no declara). */
    firearmsLicenseNumber: v.optional(v.string()),
    additionalLanguage1: v.optional(v.string()),
    additionalLanguage2: v.optional(v.string()),
    additionalLanguage3: v.optional(v.string()),
    additionalLanguage4: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  /**
   * Solicitudes de registro de chofer (identidad declarada + brevete + documentos).
   */
  driverApplications: defineTable({
    userId: v.id("users"),
    dni: v.string(),
    firstName: v.string(),
    firstLastName: v.string(),
    secondLastName: v.string(),
    sex: sexValidator,
    /** Fecha de nacimiento ISO `YYYY-MM-DD`. Ausente en solicitudes antiguas. */
    birthDate: v.optional(v.string()),
    licenseNumber: v.string(),
    licenseCategory: v.string(),
    /** Años de experiencia manejando (declarado por el postulante). */
    drivingExperienceYears: v.optional(v.number()),
    licenseFormat: v.optional(
      v.union(v.literal("physical"), v.literal("digital")),
    ),
    licensePhotoIds: v.array(v.id("_storage")),
    licensePdfId: v.optional(v.id("_storage")),
    /** Vehículo habitual: auto o camioneta (checklist de registro). */
    vehicleBodyType: v.optional(
      v.union(v.literal("auto"), v.literal("camioneta")),
    ),
    /** PDF del CUL (Certificado Único Laboral, MTPE). */
    culPdfId: v.id("_storage"),
    /** PDF del récord de conductor (MTC). Ausente en solicitudes antiguas. */
    conductorRecordPdfId: v.optional(v.id("_storage")),
    countryCode: v.optional(v.string()),
    department: v.optional(v.string()),
    province: v.optional(v.string()),
    district: v.optional(v.string()),
    status: driverApplicationStatusValidator,
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    /** Firma digital (casilla) de autorización de datos personales. */
    personalDataConsentAt: v.optional(v.number()),
    personalDataConsentText: v.optional(v.string()),
    /** Nombres ingresados a mano porque la consulta DNI (Factiliza) no estaba disponible. */
    reniecManualEntry: v.optional(v.boolean()),
    firearmsLicenseNumber: v.optional(v.string()),
    additionalLanguage1: v.optional(v.string()),
    additionalLanguage2: v.optional(v.string()),
    additionalLanguage3: v.optional(v.string()),
    additionalLanguage4: v.optional(v.string()),
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
    /** true = el viaje es para quien lo pide. false = para otra persona. Ausente = para el titular. */
    forSelf: v.optional(v.boolean()),
    /** Nombre de quien usa el servicio (el cliente o la otra persona). */
    passengerName: v.optional(v.string()),
    /** Teléfono de quien usa el servicio. */
    passengerPhone: v.optional(v.string()),
    requestedAt: v.number(),
    assignedAt: v.optional(v.number()),
    headingToPickupAt: v.optional(v.number()),
    arrivedPickupAt: v.optional(v.number()),
    departedWithClientAt: v.optional(v.number()),
    arrivedDestinationAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    closureReason: v.optional(serviceClosureReasonValidator),
    /** Horas contratadas (mín. mercado; crece con extensiones). */
    serviceHours: v.optional(v.number()),
    /** Tarifa horaria al crear/aceptar oferta (para comisión por tramos). */
    hourlyRateSnapshot: v.optional(v.number()),
    /** Fin del tiempo contratado (ms); se fija al iniciar viaje con cliente. */
    serviceEndsAt: v.optional(v.number()),
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
   * Viajes prepagados del chofer (recargas por paquete).
   */
  driverWallets: defineTable({
    driverId: v.id("drivers"),
    tripCredits: v.number(),
    updatedAt: v.number(),
  }).index("by_driver", ["driverId"]),

  /**
   * Historial de movimientos de viajes del chofer (incluye recargas).
   * - `top_up`: recarga de paquete; `tripsPurchased` y `amount` = viajes acreditados;
   *   `packageId` + `pricePenPaid` identifican el paquete (30→1, 50→2, 100→5).
   * - `trip_debit`: consumo al cerrar un viaje; `amount` = 1.
   */
  walletTransactions: defineTable({
    driverId: v.id("drivers"),
    type: walletTransactionTypeValidator,
    /** Viajes del movimiento (+ recarga o − consumo). */
    amount: v.number(),
    /** Solo recargas: viajes adquiridos con el paquete (igual que `amount` en top_up). */
    tripsPurchased: v.optional(v.number()),
    packageId: v.optional(driverTopUpPackageIdValidator),
    pricePenPaid: v.optional(v.number()),
    tripsAfter: v.number(),
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
   * Configuración comercial por país (moneda local y tipo de cambio a USD).
   */
  markets: defineTable({
    countryCode: v.string(),
    name: v.string(),
    currencyCode: v.string(),
    currencySymbol: v.string(),
    /** Moneda local por 1 USD (ej. 3.75 PEN/USD). */
    usdExchangeRate: v.number(),
    hourlyRate: v.number(),
    minServiceHours: v.number(),
    commissionRate: v.number(),
    /** Comisión desde la 3.ª hora (default 15%). */
    commissionRateFromHour3: v.optional(v.number()),
    /** Comisión desde la 8.ª hora (default 10%). */
    commissionRateFromHour8: v.optional(v.number()),
    commissionFromHour3: v.optional(v.number()),
    commissionFromHour8: v.optional(v.number()),
    /** Tope de recargo del chofer sobre tarifa base (0.5 = +50%). */
    maxDriverMarkupOverBase: v.optional(v.number()),
    /** Radio máximo (km) origen del servicio ↔ chofer para ofertar. */
    maxDriverOfferDistanceKm: v.optional(v.number()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_country", ["countryCode"]),

  /**
   * Topes de oferta del chofer por distrito (anti-estafa).
   */
  districtPricingRules: defineTable({
    countryCode: v.string(),
    department: v.string(),
    province: v.optional(v.string()),
    district: v.optional(v.string()),
    maxDriverOfferPrice: v.optional(v.number()),
    maxDriverMarkupOverBase: v.optional(v.number()),
    active: v.boolean(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }).index("by_country_department", ["countryCode", "department"]),

  /**
   * Promociones festivas por región (país + niveles 1/2/3).
   */
  promotions: defineTable({
    name: v.string(),
    festivityLabel: v.optional(v.string()),
    /** ISO 3166-1 alpha-2; registros antiguos sin campo se tratan como PE. */
    countryCode: v.optional(v.string()),
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
    .index("by_country", ["countryCode"])
    .index("by_department", ["department"]),

  /**
   * Ubicación en vivo + rastro del chofer para «compartir viaje».
   * Un documento por servicio; el shareToken permite ver sin ser el cliente.
   */
  serviceTracking: defineTable({
    serviceId: v.id("services"),
    shareToken: v.string(),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    heading: v.optional(v.number()),
    speed: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    trail: v.array(
      v.object({
        lat: v.number(),
        lng: v.number(),
        t: v.number(),
      }),
    ),
    createdAt: v.number(),
  })
    .index("by_service", ["serviceId"])
    .index("by_share_token", ["shareToken"]),

  /**
   * Hilo de mensajería interna entre un usuario de la app y operaciones.
   * Un documento por usuario.
   */
  supportThreads: defineTable({
    userId: v.id("users"),
    lastMessageAt: v.number(),
    lastMessagePreview: v.string(),
    unreadForAdmin: v.number(),
    unreadForUser: v.number(),
    status: v.union(v.literal("open"), v.literal("closed")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_last_message", ["lastMessageAt"]),

  /**
   * Mensajes del hilo de soporte.
   */
  supportMessages: defineTable({
    threadId: v.id("supportThreads"),
    authorId: v.id("users"),
    authorRole: v.union(v.literal("user"), v.literal("staff")),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_thread", ["threadId", "createdAt"]),

  /**
   * Errores del panel interno. La consola del navegador + Convex Logs
   * también los muestran; esta tabla los deja persistidos.
   */
  adminLogs: defineTable({
    actorId: v.optional(v.id("users")),
    action: v.string(),
    level: v.union(v.literal("info"), v.literal("error")),
    message: v.string(),
    detail: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),
});
