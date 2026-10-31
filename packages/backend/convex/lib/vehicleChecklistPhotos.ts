import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/**
 * Set de 6 tomas que usan rentadoras, car-sharing y chofer de reemplazo:
 * 4 exteriores + interior + odómetro. Cubre reclamos sin alargar el recojo.
 */
export const VEHICLE_PHOTO_SLOTS = [
  "front",
  "rear",
  "left",
  "right",
  "interior",
  "odometer",
] as const;

export type VehiclePhotoSlot = (typeof VEHICLE_PHOTO_SLOTS)[number];

export const VEHICLE_PHOTO_SLOT_COUNT = VEHICLE_PHOTO_SLOTS.length;

export const VEHICLE_PHOTO_SLOT_LABELS: Record<VehiclePhotoSlot, string> = {
  front: "Frente",
  rear: "Posterior",
  left: "Lateral izquierdo",
  right: "Lateral derecho",
  interior: "Interior",
  odometer: "Kilometraje",
};

export const MISSING_VEHICLE_PHOTOS_MESSAGE =
  "Faltan las 6 fotos del vehículo: frente, posterior, ambos laterales, interior y kilometraje.";

const SLOT_SET = new Set<string>(VEHICLE_PHOTO_SLOTS);

export type VehicleChecklistPhoto = {
  slot: VehiclePhotoSlot;
  storageId: Id<"_storage">;
};

export function hasRequiredVehiclePhotos(
  photos: Array<{ slot: string }> | undefined,
): boolean {
  if (photos === undefined || photos.length !== VEHICLE_PHOTO_SLOT_COUNT) {
    return false;
  }
  const seen = new Set<string>();
  for (const photo of photos) {
    if (!SLOT_SET.has(photo.slot) || seen.has(photo.slot)) {
      return false;
    }
    seen.add(photo.slot);
  }
  return seen.size === VEHICLE_PHOTO_SLOT_COUNT;
}

export function assertRequiredVehiclePhotos(
  photos: Array<{ slot: string }> | undefined,
): asserts photos is VehicleChecklistPhoto[] {
  if (!hasRequiredVehiclePhotos(photos)) {
    throw new Error(MISSING_VEHICLE_PHOTOS_MESSAGE);
  }
}

export async function deleteVehicleChecklistPhotos(
  ctx: MutationCtx,
  photos: Array<{ storageId: Id<"_storage"> }> | undefined,
): Promise<void> {
  if (photos === undefined) {
    return;
  }
  for (const photo of photos) {
    await ctx.storage.delete(photo.storageId);
  }
}

export async function replaceVehicleChecklistPhotos(
  ctx: MutationCtx,
  previous: Array<{ storageId: Id<"_storage"> }> | undefined,
  next: VehicleChecklistPhoto[],
): Promise<void> {
  const keep = new Set(next.map((photo) => photo.storageId));
  if (previous === undefined) {
    return;
  }
  for (const photo of previous) {
    if (!keep.has(photo.storageId)) {
      await ctx.storage.delete(photo.storageId);
    }
  }
}
