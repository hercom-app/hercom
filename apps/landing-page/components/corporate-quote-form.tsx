"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@nextui-org/button";
import { Input, Textarea } from "@nextui-org/input";
import { useAction } from "convex/react";

import { submitCorporateQuote } from "@/lib/convexApi";
import { formatConvexError } from "@/lib/convexError";
import SolicitudImg from "@/assets/solicitud-recibida.png";
import {
  PERU_DEPARTMENTS,
  listDistrictsForProvince,
  listProvincesForDepartment,
} from "@proyecto/peru-locations";

type ServicePoint = {
  department: string;
  province: string;
  district: string;
  date: string;
};

const emptyPoint: ServicePoint = {
  department: "",
  province: "",
  district: "",
  date: "",
};

function todayInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function formatServiceDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (match === null) return "";
  const parsed = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  const label = new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(parsed);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const empty = {
  companyName: "",
  contactName: "",
  ruc: "",
  email: "",
  phone: "",
  driverCount: "",
  serviceHours: "",
  detail: "",
};

const RUC_LENGTH = 11;
const PHONE_LENGTH = 9;

const fieldClass =
  "w-full rounded-xl bg-default-100 px-3 py-2.5 text-sm text-foreground outline-none";

function normalizeRuc(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, RUC_LENGTH);
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, PHONE_LENGTH);
}

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function exactOption(value: string, options: readonly string[]): string | undefined {
  const folded = fold(value);
  if (folded === "") return undefined;
  return options.find((option) => fold(option) === folded);
}

function resolvePoint(point: ServicePoint): ServicePoint | null {
  const department = exactOption(point.department, PERU_DEPARTMENTS);
  if (department === undefined) return null;
  const province = exactOption(point.province, listProvincesForDepartment(department));
  if (province === undefined) return null;
  const districts = listDistrictsForProvince(department, province);
  const district =
    districts.length === 0 ? point.district.trim() : exactOption(point.district, districts);
  if (district === undefined || district === "") return null;
  return { ...point, department, province, district };
}

function SuggestInput({
  label,
  value,
  options,
  disabled,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  disabled?: boolean;
  placeholder: string;
  onChange: (next: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const folded = fold(value);
  const matches =
    folded === ""
      ? options.slice(0, 8)
      : options.filter((option) => fold(option).includes(folded)).slice(0, 8);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function commit(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      <label className="block">
        <span className="mb-1.5 block text-sm">{label}</span>
        <input
          required
          aria-autocomplete="list"
          aria-expanded={open}
          autoComplete="off"
          className={`${fieldClass} h-11 disabled:cursor-not-allowed disabled:opacity-60`}
          disabled={disabled}
          placeholder={placeholder}
          role="combobox"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => {
            if (!disabled) setOpen(true);
          }}
          onBlur={() => {
            const exact = exactOption(value, options);
            if (exact !== undefined && exact !== value) onChange(exact);
          }}
          onKeyDown={(event) => {
            if (disabled || matches.length === 0) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActive((index) => Math.min(index + 1, matches.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && open && matches[active] !== undefined) {
              event.preventDefault();
              commit(matches[active]);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </label>
      {open && !disabled && matches.length > 0 && (
        <ul
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-default-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {matches.map((option, index) => (
            <li key={option}>
              <button
                className={`block min-h-11 w-full px-3 py-2.5 text-left text-sm ${
                  index === active ? "bg-primary/10 text-primary" : "text-foreground"
                }`}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  commit(option);
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ServicePointFields({
  legend,
  value,
  onChange,
}: {
  legend: string;
  value: ServicePoint;
  onChange: (next: ServicePoint) => void;
}) {
  const department = exactOption(value.department, PERU_DEPARTMENTS);
  const provinces =
    department === undefined ? [] : listProvincesForDepartment(department);
  const province = exactOption(value.province, provinces);
  const districts =
    department === undefined || province === undefined
      ? []
      : listDistrictsForProvince(department, province);
  const freeDistrict = province !== undefined && districts.length === 0;
  const dateLabel = value.date === "" ? "" : formatServiceDate(value.date);
  const inThePast = value.date !== "" && value.date < todayInputValue();

  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-3 text-sm font-semibold">{legend}</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block min-w-0">
          <span className="mb-1.5 block text-sm">Fecha</span>
          <input
            required
            className={`${fieldClass} h-11 [color-scheme:light]`}
            min={todayInputValue()}
            type="date"
            value={value.date}
            onChange={(event) => onChange({ ...value, date: event.target.value })}
          />
        </label>
        <SuggestInput
          label="Departamento"
          options={PERU_DEPARTMENTS}
          placeholder="Escribe y elige"
          value={value.department}
          onChange={(next) => {
            const picked = exactOption(next, PERU_DEPARTMENTS);
            const same = picked !== undefined && picked === department;
            onChange({
              ...value,
              department: next,
              province: same ? value.province : "",
              district: same ? value.district : "",
            });
          }}
        />
        <SuggestInput
          disabled={department === undefined}
          label="Provincia"
          options={provinces}
          placeholder={department === undefined ? "Primero el departamento" : "Escribe y elige"}
          value={value.province}
          onChange={(next) => {
            const picked = exactOption(next, provinces);
            const same = picked !== undefined && picked === province;
            onChange({
              ...value,
              province: next,
              district: same ? value.district : "",
            });
          }}
        />
        {freeDistrict ? (
          <label className="block min-w-0">
            <span className="mb-1.5 block text-sm">Distrito</span>
            <input
              required
              className={`${fieldClass} h-11`}
              placeholder="Escribe el distrito"
              value={value.district}
              onChange={(event) => onChange({ ...value, district: event.target.value })}
            />
          </label>
        ) : (
          <SuggestInput
            disabled={province === undefined}
            label="Distrito"
            options={districts}
            placeholder={province === undefined ? "Primero la provincia" : "Escribe y elige"}
            value={value.district}
            onChange={(next) => onChange({ ...value, district: next })}
          />
        )}
      </div>
      {dateLabel !== "" && (
        <p className={`mt-2 text-sm ${inThePast ? "text-danger" : "text-default-500"}`}>
          {inThePast ? "Elige una fecha de hoy en adelante. " : ""}
          {dateLabel}
        </p>
      )}
    </fieldset>
  );
}

export function CorporateQuoteForm() {
  const submit = useAction(submitCorporateQuote);
  const [values, setValues] = useState(empty);
  const [origin, setOrigin] = useState<ServicePoint>(emptyPoint);
  const [destination, setDestination] = useState<ServicePoint>(emptyPoint);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"sent" | "saved" | null>(null);
  const [rucBlurred, setRucBlurred] = useState(false);
  const [phoneBlurred, setPhoneBlurred] = useState(false);

  const rucComplete = values.ruc.length === RUC_LENGTH;
  const phoneComplete = values.phone.length === PHONE_LENGTH;
  const rucProgress =
    values.ruc.length > 0 && !rucComplete && !rucBlurred
      ? `${values.ruc.length}/${RUC_LENGTH} dígitos`
      : undefined;
  const rucFieldError =
    rucBlurred && !rucComplete
      ? values.ruc.length === 0
        ? "Ingresa el RUC de 11 dígitos."
        : "El RUC debe tener 11 dígitos."
      : undefined;
  const phoneProgress =
    values.phone.length > 0 && !phoneComplete && !phoneBlurred
      ? `${values.phone.length}/${PHONE_LENGTH} dígitos`
      : undefined;
  const phoneFieldError =
    phoneBlurred && !phoneComplete
      ? values.phone.length === 0
        ? "Ingresa el teléfono de 9 dígitos."
        : "El teléfono debe tener 9 dígitos."
      : undefined;

  function setField(key: keyof typeof empty, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!rucComplete) {
      setRucBlurred(true);
      setError("El RUC debe tener 11 dígitos.");
      return;
    }

    if (!phoneComplete) {
      setPhoneBlurred(true);
      setError("El teléfono debe tener 9 dígitos.");
      return;
    }

    const drivers = Number(values.driverCount);
    if (!Number.isFinite(drivers) || drivers < 1) {
      setError("Indica la cantidad de choferes.");
      return;
    }

    if (values.detail.trim() === "") {
      setError("Completa el detalle del viaje.");
      return;
    }

    const originPoint = resolvePoint(origin);
    const destinationPoint = resolvePoint(destination);
    if (originPoint === null || destinationPoint === null) {
      setError("Elige departamento, provincia y distrito de la lista.");
      return;
    }

    if (origin.date === "" || destination.date === "") {
      setError("Indica la fecha de inicio y la fecha de fin.");
      return;
    }
    if (origin.date < todayInputValue()) {
      setError("La fecha de inicio debe ser de hoy en adelante.");
      return;
    }
    if (destination.date < origin.date) {
      setError("La fecha de fin no puede ser anterior a la fecha de inicio.");
      return;
    }

    const serviceHours = Number(values.serviceHours);
    if (!Number.isFinite(serviceHours) || serviceHours < 1) {
      setError("Indica las horas aproximadas del servicio.");
      return;
    }

    setPending(true);
    try {
      const result = await submit({
        companyName: values.companyName,
        contactName: values.contactName,
        ruc: values.ruc,
        email: values.email,
        phone: values.phone,
        originDepartment: originPoint.department,
        originProvince: originPoint.province,
        originDistrict: originPoint.district,
        destinationDepartment: destinationPoint.department,
        destinationProvince: destinationPoint.province,
        destinationDistrict: destinationPoint.district,
        serviceStart: origin.date,
        serviceEnd: destination.date,
        serviceHours,
        driverCount: Number(values.driverCount),
        detail: values.detail,
      });
      setDone(result.emailSent ? "sent" : "saved");
      setValues(empty);
      setOrigin(emptyPoint);
      setDestination(emptyPoint);
      setRucBlurred(false);
      setPhoneBlurred(false);
    } catch (cause) {
      setError(formatConvexError(cause, "No pudimos enviar la solicitud."));
    } finally {
      setPending(false);
    }
  }

  if (done !== null) {
    return (
      <div className="flex flex-col items-center gap-8 rounded-3xl bg-default-100 p-8 sm:flex-row sm:items-center lg:gap-12 lg:p-12">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold tracking-tight">
            Recibimos tu solicitud
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-default-600">
            {done === "sent"
              ? "Hemos enviado una confirmación de esta solicitud a tu correo. Un ejecutivo de HERCOM se pondrá en contacto contigo."
              : "Guardamos tu solicitud. El correo de confirmación no pudo salir en este momento. Un ejecutivo de HERCOM se pondrá en contacto contigo."}
          </p>
          <Button
            className="mt-8"
            color="primary"
            radius="full"
            onPress={() => setDone(null)}
          >
            Enviar otra solicitud
          </Button>
        </div>
        <Image
          alt=""
          className="h-auto w-full max-w-[280px] shrink-0 sm:max-w-[320px]"
          src={SolicitudImg}
        />
      </div>
    );
  }

  return (
    <form
      className="rounded-3xl border border-default-200 p-6 sm:p-8 lg:p-10"
      onSubmit={onSubmit}
    >
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
        <ServicePointFields
          legend="Origen del servicio"
          value={origin}
          onChange={setOrigin}
        />
        <ServicePointFields
          legend="Destino del servicio"
          value={destination}
          onChange={setDestination}
        />
        <Input
          isRequired
          label="Nombre de contacto"
          labelPlacement="outside"
          placeholder="Quién coordina el viaje"
          value={values.contactName}
          onValueChange={(value) => setField("contactName", value)}
        />
        <Input
          label="Empresa"
          labelPlacement="outside"
          placeholder="Nombre de la empresa"
          value={values.companyName}
          onValueChange={(value) => setField("companyName", value)}
        />
        <Input
          isRequired
          description={rucProgress}
          errorMessage={rucFieldError}
          isInvalid={rucFieldError !== undefined}
          label="RUC"
          labelPlacement="outside"
          inputMode="numeric"
          maxLength={RUC_LENGTH}
          placeholder="11 dígitos"
          value={values.ruc}
          onBlur={() => setRucBlurred(true)}
          onValueChange={(value) => setField("ruc", normalizeRuc(value))}
        />
        <Input
          isRequired
          description={phoneProgress}
          errorMessage={phoneFieldError}
          isInvalid={phoneFieldError !== undefined}
          label="Teléfono"
          labelPlacement="outside"
          inputMode="numeric"
          maxLength={PHONE_LENGTH}
          placeholder="9 dígitos"
          value={values.phone}
          onBlur={() => setPhoneBlurred(true)}
          onValueChange={(value) => setField("phone", normalizePhone(value))}
        />
        <Input
          isRequired
          className="sm:col-span-2"
          label="Correo"
          labelPlacement="outside"
          placeholder="correo@empresa.com"
          type="email"
          value={values.email}
          onValueChange={(value) => setField("email", value)}
        />
        <Input
          isRequired
          label="Horas aproximadas"
          labelPlacement="outside"
          min={1}
          step={1}
          type="number"
          value={values.serviceHours}
          onValueChange={(value) => setField("serviceHours", value)}
        />
        <Input
          isRequired
          label="Cantidad de choferes"
          labelPlacement="outside"
          min={1}
          step={1}
          type="number"
          value={values.driverCount}
          onValueChange={(value) => setField("driverCount", value)}
        />
        <Textarea
          isRequired
          className="sm:col-span-2"
          label="Detalle del viaje"
          labelPlacement="outside"
          minRows={4}
          placeholder="Lo que debamos saber del viaje"
          value={values.detail}
          onValueChange={(value) => setField("detail", value)}
        />
      </div>
      {error !== "" && (
        <p className="mt-6 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <div className="mt-8 flex sm:justify-end">
        <Button
          className="w-full sm:w-auto"
          color="primary"
          isDisabled={!rucComplete || !phoneComplete}
          isLoading={pending}
          radius="full"
          type="submit"
        >
          Solicitar cotización
        </Button>
      </div>
    </form>
  );
}