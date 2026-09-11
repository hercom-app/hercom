import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { normalizeCountryCode } from "./data/countryCatalog";
import { driverApplicationStatusValidator, sexValidator } from "./schema";
import { getCurrentUser, requireStaff, requireStaffForRegion, requireUser } from "./lib/auth";
import { assertDniAvailable } from "./lib/identity";
import { getAccessContext, originMatchesDistrictScopes } from "./lib/adminAccess";
import { ensureWallet } from "./driverWallets";
import { requireAdultBirthDate } from "./lib/age";

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
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return null;
    }
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
    birthDate: v.string(),
    licenseNumber: v.string(),
    licenseCategory: v.string(),
    licenseFormat: v.optional(
      v.union(v.literal("physical"), v.literal("digital")),
    ),
    licensePhotoIds: v.array(v.id("_storage")),
    licensePdfId: v.optional(v.id("_storage")),
    vehicleBodyType: v.union(v.literal("auto"), v.literal("camioneta")),
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
      const existingApp = await ctx.db
        .query("driverApplications")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .first();
      console.log("driverApplications.submit: ya es chofer, no reenviar", {
        userId: user._id,
        applicationId: existingApp?._id,
      });
      return existingApp?._id ?? null;
    }

    const pending = await ctx.db
      .query("driverApplications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
    if (pending !== null) {
      console.log("driverApplications.submit: solicitud ya en revisión", {
        userId: user._id,
        applicationId: pending._id,
      });
      return pending._id;
    }

    const dni = args.dni.trim();
    if (!/^\d{8}$/.test(dni)) {
      throw new Error("DNI inválido.");
    }
    const licenseFormat = args.licenseFormat ?? "physical";
    if (licenseFormat === "digital") {
      const hasDigitalFile =
        args.licensePdfId !== undefined || args.licensePhotoIds.length >= 2;
      if (!hasDigitalFile) {
        throw new Error(
          "Sube el brevete digital (PDF o imagen) y la selfie con el documento.",
        );
      }
      if (args.licensePhotoIds.length < 1) {
        throw new Error("Sube la selfie sosteniendo el brevete impreso.");
      }
    } else if (args.licensePhotoIds.length < 3) {
      throw new Error(
        "Sube las 3 fotos del brevete físico: anverso, reverso y selfie con el documento.",
      );
    }

    await assertDniAvailable(ctx, dni, user._id);

    const firstName = args.firstName.trim();
    const firstLastName = args.firstLastName.trim();
    const secondLastName = args.secondLastName.trim();
    const birthDate = requireAdultBirthDate(args.birthDate);
    const fullName = `${firstLastName} ${secondLastName} ${firstName}`.trim();

    await ctx.db.patch(user._id, {
      dni,
      firstName,
      firstLastName,
      secondLastName,
      name: fullName,
    });

    return await ctx.db.insert("driverApplications", {
      userId: user._id,
      dni,
      firstName,
      firstLastName,
      secondLastName,
      sex: args.sex,
      birthDate,
      licenseNumber: args.licenseNumber.trim(),
      licenseCategory: args.licenseCategory,
      licenseFormat,
      licensePhotoIds: args.licensePhotoIds,
      ...(args.licensePdfId !== undefined
        ? { licensePdfId: args.licensePdfId }
        : {}),
      vehicleBodyType: args.vehicleBodyType,
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
  await ctx.db.patch(application.userId, {
    name: fullName,
    dni: application.dni,
    firstName: application.firstName,
    firstLastName: application.firstLastName,
    secondLastName: application.secondLastName,
  });
  return driverId;
}

/** Aprueba una solicitud y crea el perfil de chofer. */
export const approve = mutation({
  args: {
    applicationId: v.id("driverApplications"),
  },
  handler: async (ctx, args) => {
    const application = await ctx.db.get(args.applicationId);
    if (application === null) {
      console.error("driverApplications.approve: solicitud no encontrada", args.applicationId);
      throw new Error("Solicitud no encontrada.");
    }
    try {
      await requireStaffForRegion(ctx, application);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("driverApplications.approve: no autorizado", {
        applicationId: args.applicationId,
        message,
      });
      throw error;
    }
    if (application.status !== "pending") {
      console.error("driverApplications.approve: estado inválido", {
        applicationId: args.applicationId,
        status: application.status,
      });
      throw new Error("Solo se pueden aprobar solicitudes pendientes.");
    }

    const existingDriver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", application.userId))
      .unique();
    if (existingDriver !== null) {
      console.error("driverApplications.approve: ya tiene perfil", {
        applicationId: args.applicationId,
        userId: application.userId,
      });
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
    const application = await ctx.db.get(args.applicationId);
    if (application === null) {
      console.error("driverApplications.reject: solicitud no encontrada", args.applicationId);
      throw new Error("Solicitud no encontrada.");
    }
    try {
      await requireStaffForRegion(ctx, application);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("driverApplications.reject: no autorizado", {
        applicationId: args.applicationId,
        message,
      });
      throw error;
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
    const user = await requireStaff(ctx);
    const access = await getAccessContext(ctx, user);
    let applications = await ctx.db
      .query("driverApplications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();
    if (!access.isFullAdmin) {
      applications = applications.filter((application) =>
        originMatchesDistrictScopes(application, access.districtScopes),
      );
    }
    return applications;
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
        const licensePdfUrl =
          application.licensePdfId !== undefined
            ? await ctx.storage.getUrl(application.licensePdfId)
            : null;
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
          licensePdfUrl,
          culPdfUrl,
          conductorRecordPdfUrl,
        };
      }),
    );
  },
});
