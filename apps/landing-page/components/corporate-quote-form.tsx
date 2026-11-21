"use client";

import { FormEvent, useState } from "react";
import { Button } from "@nextui-org/button";
import { Input, Textarea } from "@nextui-org/input";
import { useAction } from "convex/react";

import { submitCorporateQuote } from "@/lib/convexApi";

const empty = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  city: "",
  detail: "",
};

export function CorporateQuoteForm() {
  const submit = useAction(submitCorporateQuote);
  const [values, setValues] = useState(empty);
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
      const result = await submit(values);
      setDone(result.emailSent ? "sent" : "saved");
      setValues(empty);
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
          label="Empresa"
          labelPlacement="outside"
          placeholder="Nombre de la empresa"
          value={values.companyName}
          onValueChange={(value) => setField("companyName", value)}
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
          isRequired
          label="Correo"
          labelPlacement="outside"
          placeholder="correo@empresa.com"
          type="email"
          value={values.email}
          onValueChange={(value) => setField("email", value)}
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
          label="Ciudad"
          labelPlacement="outside"
          placeholder="Lima"
          value={values.city}
          onValueChange={(value) => setField("city", value)}
        />
        <Textarea
          isRequired
          className="sm:col-span-2"
          label="Detalle del viaje"
          labelPlacement="outside"
          minRows={4}
          placeholder="Fecha, origen, destino, cantidad de vehículos y lo que debamos saber"
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
