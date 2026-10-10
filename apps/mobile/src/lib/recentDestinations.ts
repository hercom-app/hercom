export type RecentDestination = {
  address: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
};

type DestinationSource = {
  destination: {
    address: string;
    lat: number;
    lng: number;
  };
};

const MAX_RECENTS = 4;

function splitPlaceLabel(address: string): { title: string; subtitle?: string } {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
  const title = parts[0] ?? address.trim();
  const subtitle = parts.slice(1, 3).join(", ");
  return {
    title,
    ...(subtitle !== "" ? { subtitle } : {}),
  };
}

/** Últimos destinos distintos, del más reciente al más antiguo. */
export function recentDestinationsFromServices(
  services: DestinationSource[] | undefined,
): RecentDestination[] {
  if (services === undefined) {
    return [];
  }

  const seen = new Set<string>();
  const recents: RecentDestination[] = [];

  for (const service of services) {
    const address = service.destination.address.trim();
    const { lat, lng } = service.destination;
    if (address === "" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }
    if (lat === 0 && lng === 0) {
      continue;
    }
    const key = address.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const label = splitPlaceLabel(address);
    recents.push({
      address,
      lat,
      lng,
      title: label.title,
      ...(label.subtitle !== undefined ? { subtitle: label.subtitle } : {}),
    });
    if (recents.length >= MAX_RECENTS) {
      break;
    }
  }

  return recents;
}
