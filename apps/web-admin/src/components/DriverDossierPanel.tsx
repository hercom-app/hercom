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

type LicenseLookup = {
  documentNumber: string;
  fullName: string;
  licenseNumber: string;
  category: string;
  issuedAt: string;
  expiresAt: string;
  status: string;
  restrictions: string;
};

function displayLookupValue(value: string): string {
  const trimmed = value.trim();
  return trimmed === "" ? "—" : trimmed;
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
  const lookupLicense = useAction(api.verificape.lookupLicense);
  const [acting, setActing] = useState(false);
  const [lookingUpReniec, setLookingUpReniec] = useState(false);
  const [lookingUpLicense, setLookingUpLicense] = useState(false);
  const [reniecResult, setReniecResult] = useState<ReniecLookup | null>(null);
  const [licenseResult, setLicenseResult] = useState<LicenseLookup | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReniecResult(null);
    setLicenseResult(null);
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
    if (application === null) {
      return;
    }
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

  async function handleLookupLicense() {
    if (application === null) {
      return;
    }
    setLookingUpLicense(true);
    setError(null);
    try {
      const result = await lookupLicense({ dni: application.dni });
      setLicenseResult(result);
    } catch (lookupError) {
      setLicenseResult(null);
      const lookupMessage = formatConvexError(
        lookupError,
        "No se pudo consultar el brevete.",
      );
      void recordAdminLog({
        action: "verificape.lookupLicense",
        message: lookupMessage,
        detail: errorDetail(lookupError),
      }).catch((logError) => {
        console.error("[hercom-admin] no se pudo guardar el log", logError);
      });
      setError(lookupMessage);
    } finally {
      setLookingUpLicense(false);
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
        <p className="text-sm font-semibold text-slate-900">Consultas oficiales</p>
        <div className="mt-3 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={lookingUpReniec}
            onClick={() => void handleLookupReniec()}
            className={`${btnSecondaryClass} w-full sm:w-auto`}
          >
            {lookingUpReniec ? "Consultando…" : "Consultar RENIEC"}
          </button>
          <button
            type="button"
            disabled={lookingUpLicense}
            onClick={() => void handleLookupLicense()}
            className={`${btnSecondaryClass} w-full sm:w-auto`}
          >
            {lookingUpLicense ? "Consultando…" : "Consultar brevete"}
          </button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {reniecResult === null ? (
            <p className="text-xs text-slate-500">
              RENIEC: nombre oficial del DNI.
            </p>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <p className={labelClass}>RENIEC</p>
              <p className="text-base font-semibold text-slate-900">
                {displayLookupValue(reniecResult.fullName)}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                DNI {displayLookupValue(reniecResult.documentNumber)}
              </p>
            </div>
          )}
          {licenseResult === null ? (
            <p className="text-xs text-slate-500">
              Brevete: número, categoría, vigencia y estado.
            </p>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <p className={labelClass}>Brevete (VerificaPE)</p>
              <p className="text-base font-semibold text-slate-900">
                {displayLookupValue(licenseResult.fullName)}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Licencia {displayLookupValue(licenseResult.licenseNumber)} ·{" "}
                {displayLookupValue(licenseResult.category)} ·{" "}
                {displayLookupValue(licenseResult.status)}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Expedición {displayLookupValue(licenseResult.issuedAt)} ·
                Vence {displayLookupValue(licenseResult.expiresAt)}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Restricciones{" "}
                {displayLookupValue(licenseResult.restrictions)}
              </p>
            </div>
          )}
        </div>
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
        <DocumentFileCard
          title="Brevete (MTC)"
          description="Consulta la licencia digital en el portal del MTC."
          officialLabel="Consultar brevete"
          officialUrl={DIGITAL_LICENSE_URL}
          fileUrl={application.licensePdfUrl ?? null}
          fileLabel="Abrir PDF del brevete"
        />
        <DocumentFileCard
          title="Récord de conductor (MTC)"
          description="Infracciones y estado de la licencia emitidos por el MTC."
          officialLabel="Consultar récord"
          officialUrl={CONDUCTOR_RECORD_URL}
          fileUrl={application.conductorRecordPdfUrl}
          fileLabel="Abrir PDF del récord"
        />
        <DocumentFileCard
          title="CUL (Certificado Único Laboral)"
          description="Documento del Ministerio de Trabajo."
          officialLabel="Consultar en gob.pe"
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
          className={`${btnSecondaryClass} w-full`}
        >
          {officialLabel}
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
