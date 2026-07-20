export function getGoogleMapsApiKey(): string | undefined {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (apiKey === undefined || apiKey.trim() === "") {
    return undefined;
  }
  return apiKey.trim();
}

export function isGoogleMapsApiKeyConfigured(): boolean {
  return getGoogleMapsApiKey() !== undefined;
}

export function requireGoogleMapsApiKey(): string {
  const apiKey = getGoogleMapsApiKey();
  if (apiKey === undefined) {
    throw new Error(
      "Falta EXPO_PUBLIC_GOOGLE_MAPS_API_KEY. Configúrala en apps/mobile/.env.",
    );
  }
  return apiKey;
}
