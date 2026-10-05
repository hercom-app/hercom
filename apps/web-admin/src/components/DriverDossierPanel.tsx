import { useEffect, useState } from "react";
import { useAction, useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@proyecto/backend";
import { btnPrimaryClass, btnSecondaryClass, labelClass } from "../lib/adminUi";
import { errorDetail, formatConvexError } from "../lib/convexError";
import {
  CONDUCTOR_RECORD_URL,
  CUL_INFO_URL,
  DIGITAL_LICENSE_URL,
} from "../lib/officialDocuments";
import { getDriverApprovalAgeBlock } from "@proyecto/backend/age";

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

type ReniecLookup = {
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  fullName: string;
  documentNumber: string;
};

function normalizePersonName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function namesMatch(declared: string, official: string): boolean {
  return normalizePersonName(declared) === normalizePersonName(official);
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
  const lookupDni = useAction(api.reniec.lookupDni);
  const [acting, setActing] = useState(false);
  const [lookingUpReniec, setLookingUpReniec] = useState(false);
  const [reniecResult, setReniecResult] = useState<ReniecLookup | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReniecResult(null);
  }, [application?._id]);

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

  const ageBlock = getDriverApprovalAgeBlock(application.birthDate);
  const approveDisabled = acting || ageBlock !== null;

  async function handleApprove() {
    if (ageBlock !== null) {
      setError(ageBlock);
      return;
    }
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

  async function handleLookupReniec() {
    setLookingUpReniec(true);
    setError(null);
    try {
      const result = await lookupDni({ dni: application.dni });
      setReniecResult(result);
    } catch (lookupError) {
      setReniecResult(null);
      const lookupMessage = formatConvexError(
        lookupError,
        "No se pudo consultar RENIEC.",
      );
      void recordAdminLog({
        action: "reniec.lookupDni",
        message: lookupMessage,
        detail: errorDetail(lookupError),
      }).catch((logError) => {
        console.error("[hercom-admin] no se pudo guardar el log", logError);
      });
      setError(lookupMessage);
    } finally {
      setLookingUpReniec(false);
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
        <InfoRow label="Nombre declarado" value={application.fullName} />
        <InfoRow label="DNI" value={application.dni} />
        <InfoRow label="Sexo" value={SEX_LABELS[application.sex]} />
        <InfoRow
          label="Fecha de nacimiento"
          value={formatBirthDate(application.birthDate)}
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
        <InfoRow
          label="Firma digital (datos personales)"
          value={
            application.personalDataConsentAt !== undefined
              ? `Autorizada · ${formatDateTime(application.personalDataConsentAt)}`
              : "No registrada (solicitud anterior)"
          }
        />
        {application.driverPlate !== null && (
          <InfoRow label="Placa (perfil)" value={application.driverPlate} />
        )}
        {application.driverStatus !== null && (
          <InfoRow label="Estado operativo" value={application.driverStatus} />
        )}
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">
            Verificación RENIEC
          </p>
          <button
            type="button"
            disabled={lookingUpReniec}
            onClick={() => void handleLookupReniec()}
            className={`${btnSecondaryClass} w-full sm:w-auto`}
          >
            {lookingUpReniec ? "Consultando…" : "Consultar RENIEC"}
          </button>
        </div>
        {reniecResult === null ? (
          <p className="mt-2 text-xs text-slate-500">
            El chofer escribió estos datos a mano. Contrástalos con RENIEC
            antes de aprobar.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            <CompareRow
              label="DNI"
              declared={application.dni}
              official={reniecResult.documentNumber}
            />
            <CompareRow
              label="Nombres"
              declared={application.firstName}
              official={reniecResult.firstName}
            />
            <CompareRow
              label="Apellido paterno"
              declared={application.firstLastName}
              official={reniecResult.firstLastName}
            />
            <CompareRow
              label="Apellido materno"
              declared={application.secondLastName}
              official={reniecResult.secondLastName}
            />
          </div>
        )}
      </div>

      {application.status === "pending" && (
        <div className="mt-4 flex w-full flex-col gap-2">
          {ageBlock !== null && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
              {ageBlock}
            </p>
          )}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={approveDisabled}
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

function CompareRow({
  label,
  declared,
  official,
}: {
  label: string;
  declared: string;
  official: string;
}) {
  const match = namesMatch(declared, official);
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        match
          ? "border-emerald-200 bg-emerald-50"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p
          className={`text-xs font-semibold ${
            match ? "text-emerald-800" : "text-amber-900"
          }`}
        >
          {match ? "Coincide" : "No coincide"}
        </p>
      </div>
      <p className="mt-1 text-sm font-medium text-slate-900">
        Declarado: {declared.trim() === "" ? "—" : declared}
      </p>
      <p className="text-sm text-slate-700">
        RENIEC: {official.trim() === "" ? "—" : official}
      </p>
    </div>
  );
}
