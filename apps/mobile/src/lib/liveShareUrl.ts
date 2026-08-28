/**
 * URL pública para compartir un viaje en la web comercial.
 */
export function buildLiveShareUrl(token: string): string {
  const base =
    process.env.EXPO_PUBLIC_LIVE_SHARE_BASE_URL?.replace(/\/$/, "") ??
    "https://hercom-landing.vercel.app";
  return `${base}/live/${token}`;
}

export function buildLiveShareMessage(token: string): string {
  const webUrl = buildLiveShareUrl(token);
  const deepLink = `choferes://live/${token}`;
  return (
    `Sigue el viaje Hercom en vivo:\n${webUrl}\n\n` +
    `También puedes abrir la app con: ${deepLink}\n` +
    `Código: ${token}`
  );
}
