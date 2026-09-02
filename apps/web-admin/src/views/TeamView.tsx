import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import { RegionFields } from "../components/RegionFields";
import {
  AdminCard,
  AdminEmpty,
  AdminLoading,
  AdminPage,
  AdminPageHeader,
} from "../components/AdminLayout";
import {
  btnPrimaryClass,
  btnSecondaryClass,
  inputClass,
  labelClass,
} from "../lib/adminUi";
import { DEFAULT_COUNTRY_CODE } from "../lib/adminFilters";

export type DistrictDraft = {
  countryCode: string;
  department: string;
  province: string;
  district: string;
};

const EMPTY_DRAFT: DistrictDraft = {
  countryCode: DEFAULT_COUNTRY_CODE,
  department: "",
  province: "",
  district: "",
};

function districtKey(item: DistrictDraft): string {
  return `${item.countryCode}|${item.department}|${item.province}|${item.district}`;
}

export function DistrictPicker({
  districts,
  onChange,
}: {
  districts: DistrictDraft[];
  onChange: (next: DistrictDraft[]) => void;
}) {
  const [draft, setDraft] = useState<DistrictDraft>(EMPTY_DRAFT);

  function addDistrict() {
    if (
      draft.department === "" ||
      draft.province === "" ||
      draft.district === ""
    ) {
      return;
    }
    const key = districtKey(draft);
    if (districts.some((item) => districtKey(item) === key)) {
      setDraft(EMPTY_DRAFT);
      return;
    }
    onChange([...districts, draft]);
    setDraft(EMPTY_DRAFT);
  }

  return (
    <div className="space-y-3">
      <RegionFields
        countryCode={draft.countryCode}
        department={draft.department}
        province={draft.province}
        district={draft.district}
        onCountryCodeChange={(value) =>
          setDraft({
            countryCode: value,
            department: "",
            province: "",
            district: "",
          })
        }
        onDepartmentChange={(value) =>
          setDraft((previous) => ({
            ...previous,
            department: value,
            province: "",
            district: "",
          }))
        }
        onProvinceChange={(value) =>
          setDraft((previous) => ({
            ...previous,
            province: value,
            district: "",
          }))
        }
        onDistrictChange={(value) =>
          setDraft((previous) => ({ ...previous, district: value }))
        }
        provinceOptionalLabel="Provincia"
        districtOptionalLabel="Distrito"
      />
      <button
        type="button"
        onClick={addDistrict}
        disabled={
          draft.department === "" ||
          draft.province === "" ||
          draft.district === ""
        }
        className={`${btnSecondaryClass} w-full sm:w-auto`}
      >
        Agregar distrito
      </button>
      {districts.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Aún no hay distritos. Puedes mezclar provincias distintas.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {districts.map((item) => (
            <li
              key={districtKey(item)}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700"
            >
              <span>
                {item.district}, {item.province}, {item.department}
              </span>
              <button
                type="button"
                className="font-semibold text-zinc-500 hover:text-zinc-900"
                onClick={() =>
                  onChange(
                    districts.filter(
                      (district) => districtKey(district) !== districtKey(item),
                    ),
                  )
                }
                aria-label="Quitar distrito"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CreateAdminUserForm({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const createAdmin = useMutation(api.users.createAdminUser);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPasswordState] = useState("");
  const [districts, setDistricts] = useState<DistrictDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createAdmin({
        name,
        email,
        password,
        districts,
      });
      setName("");
      setEmail("");
      setPasswordState("");
      setDistricts([]);
      onCreated?.();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "No se pudo crear el usuario.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleCreate} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Nombre</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
            required
          />
        </label>
        <label className="block">
          <span className={labelClass}>Correo</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
            required
          />
        </label>
      </div>
      <label className="block max-w-md">
        <span className={labelClass}>Clave (mín. 8 caracteres)</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPasswordState(event.target.value)}
          className={inputClass}
          minLength={8}
          required
        />
      </label>
      <div>
        <p className={labelClass}>Distritos asignados</p>
        <DistrictPicker districts={districts} onChange={setDistricts} />
      </div>
      {error !== null && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={saving || districts.length === 0}
        className={`${btnPrimaryClass} w-full sm:w-auto`}
      >
        {saving ? "Creando…" : "Crear usuario"}
      </button>
    </form>
  );
}

export function TeamView() {
  const admins = useQuery(api.users.listAdmins);
  const updateDistricts = useMutation(api.users.updateAdminDistricts);
  const setPassword = useMutation(api.users.setAdminPassword);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<Id<"users"> | null>(null);
  const [editingDistricts, setEditingDistricts] = useState<DistrictDraft[]>([]);
  const [newPassword, setNewPassword] = useState("");

  async function handleSaveDistricts(userId: Id<"users">) {
    setError(null);
    try {
      await updateDistricts({ userId, districts: editingDistricts });
      setEditingId(null);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "No se pudieron guardar los distritos.",
      );
    }
  }

  async function handlePassword(userId: Id<"users">) {
    setError(null);
    try {
      await setPassword({ userId, password: newPassword });
      setNewPassword("");
    } catch (passwordError) {
      setError(
        passwordError instanceof Error
          ? passwordError.message
          : "No se pudo cambiar la clave.",
      );
    }
  }

  return (
    <AdminPage>
      <AdminPageHeader
        title="Equipo interno"
        description="Crea admins con su clave y asígnales uno o varios distritos, incluso de distintas provincias. Cada admin solo verá servicios e ingresos de esas zonas."
      />

      <AdminCard>
        <h3 className="text-base font-semibold text-zinc-900">Nuevo admin</h3>
        <div className="mt-4">
          <CreateAdminUserForm />
        </div>
      </AdminCard>

      <AdminCard>
        <h3 className="text-base font-semibold text-zinc-900">Admins creados</h3>
        {error !== null && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {admins === undefined ? (
          <AdminLoading message="Cargando equipo…" />
        ) : admins.length === 0 ? (
          <AdminEmpty message="Todavía no hay admins operativos." />
        ) : (
          <ul className="mt-4 divide-y divide-zinc-100">
            {admins.map((admin) => {
              const isEditing = editingId === admin._id;
              return (
                <li key={admin._id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-zinc-900">
                        {admin.name ?? "Sin nombre"}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {admin.email ?? "—"}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                        {admin.districtScopes.length === 0
                          ? "Sin distritos (acceso legado total). Asigna zonas para limitarlo."
                          : admin.districtScopes
                              .map(
                                (scope) =>
                                  `${scope.district} (${scope.province})`,
                              )
                              .join(" · ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`${btnSecondaryClass} w-full sm:w-auto`}
                      onClick={() => {
                        if (isEditing) {
                          setEditingId(null);
                          return;
                        }
                        setEditingId(admin._id);
                        setEditingDistricts(admin.districtScopes);
                        setNewPassword("");
                      }}
                    >
                      {isEditing ? "Cerrar" : "Editar"}
                    </button>
                  </div>
                  {isEditing ? (
                    <div className="mt-4 space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                      <DistrictPicker
                        districts={editingDistricts}
                        onChange={setEditingDistricts}
                      />
                      <button
                        type="button"
                        className={`${btnPrimaryClass} w-full sm:w-auto`}
                        onClick={() => void handleSaveDistricts(admin._id)}
                      >
                        Guardar distritos
                      </button>
                      <div className="flex max-w-md flex-col gap-2 sm:flex-row sm:items-end">
                        <label className="block flex-1">
                          <span className={labelClass}>Nueva clave</span>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(event) =>
                              setNewPassword(event.target.value)
                            }
                            className={inputClass}
                            minLength={8}
                          />
                        </label>
                        <button
                          type="button"
                          className={`${btnSecondaryClass} w-full sm:w-auto`}
                          disabled={newPassword.length < 8}
                          onClick={() => void handlePassword(admin._id)}
                        >
                          Actualizar clave
                        </button>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
    </AdminPage>
  );
}
