import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { driverApplicationStatusValidator, sexValidator } from "./schema";
import { requireRole, requireUser } from "./lib/auth";
import { ensureWallet } from "./driverWallets";

/** URL temporal para subir archivos (fotos brevete, CUL PDF). */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Solicitud de registro del usuario autenticado (si existe). */
export const getMyApplication = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("driverApplications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
  },
});

/** Envía solicitud de registro como chofer. */
export const submit = mutation({
  args: {
    dni: v.string(),
    firstName: v.string(),
    firstLastName: v.string(),
    secondLastName: v.string(),
    sex: sexValidator,
    licenseNumber: v.string(),
    licenseCategory: v.string(),
    licensePhotoIds: v.array(v.id("_storage")),
    culPdfId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const existingDriver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (existingDriver !== null) {
      throw new Error("Ya tienes un perfil de chofer activo.");
    }

    const pending = await ctx.db
      .query("driverApplications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
    if (pending !== null) {
      throw new Error("Ya tienes una solicitud en revisión.");
    }

    const dni = args.dni.trim();
    if (!/^\d{8}$/.test(dni)) {
      throw new Error("DNI inválido.");
    }
    if (args.licensePhotoIds.length === 0) {
      throw new Error("Sube al menos una foto del brevete.");
    }

    const dniTaken = await ctx.db
      .query("driverApplications")
      .withIndex("by_dni", (q) => q.eq("dni", dni))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "approved"),
        ),
      )
      .first();
    if (dniTaken !== null && dniTaken.userId !== user._id) {
      throw new Error("Este DNI ya tiene una solicitud registrada.");
    }

    const applicationId = await ctx.db.insert("driverApplications", {
      userId: user._id,
      dni,
      firstName: args.firstName.trim(),
      firstLastName: args.firstLastName.trim(),
      secondLastName: args.secondLastName.trim(),
      sex: args.sex,
      licenseNumber: args.licenseNumber.trim(),
      licenseCategory: args.licenseCategory,
      licensePhotoIds: args.licensePhotoIds,
      culPdfId: args.culPdfId,
      status: "approved",
      submittedAt: Date.now(),
      reviewedAt: Date.now(),
    });

    const fullName = `${args.firstLastName} ${args.secondLastName} ${args.firstName}`.trim();

    const driverId = await ctx.db.insert("drivers", {
      userId: user._id,
      status: "offline",
      vehicle: {
        make: "Por completar",
        model: "Por completar",
        plate: "PENDIENTE",
        year: new Date().getFullYear(),
      },
      licenseNumber: args.licenseNumber.trim(),
      licenseExpiry: Date.now() + 365 * 24 * 60 * 60 * 1000,
      rating: 5,
      totalTrips: 0,
    });
    await ensureWallet(ctx, driverId);

    await ctx.db.patch(user._id, { name: fullName });
    // Mantener rol "client" si ya lo era: pasajero y chofer en la misma cuenta.

    return applicationId;
  },
});

/** Lista solicitudes pendientes (panel admin). */
export const listPending = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    return await ctx.db
      .query("driverApplications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();
  },
});

/**
 * Expedientes de registro de choferes para evaluación en panel admin.
 * Incluye URLs temporales de fotos del brevete y PDF del CUL.
 */
export const listForAdmin = query({
  args: {
    status: v.optional(driverApplicationStatusValidator),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    let applications = await ctx.db
      .query("driverApplications")
      .order("desc")
      .collect();

    if (args.status !== undefined) {
      applications = applications.filter(
        (application) => application.status === args.status,
      );
    }

    return await Promise.all(
      applications.map(async (application) => {
        const user = await ctx.db.get(application.userId);
        const driver = await ctx.db
          .query("drivers")
          .withIndex("by_user", (q) => q.eq("userId", application.userId))
          .unique();

        const licensePhotoUrls = (
          await Promise.all(
            application.licensePhotoIds.map((storageId) =>
              ctx.storage.getUrl(storageId),
            ),
          )
        ).filter((url): url is string => url !== null);

        const culPdfUrl = await ctx.storage.getUrl(application.culPdfId);

        return {
          ...application,
          fullName: `${application.firstLastName} ${application.secondLastName} ${application.firstName}`.trim(),
          userName: user?.name ?? null,
          userEmail: user?.email ?? null,
          userPhone: user?.phone ?? null,
          userRole: user?.role ?? null,
          driverId: driver?._id ?? null,
          driverPlate: driver?.vehicle.plate ?? null,
          driverStatus: driver?.status ?? null,
          licensePhotoUrls,
          culPdfUrl,
        };
      }),
    );
  },
});
