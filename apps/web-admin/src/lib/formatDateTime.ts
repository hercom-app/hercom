/** Fecha, hora, minuto y segundo (zona Perú). */
export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(new Date(timestamp));
}

/** Momento en que se creó / solicitó el servicio. */
export function formatServiceRequestedAt(service: {
  requestedAt?: number;
  _creationTime: number;
}): string {
  const ts = service.requestedAt ?? service._creationTime;
  return formatDateTime(ts);
}
