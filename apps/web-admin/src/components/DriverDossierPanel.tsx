import { useState } from "react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@proyecto/backend";
import { btnPrimaryClass, btnSecondaryClass, labelClass } from "../lib/adminUi";
import { errorDetail, formatConvexError } from "../lib/convexError";
import {
  CONDUCTOR_RECORD_URL,
  CUL_INFO_URL,
  DIGITAL_LICENSE_URL,
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

function formatBirthDate(isoDate: string | undefined): string {
  if (isoDate === undefined || isoDate.trim() === "") {
    return "—";
  }
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(
    parsed,
  );
}

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

export type DriverFinanceInfo = {
  hasProfile: boolean;
  fullName: string | undefined;
  dni: string | undefined;
  yape: string | undefined;
  plin: string | undefined;
  bankAccount1: string | undefined;
  bankAccount2: string | undefined;
  bankAccount3: string | undefined;
  walletBalance: number | undefined;
};

type DriverDossierPanelProps = {
  application: DriverApplicationForAdmin | null;
  userName: string;
  finance: DriverFinanceInfo;
};

export function DriverDossierPanel({
  application,
  userName,
  finance,
}: DriverDossierPanelProps) {
  const approveApplication = useMutation(api.driverApplications.approve);
  const rejectApplication = useMutation(api.driverApplications.reject);
  const recordAdminLog = useMutation(api.adminLogs.record);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (application === null) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          {userName} no tiene solicitud de registro (brevete, CUL ni récord de
          conductor) cargada.
        </div>
        <DriverFinanceCard finance={finance} />
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
      const message = formatConvexError(
        approveError,
        "No se pudo aprobar la solicitud.",
      );
      void recordAdminLog({
        action: "driverApplications.approve",
        message,
        detail: errorDetail(approveError),
      }).catch((logError) => {
        console.error("[hercom-admin] no se pudo guardar el log", logError);
      });
      setError(message);
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
      const message = formatConvexError(
        rejectError,
        "No se pudo rechazar la solicitud.",
      );
      void recordAdminLog({
        action: "driverApplications.reject",
        message,
        detail: errorDetail(rejectError),
      }).catch((logError) => {
        console.error("[hercom-admin] no se pudo guardar el log", logError);
      });
      setError(message);
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="space-y-4">
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
        <InfoRow
          label="Fecha de nacimiento"
          value={formatBirthDate(
            (application as DriverApplicationForAdmin & { birthDate?: string })
              .birthDate,
          )}
        />
        <InfoRow label="N.° brevete" value={application.licenseNumber} />
        <InfoRow label="Categoría brevete" value={application.licenseCategory} />
        <InfoRow
          label="Formato brevete"
          value={
            application.licenseFormat === "digital"
              ? "Digital"
              : application.licenseFormat === "physical"
                ? "Físico"
                : "Físico"
          }
        />
        <InfoRow
          label="Tipo de vehículo"
          value={
            application.vehicleBodyType === "camioneta"
              ? "Camioneta"
              : application.vehicleBodyType === "auto"
                ? "Auto"
                : "—"
          }
        />
        <InfoRow label="Zona" value={formatRegion(application)} />
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
            {application.licensePhotoUrls.map((url, index) => {
              const labels =
                application.licenseFormat === "digital"
                  ? ["Selfie con brevete impreso"]
                  : ["Anverso", "Reverso", "Selfie con brevete"];
              return (
              <a
                key={`${application._id}-license-${index}`}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block w-full overflow-hidden rounded-lg border border-slate-200 bg-white sm:w-auto"
              >
                <p className="px-2 pt-2 text-xs font-medium text-slate-600">
                  {labels[index] ?? `Foto ${index + 1}`}
                </p>
                <img
                  src={url}
                  alt={labels[index] ?? `Brevete ${index + 1}`}
                  className="h-32 w-full max-w-full object-cover sm:h-32 sm:w-auto sm:max-w-[200px]"
                />
              </a>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {application.licensePdfUrl !== null &&
        application.licensePdfUrl !== undefined ? (
          <DocumentFileCard
            title="Brevete digital"
            officialUrl={DIGITAL_LICENSE_URL}
            fileUrl={application.licensePdfUrl}
            fileLabel="Abrir PDF del brevete"
          />
        ) : null}
        <DocumentFileCard
          title="Récord de conductor"
          officialUrl={CONDUCTOR_RECORD_URL}
          fileUrl={application.conductorRecordPdfUrl}
          fileLabel="Abrir PDF del récord"
        />
        <DocumentFileCard
          title="CUL"
          officialUrl={CUL_INFO_URL}
          fileUrl={application.culPdfUrl}
          fileLabel="Abrir PDF del CUL"
        />
      </div>
    </div>
    <DriverFinanceCard finance={finance} />
    </div>
  );
}

function displayValue(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? "—" : trimmed;
}

function DriverFinanceCard({ finance }: { finance: DriverFinanceInfo }) {
  const bankAccounts = [
    finance.bankAccount1,
    finance.bankAccount2,
    finance.bankAccount3,
  ]
    .map((value) => value?.trim() ?? "")
    .filter((value) => value !== "");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <p className="mb-1 font-display text-base font-bold text-slate-900">
        Información financiera
      </p>
      <p className="mb-4 text-sm text-slate-500">
        Datos de cobro para el anticipo del 25% (Yape, Plin y cuentas).
      </p>

      {!finance.hasProfile ? (
        <p className="text-sm text-slate-500">
          Aún no hay perfil de chofer. Estos datos se cargan en la app después
          de aprobar el registro.
        </p>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <InfoRow
              label="Titular"
              value={displayValue(finance.fullName)}
            />
            <InfoRow label="DNI de cobro" value={displayValue(finance.dni)} />
            <InfoRow label="Yape" value={displayValue(finance.yape)} />
            <InfoRow label="Plin" value={displayValue(finance.plin)} />
            {finance.walletBalance !== undefined ? (
              <InfoRow
                label="Saldo de recarga"
                value={`S/${finance.walletBalance.toFixed(2)}`}
              />
            ) : null}
          </div>
          <div className="mt-4">
            <p className={labelClass}>Cuentas bancarias</p>
            {bankAccounts.length === 0 ? (
              <p className="text-sm text-slate-500">Sin cuentas cargadas.</p>
            ) : (
              <ul className="space-y-1.5">
                {bankAccounts.map((account, index) => (
                  <li
                    key={`${index}-${account}`}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900"
                  >
                    {account}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DocumentFileCard({
  title,
  officialUrl,
  fileUrl,
  fileLabel,
}: {
  title: string;
  officialUrl: string;
  fileUrl: string | null;
  fileLabel: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <div className="mt-3 flex flex-col gap-2">
        <a
          href={officialUrl}
          target="_blank"
          rel="noreferrer"
          className={`${btnSecondaryClass} w-full`}
        >
          Abrir sitio oficial
        </a>
        {fileUrl !== null ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className={`${btnPrimaryClass} w-full`}
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
