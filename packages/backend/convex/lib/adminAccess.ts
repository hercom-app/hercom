import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { normalizeCountryCode } from "../data/countryCatalog";
import type { GeoRegion } from "./regionFilters";
import { resolveCountryCode } from "./regionFilters";

export type DistrictScope = {
  countryCode: string;
  department: string;
  province: string;
  district: string;
};

export function isStaffRole(role: Doc<"users">["role"]): boolean {
  return role === "admin" || role === "superadmin";
}

export function isFullAdmin(
  user: Pick<Doc<"users">, "role">,
  scopes: DistrictScope[],
): boolean {
  if (user.role === "superadmin") {
    return true;
  }
  // Dueños existentes: admin sin distritos asignados conserva acceso total.
  return user.role === "admin" && scopes.length === 0;
}

export function districtScopeKey(scope: DistrictScope): string {
  return [
    normalizeCountryCode(scope.countryCode),
    scope.department.trim(),
    scope.province.trim(),
    scope.district.trim(),
  ].join("|");
}

export function originMatchesDistrictScopes(
  origin: GeoRegion,
  scopes: DistrictScope[],
): boolean {
  if (scopes.length === 0) {
    return false;
  }
  const originCountry = normalizeCountryCode(resolveCountryCode(origin));
  const originDepartment = origin.department?.trim() ?? "";
  const originProvince = origin.province?.trim() ?? "";
  const originDistrict = origin.district?.trim() ?? "";

  return scopes.some((scope) => {
    if (normalizeCountryCode(scope.countryCode) !== originCountry) {
      return false;
    }
    if (scope.department.trim() !== originDepartment) {
      return false;
    }
    if (scope.province.trim() !== originProvince) {
      return false;
    }
    const scopedDistrict = scope.district.trim();
    // Distrito vacío = toda la provincia (p. ej. Lima · Lima).
    if (scopedDistrict === "") {
      return originProvince !== "";
    }
    return scopedDistrict === originDistrict;
  });
}

export function driverMatchesDistrictScopes(
  driver: GeoRegion,
  scopes: DistrictScope[],
): boolean {
  return originMatchesDistrictScopes(driver, scopes);
}

export async function listDistrictScopes(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<Array<Doc<"adminDistrictScopes">>> {
  return await ctx.db
    .query("adminDistrictScopes")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
}

export async function getAccessContext(
  ctx: QueryCtx | MutationCtx,
  user: Doc<"users">,
): Promise<{
  user: Doc<"users">;
  isFullAdmin: boolean;
  districtScopes: DistrictScope[];
}> {
  const rows = await listDistrictScopes(ctx, user._id);
  const districtScopes = rows.map((row) => ({
    countryCode: row.countryCode,
    department: row.department,
    province: row.province,
    district: row.district,
  }));
  return {
    user,
    isFullAdmin: isFullAdmin(user, districtScopes),
    districtScopes,
  };
}

export function filterServicesByAccess<T extends { origin: GeoRegion }>(
  services: T[],
  access: { isFullAdmin: boolean; districtScopes: DistrictScope[] },
): T[] {
  if (access.isFullAdmin) {
    return services;
  }
  return services.filter((service) =>
    originMatchesDistrictScopes(service.origin, access.districtScopes),
  );
}

export function canAccessRegion(
  access: { isFullAdmin: boolean; districtScopes: DistrictScope[] },
  region: GeoRegion,
): boolean {
  if (access.isFullAdmin) {
    return true;
  }
  return originMatchesDistrictScopes(region, access.districtScopes);
}

export function formatScopeLabel(scope: DistrictScope): string {
  if (scope.district.trim() === "") {
    return `Toda ${scope.province} (${scope.department})`;
  }
  return `${scope.district}, ${scope.province}`;
}
