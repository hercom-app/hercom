/** Fecha y hora operativa (zona Perú). */
export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Lima",
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
