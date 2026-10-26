import { v } from "convex/values";

export const DRIVER_TOP_UP_PACKAGE_IDS = [
  "trips_1",
  "trips_2",
  "trips_5",
] as const;

export type DriverTopUpPackageId = (typeof DRIVER_TOP_UP_PACKAGE_IDS)[number];

export type DriverTopUpPackage = {
  id: DriverTopUpPackageId;
  trips: number;
  pricePen: number;
  label: string;
};

export const DRIVER_TOP_UP_PACKAGES: readonly DriverTopUpPackage[] = [
  { id: "trips_1", trips: 1, pricePen: 30, label: "1 viaje" },
  { id: "trips_2", trips: 2, pricePen: 50, label: "2 viajes" },
  { id: "trips_5", trips: 5, pricePen: 100, label: "5 viajes" },
];

export const driverTopUpPackageIdValidator = v.union(
  v.literal("trips_1"),
  v.literal("trips_2"),
  v.literal("trips_5"),
);

export function getDriverTopUpPackage(
  id: DriverTopUpPackageId,
): DriverTopUpPackage {
  const pkg = DRIVER_TOP_UP_PACKAGES.find((p) => p.id === id);
  if (!pkg) {
    throw new Error("Paquete de recarga inválido.");
  }
  return pkg;
}

export function isDriverTopUpPricePen(amount: number): boolean {
  return DRIVER_TOP_UP_PACKAGES.some((p) => p.pricePen === amount);
}

/** Catálogo fijo de recargas (no hay tabla en BD; solo movimientos en walletTransactions). */
export const DRIVER_TOP_UP_CATALOG = DRIVER_TOP_UP_PACKAGES;
