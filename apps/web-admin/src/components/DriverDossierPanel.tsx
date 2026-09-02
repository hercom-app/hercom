import { useState } from "react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@proyecto/backend";
import { btnPrimaryClass, btnSecondaryClass, labelClass } from "../lib/adminUi";
import {
  CONDUCTOR_RECORD_URL,
  CUL_INFO_URL,
} from "../lib/officialDocuments";

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

function formatRegion(application: DriverApplicationForAdmin): string {
  const parts = [
    application.countryCode ?? "PE",
    application.department,
    application.province,
    application.district,
  ].filter((part) => part !== undefined && part !== "");
  return parts.join(" · ");
}

type DriverDossierPanelProps = {
  application: DriverApplicationForAdmin | null;
  userName: string;
};

export function DriverDossierPanel({
  application,
  userName,
}: DriverDossierPanelProps) {
  const approveApplication = useMutation(api.driverApplications.approve);
  const rejectApplication = useMutation(api.driverApplications.reject);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (application === null) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        {userName} no tiene solicitud de registro (brevete, CUL ni récord de conductor) cargada.
      </div>
    );
  }

  async function handleApprove() {
    setActing(true);
    setMessage(null);
    setError(null);
    try {
      await approveApplication({ applicationId: application!._id });
      setMessage("Solicitud aprobada. Perfil de chofer creado.");
    } catch (approveError) {
      setError(
        approveError instanceof Error
          ? approveError.message
          : "No se pudo aprobar la solicitud.",
      );
    } finally {
      setActing(false);
    }
  }

  async function handleReject() {
    setActing(true);
    setMessage(null);
    setError(null);
    try {
      await rejectApplication({ applicationId: application!._id });
      setMessage("Solicitud rechazada.");
    } catch (rejectError) {
      setError(
        rejectError instanceof Error
          ? rejectError.message
          : "No se pudo rechazar la solicitud.",
      );
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-base font-bold text-slate-900">
          Registro del chofer
        </p>
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
        <InfoRow label="Zona de operación" value={formatRegion(application)} />
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

      {application.status === "pending" && (
        <div className="mt-4 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={acting}
            onClick={() => void handleApprove()}
            className={`${btnPrimaryClass} w-full sm:w-auto`}
          >
            Aprobar solicitud
          </button>
          <button
            type="button"
            disabled={acting}
            onClick={() => void handleReject()}
            className="min-h-11 w-full rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 sm:w-auto"
          >
            Rechazar
          </button>
        </div>
      )}

      {message !== null && (
        <p className="mt-3 text-sm font-medium text-emerald-700">{message}</p>
      )}
      {error !== null && (
        <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
      )}

      <div className="mt-4">
        <p className={labelClass}>Fotos del brevete</p>
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
                className="block w-full overflow-hidden rounded-lg border border-slate-200 bg-white sm:w-auto"
              >
                <img
                  src={url}
                  alt={`Brevete ${index + 1}`}
                  className="h-32 w-full max-w-full object-cover sm:h-32 sm:w-auto sm:max-w-[200px]"
                />
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <DocumentFileCard
          title="CUL (Certificado Único Laboral)"
          description="Documento del Ministerio de Trabajo. Antecedentes y datos laborales."
          officialLabel="Consultar en gob.pe"
          officialUrl={CUL_INFO_URL}
          fileUrl={application.culPdfUrl}
          fileLabel="Abrir PDF del CUL"
        />
        <DocumentFileCard
          title="Récord de conductor (MTC)"
          description="Infracciones y estado de la licencia emitidos por el MTC."
          officialLabel="Consultar en MTC"
          officialUrl={CONDUCTOR_RECORD_URL}
          fileUrl={application.conductorRecordPdfUrl}
          fileLabel="Abrir PDF del récord"
        />
      </div>
    </div>
  );
}

function DocumentFileCard({
  title,
  description,
  officialLabel,
  officialUrl,
  fileUrl,
  fileLabel,
}: {
  title: string;
  description: string;
  officialLabel: string;
  officialUrl: string;
  fileUrl: string | null;
  fileLabel: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      <div className="mt-3 flex flex-col gap-2">
        <a
          href={officialUrl}
          target="_blank"
          rel="noreferrer"
          className={`${btnSecondaryClass} w-full sm:w-auto`}
        >
          {officialLabel}
        </a>
        {fileUrl !== null ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className={`${btnPrimaryClass} w-full sm:w-auto`}
          >
            {fileLabel}
          </a>
        ) : (
          <p className="text-xs text-slate-500">
            El chofer aún no subió este PDF.
          </p>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
