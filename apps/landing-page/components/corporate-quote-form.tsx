"use client";

import { FormEvent, useState } from "react";
import { Button } from "@nextui-org/button";
import { Input, Textarea } from "@nextui-org/input";
import { useAction } from "convex/react";

import { submitCorporateQuote } from "@/lib/convexApi";
import { formatConvexError } from "@/lib/convexError";
import {
  PERU_DEPARTMENTS,
  listDistrictsForProvince,
  listProvincesForDepartment,
} from "@proyecto/peru-locations";

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

const RUC_LENGTH = 11;

const fieldClass =
  "w-full rounded-xl bg-default-100 px-3 py-2.5 text-sm text-foreground outline-none";

function normalizeRuc(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, RUC_LENGTH);
}

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
    <fieldset className="sm:col-span-2">
      <legend className="mb-3 text-sm font-semibold">{legend}</legend>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1.5 block text-sm">Departamento</span>
          <select
            required
            className={fieldClass}
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
          <span className="mb-1.5 block text-sm">Provincia</span>
          <select
            required
            className={fieldClass}
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
          <span className="mb-1.5 block text-sm">Distrito</span>
          {typedDistrict ? (
            <input
              required
              className={fieldClass}
              placeholder="Escribe el distrito"
              value={value.district}
              onChange={(event) =>
                onChange({ ...value, district: event.target.value })
              }
            />
          ) : (
            <select
              required
              className={fieldClass}
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
          <span className="mb-1.5 block text-sm">{timeLabel}</span>
          <input
            required
            className={fieldClass}
            type="datetime-local"
            value={value.at}
            onChange={(event) => onChange({ ...value, at: event.target.value })}
          />
        </label>
      </div>
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

  const rucComplete = values.ruc.length === RUC_LENGTH;
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

    const drivers = Number(values.driverCount);
    if (!Number.isFinite(drivers) || drivers < 1) {
      setError("Indica la cantidad de choferes.");
      return;
    }

    if (values.detail.trim() === "") {
      setError("Completa el detalle del viaje.");
      return;
    }

    if (
      origin.department === "" ||
      origin.province === "" ||
      origin.district === "" ||
      destination.department === "" ||
      destination.province === "" ||
      destination.district === ""
    ) {
      setError("Elige el origen y el destino del servicio.");
      return;
    }

    if (origin.at === "" || destination.at === "") {
      setError("Indica la hora de inicio y la hora de fin.");
      return;
    }

    const startMs = Date.parse(origin.at);
    const endMs = Date.parse(destination.at);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      setError("Indica hora de inicio y hora de fin válidas.");
      return;
    }
    if (endMs <= startMs) {
      setError("La hora de fin debe ser posterior a la hora de inicio.");
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
      });
      setDone(result.emailSent ? "sent" : "saved");
      setValues(empty);
      setOrigin(emptyPoint);
      setDestination(emptyPoint);
      setRucBlurred(false);
    } catch (cause) {
      setError(formatConvexError(cause, "No pudimos enviar la solicitud."));
    } finally {
      setPending(false);
    }
  }

  if (done !== null) {
    return (
      <div className="rounded-3xl bg-default-100 p-8 lg:p-12">
        <h2 className="text-2xl font-bold tracking-tight">
          Recibimos tu solicitud
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-default-600">
          {done === "sent"
            ? "Te enviamos la confirmación al correo que indicaste. Un ejecutivo de HERCOM revisará el viaje y te escribirá con la cotización."
            : "Guardamos tu solicitud. El correo de confirmación no pudo salir en este momento; un ejecutivo de HERCOM te contactará con la cotización."}
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
    );
  }

  return (
    <form
      className="rounded-3xl border border-default-200 p-6 sm:p-8 lg:p-10"
      onSubmit={onSubmit}
    >
      <div className="grid gap-8 sm:grid-cols-2">
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
          label="Teléfono"
          labelPlacement="outside"
          placeholder="999 999 999"
          value={values.phone}
          onValueChange={(value) => setField("phone", value)}
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
        <Input
          isRequired
          className="sm:col-span-2"
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
      <div className="mt-8 flex justify-end">
        <Button
          color="primary"
          isDisabled={!rucComplete}
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