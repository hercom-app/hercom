import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import { DriverPayoutConfig } from "./DriverPayoutConfig";
import {
  DocumentPreviewModal,
  type PreviewFile,
} from "./DocumentPreviewModal";
import {
  TacticalLabel,
  TacticalPanel,
  TacticalStatus,
  TacticalText,
  TacticalTitle,
  TacticalValue,
} from "./tactical";
import { TACTICAL_COLORS, TACTICAL_RADIUS } from "../constants/theme";

type DriverPayoutFields = {
  fullName?: string;
  dni?: string;
  yape?: string;
  plin?: string;
  bankAccount1?: string;
  bankAccount2?: string;
  bankAccount3?: string;
};

type DriverMyDataProps = {
  driver: DriverPayoutFields;
  fallbackName?: string;
};

const STATUS_COPY = {
  approved: { label: "Solicitud aceptada", tone: "success" as const },
  pending: { label: "Solicitud en revisión", tone: "warning" as const },
  rejected: { label: "Solicitud rechazada", tone: "danger" as const },
};

const SEX_LABELS = { M: "Masculino", F: "Femenino" } as const;

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

function display(value: string | undefined | null): string {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? "—" : trimmed;
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="mb-3">
      <TacticalLabel className="mb-1">{label}</TacticalLabel>
      <TacticalValue size={14}>{value}</TacticalValue>
    </View>
  );
}

/** Expediente del chofer: solicitud, documentos subidos y datos de cobro. */
export function DriverMyData({
  driver,
  fallbackName = "",
}: DriverMyDataProps) {
  const application = useQuery(api.driverApplications.getMyApplication);
  const [preview, setPreview] = useState<PreviewFile | null>(null);

  if (application === undefined) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator color={TACTICAL_COLORS.accent} />
      </View>
    );
  }

  const status =
    application === null ? null : STATUS_COPY[application.status];
  const photoLabels =
    application?.licenseFormat === "digital"
      ? ["Selfie con brevete impreso"]
      : ["Anverso", "Reverso", "Selfie con brevete"];
  const identityLocked =
    application !== null
      ? {
          fullName: application.fullName,
          dni: application.dni,
        }
      : undefined;

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <TacticalPanel corners className="mb-4">
          <View className="mb-4 flex-row flex-wrap items-start justify-between gap-3">
            <View className="flex-1">
              <TacticalTitle size={16}>Registro de chofer</TacticalTitle>
              <TacticalText size={12} className="mt-1">
                Datos y documentos que enviaste a Hercom.
              </TacticalText>
            </View>
            {status !== null ? (
              <TacticalStatus label={status.label} tone={status.tone} />
            ) : (
              <TacticalStatus label="Sin solicitud" tone="idle" />
            )}
          </View>

          {application === null ? (
            <TacticalText size={12}>
              No hay una solicitud de registro asociada a esta cuenta.
            </TacticalText>
          ) : (
            <>
              <InfoRow label="Nombre declarado" value={display(application.fullName)} />
              <InfoRow label="DNI" value={display(application.dni)} />
              <InfoRow
                label="Sexo"
                value={SEX_LABELS[application.sex] ?? application.sex}
              />
              <InfoRow
                label="Fecha de nacimiento"
                value={formatBirthDate(application.birthDate)}
              />
              <InfoRow
                label="N.° de brevete"
                value={display(application.licenseNumber)}
              />
              <InfoRow
                label="Categoría"
                value={display(application.licenseCategory)}
              />
              <InfoRow
                label="Formato de brevete"
                value={
                  application.licenseFormat === "digital" ? "Digital" : "Físico"
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
              <InfoRow
                label="Zona de operación"
                value={display(
                  [
                    application.countryCode ?? "PE",
                    application.department,
                    application.province,
                    application.district,
                  ]
                    .filter((part) => part !== undefined && part !== "")
                    .join(" · "),
                )}
              />
              <InfoRow
                label="Enviado"
                value={formatDateTime(application.submittedAt)}
              />
              {application.reviewedAt !== undefined ? (
                <InfoRow
                  label="Revisado"
                  value={formatDateTime(application.reviewedAt)}
                />
              ) : null}
              <InfoRow
                label="Firma digital (datos personales)"
                value={
                  application.personalDataConsentAt !== undefined
                    ? `Autorizada · ${formatDateTime(application.personalDataConsentAt)}`
                    : "No registrada"
                }
              />

              <TacticalLabel className="mb-2 mt-1">Fotos del brevete</TacticalLabel>
              {application.licensePhotoUrls.length === 0 ? (
                <TacticalText size={12} className="mb-3">
                  Sin fotos disponibles.
                </TacticalText>
              ) : (
                <View className="mb-3 flex-row flex-wrap gap-3">
                  {application.licensePhotoUrls.map((url, index) => {
                    const label = photoLabels[index] ?? `Foto ${index + 1}`;
                    return (
                      <TouchableOpacity
                        key={`${url}-${index}`}
                        activeOpacity={0.85}
                        onPress={() =>
                          setPreview({ uri: url, name: label, kind: "image" })
                        }
                      >
                        <TacticalLabel className="mb-1">{label}</TacticalLabel>
                        <Image
                          source={{ uri: url }}
                          style={{
                            width: 112,
                            height: 148,
                            borderRadius: TACTICAL_RADIUS.panel,
                            backgroundColor: TACTICAL_COLORS.surfaceSunken,
                          }}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <TacticalLabel className="mb-2 mt-2">Documentos PDF</TacticalLabel>
              <PdfDocuments
                licensePdfUrl={application.licensePdfUrl}
                conductorRecordPdfUrl={application.conductorRecordPdfUrl}
                culPdfUrl={application.culPdfUrl}
                onOpen={setPreview}
              />
            </>
          )}
        </TacticalPanel>

        <DriverPayoutConfig
          driver={driver}
          fallbackName={fallbackName}
          identityLocked={identityLocked}
        />
      </ScrollView>

      <DocumentPreviewModal file={preview} onClose={() => setPreview(null)} />
    </>
  );
}

function PdfDocuments({
  licensePdfUrl,
  conductorRecordPdfUrl,
  culPdfUrl,
  onOpen,
}: {
  licensePdfUrl: string | null;
  conductorRecordPdfUrl: string | null;
  culPdfUrl: string | null;
  onOpen: (file: PreviewFile) => void;
}) {
  return (
    <>
      {licensePdfUrl !== null ? (
        <DocumentLink
          label="Brevete digital"
          onPress={() =>
            onOpen({ uri: licensePdfUrl, name: "Brevete digital", kind: "pdf" })
          }
        />
      ) : null}
      {conductorRecordPdfUrl !== null ? (
        <DocumentLink
          label="Récord de conductor"
          onPress={() =>
            onOpen({
              uri: conductorRecordPdfUrl,
              name: "Récord de conductor",
              kind: "pdf",
            })
          }
        />
      ) : (
        <TacticalText size={12} className="mb-2">
          Récord de conductor: no se subió PDF.
        </TacticalText>
      )}
      {culPdfUrl !== null ? (
        <DocumentLink
          label="CUL"
          onPress={() => onOpen({ uri: culPdfUrl, name: "CUL", kind: "pdf" })}
        />
      ) : (
        <TacticalText size={12}>CUL: no se subió PDF.</TacticalText>
      )}
    </>
  );
}

function DocumentLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="mb-2 px-4 py-3"
      style={{
        backgroundColor: TACTICAL_COLORS.dataBandBg,
        borderRadius: TACTICAL_RADIUS.panel,
      }}
    >
      <TacticalValue size={13} tone="accent">
        {label}
      </TacticalValue>
    </TouchableOpacity>
  );
}
