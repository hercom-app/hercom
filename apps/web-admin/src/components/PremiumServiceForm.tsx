import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import { RegionFields, inputClass } from "./RegionFields";
import { DEFAULT_COUNTRY_CODE } from "../lib/adminFilters";
import { AdminCard } from "./AdminLayout";
import { btnPrimaryClass } from "../lib/adminUi";

export function PremiumServiceForm() {
  const users = useQuery(api.users.listAll, {});
  const createPremiumService = useMutation(api.services.createPremiumServiceAsAdmin);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [department, setDepartment] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");

  const clients = (users ?? []).filter((user) => user.role === "client");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (department === "") {
      setError("Selecciona el departamento del recojo.");
      return;
    }
    setSubmitting(true);
    setMessage(null);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await createPremiumService({
        clientId: String(form.get("clientId")) as Id<"users">,
        origin: {
          address: String(form.get("originAddress")),
          lat: 0,
          lng: 0,
          countryCode,
          department,
          ...(province !== "" ? { province } : {}),
          ...(district !== "" ? { district } : {}),
        },
        destination: {
          address: String(form.get("destinationAddress")),
          lat: 0,
          lng: 0,
        },
        basePrice: Number(form.get("basePrice")),
        requestChannel:
          String(form.get("requestChannel")) === "phone" ? "phone" : "web_comercial",
        ...(String(form.get("notes") ?? "").trim() !== ""
          ? { notes: String(form.get("notes") ?? "").trim() }
          : {}),
      });
      setMessage("Solicitud premium registrada.");
      event.currentTarget.reset();
      setDepartment("");
      setProvince("");
      setDistrict("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo registrar la solicitud premium.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminCard>
      <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">
        Registrar viaje premium
      </h2>
      <p className="mb-4 mt-1 text-sm leading-relaxed text-slate-500">
        Para solicitudes recibidas por teléfono o gestionadas manualmente desde
        operaciones. Quedan etiquetadas como premium en el tablero.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <select
          name="clientId"
          required
          className={inputClass}
          defaultValue=""
        >
          <option value="" disabled>
            Selecciona cliente
          </option>
          {clients.map((client) => (
            <option key={client._id} value={client._id}>
              {client.name ?? client.email ?? client._id}
              {client.email !== undefined ? ` · ${client.email}` : ""}
            </option>
          ))}
        </select>
        <RegionFields
          countryCode={countryCode}
          onCountryCodeChange={setCountryCode}
          department={department}
          province={province}
          district={district}
          onDepartmentChange={setDepartment}
          onProvinceChange={setProvince}
          onDistrictChange={setDistrict}
        />
        <select name="requestChannel" required className={inputClass} defaultValue="phone">
          <option value="phone">Canal: Teléfono</option>
          <option value="web_comercial">Canal: Web comercial (registro manual)</option>
        </select>
        <input
          name="originAddress"
          required
          placeholder="Dirección de origen"
          className={inputClass}
        />
        <input
          name="destinationAddress"
          required
          placeholder="Dirección de destino"
          className={inputClass}
        />
        <input
          name="basePrice"
          type="number"
          min="80"
          step="0.01"
          required
          placeholder="Tarifa base (mínimo S/80)"
          className={inputClass}
        />
        <textarea
          name="notes"
          placeholder="Notas (opcional)"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={submitting || users === undefined}
          className={`${btnPrimaryClass} w-full sm:w-auto`}
        >
          {submitting ? "Registrando…" : "Registrar viaje premium"}
        </button>
        {message !== null && <p className="text-sm text-emerald-700">{message}</p>}
        {error !== null && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </AdminCard>
  );
}
