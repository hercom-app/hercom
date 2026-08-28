export function liveStatusLabel(status: string): string {
  switch (status) {
    case "heading_to_pickup":
      return "Yendo al recojo";
    case "arrived_pickup":
      return "En el punto de partida";
    case "in_progress":
    case "en_route":
      return "En viaje";
    case "arrived_destination":
      return "En el destino";
    case "finished":
      return "Viaje finalizado";
    case "cancelled":
      return "Cancelado";
    case "pending":
      return "Pendiente";
    case "assigned":
      return "Asignado";
    default:
      return status;
  }
}

export type LiveMapPoint = {
  lat: number;
  lng: number;
};

export function computeMapBounds(points: LiveMapPoint[]): {
  center: LiveMapPoint;
  zoom: number;
} {
  if (points.length === 0) {
    return { center: { lat: -12.0464, lng: -77.0428 }, zoom: 12 };
  }

  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.01);
  const lngSpan = Math.max(maxLng - minLng, 0.01);
  const span = Math.max(latSpan, lngSpan);
  const zoom =
    span > 0.5 ? 10 : span > 0.2 ? 11 : span > 0.08 ? 12 : span > 0.03 ? 13 : 14;

  return {
    center: {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2,
    },
    zoom,
  };
}

export function limaToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function limaDaysAgo(days: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
}
