import { useState } from "react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@proyecto/backend";
import { btnPrimaryClass, labelClass } from "../lib/adminUi";

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
        {userName} no tiene solicitud de registro (brevete / CUL) cargada.
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
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={acting}
            onClick={() => void handleApprove()}
            className={btnPrimaryClass}
          >
            Aprobar solicitud
          </button>
          <button
            type="button"
            disabled={acting}
            onClick={() => void handleReject()}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
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
        <p className={labelClass}>CUL (Certificado Único de Licencia)</p>
        {application.culPdfUrl !== null ? (
          <a
            href={application.culPdfUrl}
            target="_blank"
            rel="noreferrer"
            className={btnPrimaryClass}
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
      <p className={labelClass}>{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
