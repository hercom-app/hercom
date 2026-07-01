import type { FunctionReturnType } from "convex/server";
import { api } from "@proyecto/backend";

export type DriverApplicationForAdmin = FunctionReturnType<
  typeof api.driverApplications.listForAdmin
>[number];

const APPLICATION_STATUS_LABELS: Record<
  DriverApplicationForAdmin["status"],
  string
> = {
  pending: "Pendiente de revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const SEX_LABELS: Record<DriverApplicationForAdmin["sex"], string> = {
  M: "Masculino",
  F: "Femenino",
};

function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

type DriverDossierPanelProps = {
  application: DriverApplicationForAdmin | null;
  userName: string;
};

export function DriverDossierPanel({
  application,
  userName,
}: DriverDossierPanelProps) {
  if (application === null) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        {userName} no tiene expediente de registro (brevete / CUL) cargado.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-900">Expediente del chofer</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            application.status === "approved"
              ? "bg-emerald-100 text-emerald-800"
              : application.status === "rejected"
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-800"
          }`}
        >
          {APPLICATION_STATUS_LABELS[application.status]}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <InfoRow label="Nombre (RENIEC)" value={application.fullName} />
        <InfoRow label="DNI" value={application.dni} />
        <InfoRow label="Sexo" value={SEX_LABELS[application.sex]} />
        <InfoRow label="N.° brevete" value={application.licenseNumber} />
        <InfoRow label="Categoría brevete" value={application.licenseCategory} />
        <InfoRow
          label="Enviado"
          value={formatDateTime(application.submittedAt)}
        />
        {application.driverPlate !== null && (
          <InfoRow label="Placa (perfil)" value={application.driverPlate} />
        )}
        {application.driverStatus !== null && (
          <InfoRow label="Estado operativo" value={application.driverStatus} />
        )}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
          Fotos del brevete
        </p>
        {application.licensePhotoUrls.length === 0 ? (
          <p className="text-sm text-slate-500">Sin fotos disponibles.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {application.licensePhotoUrls.map((url, index) => (
              <a
                key={`${application._id}-license-${index}`}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                <img
                  src={url}
                  alt={`Brevete ${index + 1}`}
                  className="h-32 w-auto max-w-[200px] object-cover"
                />
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
          CUL (Certificado Único de Licencia)
        </p>
        {application.culPdfUrl !== null ? (
          <a
            href={application.culPdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-lg bg-hercom px-4 py-2 text-sm font-semibold text-white hover:bg-hercom-dark"
          >
            Abrir PDF del CUL
          </a>
        ) : (
          <p className="text-sm text-slate-500">PDF no disponible.</p>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase text-slate-500">{label}</p>
      <p className="text-sm text-slate-900">{value}</p>
    </div>
  );
}
