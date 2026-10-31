import { useEffect, useState } from "react";
import { useAction, useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@proyecto/backend";
import {
  btnPrimaryClass,
  btnSecondaryClass,
  inputClass,
  labelClass,
} from "../lib/adminUi";
import { errorDetail, formatConvexError } from "../lib/convexError";
import {
  CONDUCTOR_RECORD_URL,
  CUL_INFO_URL,
  DIGITAL_LICENSE_URL,
} from "../lib/officialDocuments";
import { getDriverApprovalAgeBlock } from "@proyecto/backend/age";
import { formatPersonNameForDisplay } from "@proyecto/backend/personName";

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
  birthDate?: string;
  sex?: string;
  address?: string;
  department?: string;
  province?: string;
  district?: string;
  ubigeo?: string;
  civilStatus?: string;
  verificationDigit?: string;
  dataSource?: string;
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
  source: "factiliza" | "verificape";
  fallbackReason?: string;
};

function displayLookupValue(value: string): string {
  const trimmed = formatPersonNameForDisplay(value);
  return trimmed === "" ? "—" : trimmed;
}

function licenseFormatLabel(
  format: DriverApplicationForAdmin["licenseFormat"],
): string {
  if (format === "digital") {
    return "Electrónico (digital)";
  }
  if (format === "physical") {
    return "Físico";
  }
  return "Físico";
}

function LookupResultLine({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <p className={className ?? ""}>
      <span className="font-semibold text-slate-800">{label}:</span>{" "}
      {displayLookupValue(value)}
    </p>
  );
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
  tripCredits: number | undefined;
};

type DriverDossierPanelProps = {
  application: DriverApplicationForAdmin | null;
  userName: string;
  finance: DriverFinanceInfo;
  showFinance?: boolean;
  canEditHrExtras?: boolean;
};

function formatAdditionalLanguages(application: DriverApplicationForAdmin): string {
  const parts = [
    application.additionalLanguage1,
    application.additionalLanguage2,
    application.additionalLanguage3,
    application.additionalLanguage4,
  ]
    .map((value) => value?.trim() ?? "")
    .filter((value) => value !== "");
  return parts.length === 0 ? "—" : parts.join(" · ");
}

export function DriverDossierPanel({
  application,
  userName,
  finance,
  showFinance = true,
  canEditHrExtras = false,
}: DriverDossierPanelProps) {
  const approveApplication = useMutation(api.driverApplications.approve);
  const rejectApplication = useMutation(api.driverApplications.reject);
  const recordAdminLog = useMutation(api.adminLogs.record);
  const lookupDni = useAction(api.verificape.lookupDni);
  const lookupLicense = useAction(api.factiliza.lookupLicense);
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
        {showFinance ? <DriverFinanceCard finance={finance} /> : null}
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
        action: "verificape.lookupDni",
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
        action: "factiliza.lookupLicense",
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
        <InfoRow
          label="Nombre declarado"
          value={displayValue(application.fullName)}
        />
        <InfoRow label="DNI" value={application.dni} />
        <InfoRow
          label="Correo (Google)"
          value={displayValue(application.userEmail ?? undefined)}
        />
        {application.reniecManualEntry === true ? (
          <div className="md:col-span-2">
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
              Nombres ingresados manualmente (RENIEC no disponible al
              registrarse).
            </p>
          </div>
        ) : null}
        <InfoRow label="Sexo" value={SEX_LABELS[application.sex]} />
        <InfoRow
          label="Fecha de nacimiento"
          value={formatBirthDate(application.birthDate)}
        />
        <InfoRow label="N.° brevete" value={application.licenseNumber} />
        <InfoRow label="Categoría brevete" value={application.licenseCategory} />
        <InfoRow
          label="Tipo de brevete (declarado)"
          value={licenseFormatLabel(application.licenseFormat)}
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
            {lookingUpReniec ? "Consultando…" : "Consultar DNI"}
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
          {reniecResult === null ? null : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 md:col-span-2">
              <p className={labelClass}>Consulta DNI</p>
              <div className="mt-2 grid gap-1.5 text-sm text-slate-700 sm:grid-cols-2">
                <LookupResultLine
                  label="Nombre completo"
                  value={reniecResult.fullName}
                  className="sm:col-span-2"
                />
                <LookupResultLine
                  label="DNI"
                  value={
                    reniecResult.verificationDigit !== undefined &&
                    reniecResult.verificationDigit !== ""
                      ? `${reniecResult.documentNumber} (DV ${reniecResult.verificationDigit})`
                      : reniecResult.documentNumber
                  }
                />
                <LookupResultLine
                  label="Fecha de nacimiento"
                  value={formatBirthDate(reniecResult.birthDate)}
                />
                <LookupResultLine
                  label="Sexo"
                  value={reniecResult.sex ?? ""}
                />
                <LookupResultLine
                  label="Nombres"
                  value={reniecResult.firstName}
                />
                <LookupResultLine
                  label="Apellido paterno"
                  value={reniecResult.firstLastName}
                />
                <LookupResultLine
                  label="Apellido materno"
                  value={reniecResult.secondLastName}
                />
                {reniecResult.civilStatus !== undefined &&
                reniecResult.civilStatus !== "" ? (
                  <LookupResultLine
                    label="Estado civil"
                    value={reniecResult.civilStatus}
                  />
                ) : null}
                {reniecResult.ubigeo !== undefined &&
                reniecResult.ubigeo !== "" ? (
                  <LookupResultLine label="Ubigeo" value={reniecResult.ubigeo} />
                ) : null}
                {(reniecResult.department !== undefined &&
                  reniecResult.department !== "") ||
                (reniecResult.province !== undefined &&
                  reniecResult.province !== "") ||
                (reniecResult.district !== undefined &&
                  reniecResult.district !== "") ? (
                  <LookupResultLine
                    className="sm:col-span-2"
                    label="Ubicación"
                    value={[
                      reniecResult.district,
                      reniecResult.province,
                      reniecResult.department,
                    ]
                      .filter(
                        (part): part is string =>
                          part !== undefined && part !== "",
                      )
                      .join(" · ")}
                  />
                ) : null}
                {reniecResult.address !== undefined &&
                reniecResult.address !== "" ? (
                  <LookupResultLine
                    className="sm:col-span-2"
                    label="Dirección"
                    value={reniecResult.address}
                  />
                ) : null}
              </div>
            </div>
          )}
          {licenseResult === null ? null : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 md:col-span-2">
              <p className={labelClass}>Consulta brevete</p>
              {licenseResult.fallbackReason !== undefined &&
              licenseResult.fallbackReason !== "" ? (
                <p className="mb-1 text-xs text-amber-800">
                  {licenseResult.fallbackReason}
                </p>
              ) : null}
              <div className="mt-2 grid gap-1.5 text-sm text-slate-700 sm:grid-cols-2">
                <LookupResultLine
                  label="Nombre completo"
                  value={licenseResult.fullName}
                  className="sm:col-span-2"
                />
                <LookupResultLine
                  label="N.° licencia"
                  value={licenseResult.licenseNumber}
                />
                <LookupResultLine
                  label="Categoría"
                  value={licenseResult.category}
                />
                <LookupResultLine label="Estado" value={licenseResult.status} />
                <LookupResultLine
                  label="Expedición"
                  value={licenseResult.issuedAt}
                />
                <LookupResultLine
                  label="Vencimiento"
                  value={licenseResult.expiresAt}
                />
                <LookupResultLine
                  label="Restricciones"
                  value={licenseResult.restrictions}
                  className="sm:col-span-2"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className={labelClass}>Fotos del brevete</p>
        <p className="mb-2 text-sm font-medium text-slate-800">
          Tipo declarado en la app:{" "}
          <span className="font-semibold text-slate-900">
            {licenseFormatLabel(application.licenseFormat)}
          </span>
        </p>
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
          missingFileMessage={
            application.licenseFormat === "digital"
              ? "El chofer aún no subió el PDF del brevete digital."
              : "No aplica: brevete físico (van las fotos anverso/reverso)."
          }
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

      <div className="mt-5">
        {canEditHrExtras ? (
          <HrProfileExtrasForm application={application} />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Ficha RR.HH.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <InfoRow
                label="Licencia de armas"
                value={displayValue(application.firearmsLicenseNumber)}
              />
              <InfoRow
                label="Idiomas adicionales"
                value={formatAdditionalLanguages(application)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
    {showFinance ? <DriverFinanceCard finance={finance} /> : null}

    {message !== null && (
      <p className="text-sm font-medium text-emerald-700">{message}</p>
    )}
    {error !== null && (
      <p className="text-sm font-medium text-red-600">{error}</p>
    )}

    {application.status === "pending" && (
      <div className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        {ageBlock !== null && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            {ageBlock}
          </p>
        )}
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
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
    </div>
  );
}

function displayValue(value: string | undefined): string {
  const trimmed = formatPersonNameForDisplay(value);
  return trimmed === "" ? "—" : trimmed;
}

function HrProfileExtrasForm({
  application,
}: {
  application: DriverApplicationForAdmin;
}) {
  const updateExtras = useMutation(api.driverApplications.updateHrProfileExtras);
  const [firearmsLicenseNumber, setFirearmsLicenseNumber] = useState(
    application.firearmsLicenseNumber ?? "",
  );
  const [additionalLanguage1, setAdditionalLanguage1] = useState(
    application.additionalLanguage1 ?? "",
  );
  const [additionalLanguage2, setAdditionalLanguage2] = useState(
    application.additionalLanguage2 ?? "",
  );
  const [additionalLanguage3, setAdditionalLanguage3] = useState(
    application.additionalLanguage3 ?? "",
  );
  const [additionalLanguage4, setAdditionalLanguage4] = useState(
    application.additionalLanguage4 ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFirearmsLicenseNumber(application.firearmsLicenseNumber ?? "");
    setAdditionalLanguage1(application.additionalLanguage1 ?? "");
    setAdditionalLanguage2(application.additionalLanguage2 ?? "");
    setAdditionalLanguage3(application.additionalLanguage3 ?? "");
    setAdditionalLanguage4(application.additionalLanguage4 ?? "");
    setSavedMessage(null);
    setError(null);
  }, [application._id]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      await updateExtras({
        applicationId: application._id,
        firearmsLicenseNumber,
        additionalLanguage1,
        additionalLanguage2,
        additionalLanguage3,
        additionalLanguage4,
      });
      setSavedMessage("Datos RR.HH. guardados.");
    } catch (saveError) {
      setError(
        formatConvexError(saveError, "No se pudieron guardar los datos."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">Ficha RR.HH.</p>
      <p className="mt-1 text-xs text-slate-500">
        Completa tras entrevista o revisión documental. No lo ve el postulante en
        la app.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className={labelClass}>Licencia de armas</span>
          <input
            value={firearmsLicenseNumber}
            onChange={(event) => setFirearmsLicenseNumber(event.target.value)}
            placeholder="N.° de licencia o «No tiene»"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Idioma adicional 1</span>
          <input
            value={additionalLanguage1}
            onChange={(event) => setAdditionalLanguage1(event.target.value)}
            placeholder="Ej. Inglés"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Idioma adicional 2</span>
          <input
            value={additionalLanguage2}
            onChange={(event) => setAdditionalLanguage2(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Idioma adicional 3</span>
          <input
            value={additionalLanguage3}
            onChange={(event) => setAdditionalLanguage3(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Idioma adicional 4</span>
          <input
            value={additionalLanguage4}
            onChange={(event) => setAdditionalLanguage4(event.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      {error !== null ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : null}
      {savedMessage !== null ? (
        <p className="mt-3 text-sm text-emerald-700">{savedMessage}</p>
      ) : null}
      <button
        type="button"
        disabled={saving}
        onClick={() => void handleSave()}
        className={`${btnPrimaryClass} mt-4 w-full sm:w-auto`}
      >
        {saving ? "Guardando…" : "Guardar ficha RR.HH."}
      </button>
    </div>
  );
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
            {finance.tripCredits !== undefined ? (
              <InfoRow
                label="Viajes prepagados"
                value={
                  finance.tripCredits === 1
                    ? "1 viaje"
                    : `${finance.tripCredits} viajes`
                }
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
  missingFileMessage = "El chofer aún no subió este PDF.",
}: {
  title: string;
  description: string;
  officialLabel: string;
  officialUrl: string;
  fileUrl: string | null;
  fileLabel: string;
  missingFileMessage?: string;
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
          <p className="text-xs text-slate-500">{missingFileMessage}</p>
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
