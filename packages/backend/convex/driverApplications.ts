import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { normalizeCountryCode } from "./data/countryCatalog";
import { driverApplicationStatusValidator, sexValidator } from "./schema";
import { requireFullAdmin, requireStaff, requireUser } from "./lib/auth";
import { getAccessContext, originMatchesDistrictScopes } from "./lib/adminAccess";
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

function validateOperatingRegion(args: {
  countryCode: string;
  department: string;
  province: string;
  district: string;
}) {
  const countryCode = normalizeCountryCode(args.countryCode);
  const department = args.department.trim();
  const province = args.province.trim();
  const district = args.district.trim();
  if (department === "") {
    throw new Error("Selecciona tu departamento (nivel 1).");
  }
  if (province === "") {
    throw new Error("Selecciona tu provincia (nivel 2).");
  }
  if (district === "") {
    throw new Error("Selecciona tu distrito (nivel 3).");
  }
  return { countryCode, department, province, district };
}

/** Envía solicitud de registro como chofer (queda pendiente de validación admin). */
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
    conductorRecordPdfId: v.id("_storage"),
    countryCode: v.string(),
    department: v.string(),
    province: v.string(),
    district: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const region = validateOperatingRegion(args);

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

    return await ctx.db.insert("driverApplications", {
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
      conductorRecordPdfId: args.conductorRecordPdfId,
      countryCode: region.countryCode,
      department: region.department,
      province: region.province,
      district: region.district,
      status: "pending",
      submittedAt: Date.now(),
    });
  },
});

async function createDriverFromApplication(
  ctx: MutationCtx,
  application: Doc<"driverApplications">,
): Promise<Id<"drivers">> {
  const fullName =
    `${application.firstLastName} ${application.secondLastName} ${application.firstName}`.trim();

  const driverId = await ctx.db.insert("drivers", {
    userId: application.userId,
    status: "offline",
    vehicle: {
      make: "Por completar",
      model: "Por completar",
      plate: "PENDIENTE",
      year: new Date().getFullYear(),
    },
    licenseNumber: application.licenseNumber,
    licenseExpiry: Date.now() + 365 * 24 * 60 * 60 * 1000,
    rating: 5,
    totalTrips: 0,
    fullName,
    dni: application.dni,
    countryCode: application.countryCode ?? "PE",
    department: application.department ?? "",
    province: application.province ?? "",
    district: application.district ?? "",
  });
  await ensureWallet(ctx, driverId);
  await ctx.db.patch(application.userId, { name: fullName });
  return driverId;
}

/** Aprueba una solicitud y crea el perfil de chofer. */
export const approve = mutation({
  args: {
    applicationId: v.id("driverApplications"),
  },
  handler: async (ctx, args) => {
    await requireFullAdmin(ctx);
    const application = await ctx.db.get(args.applicationId);
    if (application === null) {
      throw new Error("Solicitud no encontrada.");
    }
    if (application.status !== "pending") {
      throw new Error("Solo se pueden aprobar solicitudes pendientes.");
    }

    const existingDriver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", application.userId))
      .unique();
    if (existingDriver !== null) {
      throw new Error("Este usuario ya tiene perfil de chofer.");
    }

    const driverId = await createDriverFromApplication(ctx, application);
    await ctx.db.patch(application._id, {
      status: "approved",
      reviewedAt: Date.now(),
    });
    return { applicationId: application._id, driverId };
  },
});

/** Rechaza una solicitud de registro. */
export const reject = mutation({
  args: {
    applicationId: v.id("driverApplications"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireFullAdmin(ctx);
    const application = await ctx.db.get(args.applicationId);
    if (application === null) {
      throw new Error("Solicitud no encontrada.");
    }
    if (application.status !== "pending") {
      throw new Error("Solo se pueden rechazar solicitudes pendientes.");
    }
    await ctx.db.patch(application._id, {
      status: "rejected",
      reviewedAt: Date.now(),
    });
    return application._id;
  },
});

/** Lista solicitudes pendientes (panel admin). */
export const listPending = query({
  args: {},
  handler: async (ctx) => {
    await requireFullAdmin(ctx);
    return await ctx.db
      .query("driverApplications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();
  },
});

/**
 * Expedientes de registro de choferes para evaluación en panel admin.
 * Incluye URLs temporales de fotos del brevete, PDF del CUL y PDF del récord MTC.
 */
export const listForAdmin = query({
  args: {
    status: v.optional(driverApplicationStatusValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireStaff(ctx);
    const access = await getAccessContext(ctx, user);
    let applications = await ctx.db
      .query("driverApplications")
      .order("desc")
      .collect();

    if (!access.isFullAdmin) {
      applications = applications.filter((application) =>
        originMatchesDistrictScopes(application, access.districtScopes),
      );
    }

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
        const conductorRecordPdfUrl =
          application.conductorRecordPdfId !== undefined
            ? await ctx.storage.getUrl(application.conductorRecordPdfId)
            : null;

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
          conductorRecordPdfUrl,
        };
      }),
    );
  },
});
