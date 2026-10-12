export const RENIEC_DRIVER_MAX_LOOKUPS = 2;
export const RENIEC_DRIVER_BLOCK_MS = 8 * 60 * 60 * 1000;

export type ReniecDriverQuotaFields = {
  reniecDriverLookupCount?: number;
  reniecDriverLookupBlockedUntil?: number;
};

export function normalizeReniecDriverQuota(
  user: ReniecDriverQuotaFields,
  now = Date.now(),
): { count: number; blockedUntil: number | undefined } {
  let count = user.reniecDriverLookupCount ?? 0;
  let blockedUntil = user.reniecDriverLookupBlockedUntil;
  if (blockedUntil !== undefined && now >= blockedUntil) {
    count = 0;
    blockedUntil = undefined;
  }
  return { count, blockedUntil };
}

export function reniecDriverBlockMessage(blockedUntil: number, now = Date.now()): string {
  const hoursLeft = Math.max(1, Math.ceil((blockedUntil - now) / (60 * 60 * 1000)));
  return `Has usado tus ${RENIEC_DRIVER_MAX_LOOKUPS} consultas RENIEC permitidas. No podrás validar otro DNI por ${hoursLeft} h (máx. 8 h).`;
}

export function assertReniecDriverLookupAllowed(
  count: number,
  blockedUntil: number | undefined,
  now = Date.now(),
): void {
  if (blockedUntil !== undefined && now < blockedUntil) {
    throw new Error(reniecDriverBlockMessage(blockedUntil, now));
  }
  if (count >= RENIEC_DRIVER_MAX_LOOKUPS) {
    throw new Error(reniecDriverBlockMessage(now + RENIEC_DRIVER_BLOCK_MS, now));
  }
}

export function afterReniecDriverLookupSuccess(
  count: number,
  now = Date.now(),
): { count: number; blockedUntil: number | undefined } {
  const nextCount = count + 1;
  if (nextCount >= RENIEC_DRIVER_MAX_LOOKUPS) {
    return {
      count: RENIEC_DRIVER_MAX_LOOKUPS,
      blockedUntil: now + RENIEC_DRIVER_BLOCK_MS,
    };
  }
  return { count: nextCount, blockedUntil: undefined };
}
