import { formatDateTime } from "../lib/formatDateTime";

export type ServiceTimelineData = {
  requestedAt: number;
  offeredAt: number | null;
  chosenAt: number | null;
  advanceAt: number | null;
  departedAt: number | null;
  cancelledAt: number | null;
  arrivedAt: number | null;
  checklistStartedAt: number | null;
  tripStartedAt: number | null;
  extendedAt: number[];
  finishedAt: number | null;
};

export type TripReviewFactsData = {
  requestedHours: number | null;
  executedDurationMs: number | null;
  departedWithClientAt: number | null;
  timeline: ServiceTimelineData;
  score: number | null;
  comment: string | null;
  driverScore: number | null;
  driverComment: string | null;
  routeFileUrl: string | null;
  routePointCount: number | null;
  routeArchiveStatus: "recording" | "finalized" | null;
};

export function formatRequestedHours(hours: number | null): string {
  if (hours === null) {
    return "—";
  }
  const rounded = Math.round(hours * 10) / 10;
  const label = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1);
  return `${label} h`;
}

export function formatExecutedDuration(
  ms: number | null,
  started: boolean,
): string {
  if (ms === null) {
    return started ? "En curso" : "No iniciado";
  }
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes} min`;
  }
  if (minutes === 0) {
    return hours === 1 ? "1 h" : `${hours} h`;
  }
  return `${hours} h ${minutes} min`;
}

export function formatScore(score: number | null): string {
  if (score === null) {
    return "Sin calificar";
  }
  return `${score} ★`;
}

export function RouteFileLink({
  review,
}: {
  review: Pick<
    TripReviewFactsData,
    "routeFileUrl" | "routePointCount" | "routeArchiveStatus"
  >;
}) {
  if (review.routeFileUrl !== null) {
    const points =
      review.routePointCount === null
        ? ""
        : ` (${review.routePointCount} puntos)`;
    return (
      <a
        href={review.routeFileUrl}
        target="_blank"
        rel="noreferrer"
        className="text-xs font-semibold text-slate-700 underline"
      >
        Descargar ruta{points}
      </a>
    );
  }
  if (review.routeArchiveStatus === "recording") {
    return <span className="text-xs text-slate-500">Ruta en grabación</span>;
  }
  if (review.routeArchiveStatus === "finalized") {
    return (
      <span className="text-xs text-slate-500">
        Ruta archivada, archivo en proceso
      </span>
    );
  }
  return <span className="text-xs text-slate-500">Sin archivo de ruta</span>;
}

function RatingLine({
  label,
  score,
  comment,
}: {
  label: string;
  score: number | null;
  comment: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{formatScore(score)}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">
        {comment !== null && comment !== "" ? comment : "Sin comentario"}
      </p>
    </div>
  );
}

function TimelineInstant({ at }: { at: number | null }) {
  return (
    <span className="font-mono text-sm tabular-nums text-slate-900">
      {at === null ? "—" : formatDateTime(at)}
    </span>
  );
}

export function ServiceTimeline({ timeline }: { timeline: ServiceTimelineData }) {
  const rows: { label: string; at: number | null }[] = [
    { label: "1. Cliente pidió", at: timeline.requestedAt },
    { label: "2. Chofer ofertó", at: timeline.offeredAt },
    { label: "3. Cliente eligió chofer", at: timeline.chosenAt },
    { label: "4. Anticipo confirmado", at: timeline.advanceAt },
    { label: "5. Chofer salió", at: timeline.departedAt },
    { label: "5. Viaje cancelado", at: timeline.cancelledAt },
    { label: "6. Chofer llegó", at: timeline.arrivedAt },
    { label: "7. Comenzó el checklist", at: timeline.checklistStartedAt },
    { label: "8. Inició el viaje", at: timeline.tripStartedAt },
  ];
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 sm:col-span-2">
      <p className="text-xs font-medium text-slate-500">
        Tiempos del viaje (fecha, hora, minuto y segundo, Lima)
      </p>
      <dl className="mt-2 grid gap-1.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-3"
          >
            <dt className="text-sm text-slate-600">{row.label}</dt>
            <dd>
              <TimelineInstant at={row.at} />
            </dd>
          </div>
        ))}
        <div className="flex items-start justify-between gap-3">
          <dt className="text-sm text-slate-600">9. Extensiones</dt>
          <dd className="text-right">
            {timeline.extendedAt.length === 0 ? (
              <TimelineInstant at={null} />
            ) : (
              <div className="grid gap-0.5">
                {timeline.extendedAt.map((at, index) => (
                  <TimelineInstant key={`${at}-${index}`} at={at} />
                ))}
              </div>
            )}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-sm text-slate-600">10. Terminó el servicio</dt>
          <dd>
            <TimelineInstant at={timeline.finishedAt} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function TripReviewFacts({ review }: { review: TripReviewFactsData }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ServiceTimeline timeline={review.timeline} />
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-xs font-medium text-slate-500">Tiempo pedido</p>
        <p className="text-sm font-semibold text-slate-900">
          {formatRequestedHours(review.requestedHours)}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-xs font-medium text-slate-500">Tiempo ejecutado</p>
        <p className="text-sm font-semibold text-slate-900">
          {formatExecutedDuration(
            review.executedDurationMs,
            review.departedWithClientAt !== null,
          )}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
        <RatingLine
          label="Cliente → chofer"
          score={review.score}
          comment={review.comment}
        />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
        <RatingLine
          label="Chofer → cliente"
          score={review.driverScore}
          comment={review.driverComment}
        />
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:col-span-2">
        <p className="text-xs font-medium text-slate-500">
          Ruta GPS (archivo)
        </p>
        <p className="mt-1">
          <RouteFileLink review={review} />
        </p>
      </div>
    </div>
  );
}

export function RatingCell({
  score,
  comment,
}: {
  score: number | null;
  comment: string | null;
}) {
  return (
    <div className="max-w-[16rem] whitespace-normal">
      <p className="font-medium text-slate-900">{formatScore(score)}</p>
      <p className="mt-0.5 text-xs text-slate-600">
        {comment !== null && comment !== "" ? comment : "Sin comentario"}
      </p>
    </div>
  );
}
