import { FormEvent, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@proyecto/backend";
import {
  PERU_DEPARTMENTS,
  listDistrictsForProvince,
  listProvincesForDepartment,
} from "@proyecto/backend/peruLocations";
import {
  btnPrimaryClass,
  btnSecondaryClass,
  inputClass,
  labelClass,
  selectClass,
} from "../lib/adminUi";

type ServicePoint = {
  department: string;
  province: string;
  district: string;
  at: string;
};

const emptyPoint: ServicePoint = {
  department: "",
  province: "",
  district: "",
  at: "",
};

const empty = {
  companyName: "",
  contactName: "",
  ruc: "",
  email: "",
  phone: "",
  driverCount: "",
  detail: "",
};

function ServicePointFields({
  legend,
  timeLabel,
  value,
  onChange,
}: {
  legend: string;
  timeLabel: string;
  value: ServicePoint;
  onChange: (next: ServicePoint) => void;
}) {
  const provinces = listProvincesForDepartment(value.department);
  const districts = listDistrictsForProvince(value.department, value.province);
  const typedDistrict = districts.length === 0 && value.province !== "";

  return (
    <fieldset className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
      <legend className="px-1 text-sm font-semibold text-zinc-900">{legend}</legend>
      <div className="mt-3 grid gap-3 lg:grid-cols-4">
        <label className="block">
          <span className={labelClass}>Departamento</span>
          <select
            required
            className={selectClass}
            value={value.department}
            onChange={(event) =>
              onChange({
                ...value,
                department: event.target.value,
                province: "",
                district: "",
              })
            }
          >
            <option value="">Elige</option>
            {PERU_DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Provincia</span>
          <select
            required
            className={selectClass}
            disabled={value.department === ""}
            value={value.province}
            onChange={(event) =>
              onChange({ ...value, province: event.target.value, district: "" })
            }
          >
            <option value="">Elige</option>
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Distrito</span>
          {typedDistrict ? (
            <input
              required
              className={inputClass}
              placeholder="Escribe el distrito"
              value={value.district}
              onChange={(event) =>
                onChange({ ...value, district: event.target.value })
              }
            />
          ) : (
            <select
              required
              className={selectClass}
              disabled={value.province === ""}
              value={value.district}
              onChange={(event) =>
                onChange({ ...value, district: event.target.value })
              }
            >
              <option value="">Elige</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          )}
        </label>
        <label className="block">
          <span className={labelClass}>{timeLabel}</span>
          <input
            required
            className={inputClass}
            type="datetime-local"
            value={value.at}
            onChange={(event) => onChange({ ...value, at: event.target.value })}
          />
        </label>
      </div>
    </fieldset>
  );
}

type CorporateQuoteAdminFormProps = {
  onDone?: (emailSent: boolean) => void;
  onCancel?: () => void;
};

export function CorporateQuoteAdminForm({
  onDone,
  onCancel,
}: CorporateQuoteAdminFormProps) {
  const createQuote = useAction(api.corporateQuotes.createFromAdmin);
  const [values, setValues] = useState(empty);
  const [origin, setOrigin] = useState<ServicePoint>(emptyPoint);
  const [destination, setDestination] = useState<ServicePoint>(emptyPoint);
  const [sendConfirmation, setSendConfirmation] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function setField(key: keyof typeof empty, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const result = await createQuote({
        companyName: values.companyName,
        contactName: values.contactName,
        ruc: values.ruc,
        email: values.email,
        phone: values.phone,
        originDepartment: origin.department,
        originProvince: origin.province,
        originDistrict: origin.district,
        destinationDepartment: destination.department,
        destinationProvince: destination.province,
        destinationDistrict: destination.district,
        serviceStart: origin.at,
        serviceEnd: destination.at,
        driverCount: Number(values.driverCount),
        detail: values.detail,
        sendConfirmation,
      });
      onDone?.(result.emailSent);
      setValues(empty);
      setOrigin(emptyPoint);
      setDestination(emptyPoint);
      setSendConfirmation(true);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "No se pudo crear la cotización.";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <h3 className="font-display text-lg font-bold tracking-tight text-slate-900">
        Nueva cotización manual
      </h3>
      <p className="text-sm text-zinc-500">
        Para solicitudes por teléfono u otro canal. Las horas se calculan entre
        inicio y fin.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Nombre de contacto *</span>
          <input
            required
            className={inputClass}
            value={values.contactName}
            onChange={(event) => setField("contactName", event.target.value)}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Empresa</span>
          <input
            className={inputClass}
            value={values.companyName}
            onChange={(event) => setField("companyName", event.target.value)}
          />
        </label>
        <label className="block">
          <span className={labelClass}>RUC *</span>
          <input
            required
            className={inputClass}
            inputMode="numeric"
            maxLength={11}
            value={values.ruc}
            onChange={(event) =>
              setField("ruc", event.target.value.replace(/\D/g, "").slice(0, 11))
            }
          />
        </label>
        <label className="block">
          <span className={labelClass}>Teléfono *</span>
          <input
            required
            className={inputClass}
            value={values.phone}
            onChange={(event) => setField("phone", event.target.value)}
          />
        </label>
        <label className="block md:col-span-2">
          <span className={labelClass}>Correo *</span>
          <input
            required
            className={inputClass}
            type="email"
            value={values.email}
            onChange={(event) => setField("email", event.target.value)}
          />
        </label>
      </div>
      <ServicePointFields
        legend="Origen del servicio"
        timeLabel="Hora de inicio"
        value={origin}
        onChange={setOrigin}
      />
      <ServicePointFields
        legend="Destino del servicio"
        timeLabel="Hora de fin"
        value={destination}
        onChange={setDestination}
      />
      <label className="block">
        <span className={labelClass}>Cantidad de choferes *</span>
        <input
          required
          className={`${inputClass} max-w-xs`}
          min={1}
          step={1}
          type="number"
          value={values.driverCount}
          onChange={(event) => setField("driverCount", event.target.value)}
        />
      </label>
      <label className="block">
        <span className={labelClass}>Detalle del viaje *</span>
        <textarea
          required
          className={`${inputClass} min-h-28 resize-y`}
          value={values.detail}
          onChange={(event) => setField("detail", event.target.value)}
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={sendConfirmation}
          onChange={(event) => setSendConfirmation(event.target.checked)}
          className="h-4 w-4 rounded border-zinc-300"
        />
        Enviar correo de confirmación al cliente
      </label>
      {error !== "" && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className={btnPrimaryClass}>
          {pending ? "Guardando…" : "Generar cotización"}
        </button>
        {onCancel !== undefined && (
          <button type="button" onClick={onCancel} className={btnSecondaryClass}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}