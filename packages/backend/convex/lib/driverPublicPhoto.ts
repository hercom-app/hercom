import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

/** Foto pública del chofer, o su selfie de cuenta si aún no cargó la de ofertas. */
export async function driverPhotoUrl(
  ctx: QueryCtx,
  driver: Doc<"drivers">,
  driverUser: Doc<"users"> | null,
): Promise<string | null> {
  if (driver.publicPhotoStorageId !== undefined) {
    const url = await ctx.storage.getUrl(driver.publicPhotoStorageId);
    if (url !== null) {
      return url;
    }
  }
  if (driverUser?.selfieStorageId !== undefined) {
    return await ctx.storage.getUrl(driverUser.selfieStorageId);
  }
  return null;
}
