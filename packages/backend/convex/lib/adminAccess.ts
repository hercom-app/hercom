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
  const originKey = districtScopeKey({
    countryCode: resolveCountryCode(origin),
    department: origin.department ?? "",
    province: origin.province ?? "",
    district: origin.district ?? "",
  });
  return scopes.some((scope) => districtScopeKey(scope) === originKey);
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
