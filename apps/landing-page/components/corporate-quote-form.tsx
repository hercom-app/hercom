"use client";

import { FormEvent, useState } from "react";
import { Button } from "@nextui-org/button";
import { Input, Textarea } from "@nextui-org/input";
import { useAction } from "convex/react";

import { submitCorporateQuote } from "@/lib/convexApi";
import {
  PERU_DEPARTMENTS,
  listDistrictsForProvince,
  listProvincesForDepartment,
} from "@proyecto/peru-locations";

type Place = {
  department: string;
  province: string;
  district: string;
};

const emptyPlace: Place = { department: "", province: "", district: "" };

const empty = {
  companyName: "",
  contactName: "",
  ruc: "",
  email: "",
  phone: "",
  serviceEnd: "",
  driverCount: "",
  serviceHours: "",
  detail: "",
};

const selectClass =
  "w-full rounded-xl bg-default-100 px-3 py-2.5 text-sm text-foreground outline-none";

function PlaceFields({
  legend,
  value,
  onChange,
}: {
  legend: string;
  value: Place;
  onChange: (next: Place) => void;
}) {
  const provinces = listProvincesForDepartment(value.department);
  const districts = listDistrictsForProvince(value.department, value.province);
  const typedDistrict = districts.length === 0 && value.province !== "";

  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-3 text-sm font-semibold">{legend}</legend>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm">Departamento</span>
          <select
            required
            className={selectClass}
            value={value.department}
            onChange={(event) =>
              onChange({
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
          <span className="mb-1.5 block text-sm">Distrito</span>
          {typedDistrict ? (
            <input
              required
              className={selectClass}
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
      </div>
    </fieldset>
  );
}

export function CorporateQuoteForm() {
  const submit = useAction(submitCorporateQuote);
  const [values, setValues] = useState(empty);
  const [origin, setOrigin] = useState<Place>(emptyPlace);
  const [destination, setDestination] = useState<Place>(emptyPlace);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"sent" | "saved" | null>(null);

  function setField(key: keyof typeof empty, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
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
        serviceEnd: values.serviceEnd,
        driverCount: Number(values.driverCount),
        serviceHours: Number(values.serviceHours),
        detail: values.detail,
      });
      setDone(result.emailSent ? "sent" : "saved");
      setValues(empty);
      setOrigin(emptyPlace);
      setDestination(emptyPlace);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "No pudimos enviar la solicitud.";
      setError(message);
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
          label="RUC"
          labelPlacement="outside"
          inputMode="numeric"
          maxLength={11}
          placeholder="11 dígitos"
          value={values.ruc}
          onValueChange={(value) => setField("ruc", value.replace(/\D/g, "").slice(0, 11))}
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
        <PlaceFields legend="Origen del servicio" value={origin} onChange={setOrigin} />
        <PlaceFields
          legend="Destino del servicio"
          value={destination}
          onChange={setDestination}
        />
        <Input
          isRequired
          className="sm:col-span-2"
          label="Fin del servicio"
          labelPlacement="outside"
          type="datetime-local"
          value={values.serviceEnd}
          onValueChange={(value) => setField("serviceEnd", value)}
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
        <Input
          isRequired
          label="Horas del servicio"
          labelPlacement="outside"
          min={1}
          step={1}
          type="number"
          value={values.serviceHours}
          onValueChange={(value) => setField("serviceHours", value)}
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
        <Button color="primary" isLoading={pending} radius="full" type="submit">
          Solicitar cotización
        </Button>
      </div>
    </form>
  );
}
