/**
 * Categorías oficiales de licencia de conducir (brevete) en Perú — MTC.
 * @see https://www.gob.pe/262-tipos-de-licencia-de-conducir-brevete
 */
export const PERU_LICENSE_CLASS_A = [
  "A-I",
  "A-IIa",
  "A-IIb",
  "A-IIIa",
  "A-IIIb",
  "A-IIIc",
] as const;

export const PERU_LICENSE_CLASS_B = [
  "B-I",
  "B-IIa",
  "B-IIb",
  "B-IIc",
] as const;

export const PERU_LICENSE_CATEGORIES = [
  ...PERU_LICENSE_CLASS_A,
  ...PERU_LICENSE_CLASS_B,
] as const;

export type PeruLicenseCategory = (typeof PERU_LICENSE_CATEGORIES)[number];
