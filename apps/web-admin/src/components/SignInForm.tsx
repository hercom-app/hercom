import { useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { btnPrimaryClass, inputClass, labelClass } from "../lib/adminUi";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);
    formData.set("flow", "signIn");
    try {
      await signIn("password", formData);
    } catch {
      setError("Credenciales inválidas.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="relative flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-10 text-white sm:px-10 lg:w-[42%] lg:px-12 lg:py-14">
        <div>
          <img
            src="/hercom-logo.png"
            alt="Hercom"
            className="h-10 w-auto brightness-0 invert sm:h-12"
          />
          <p className="mt-8 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Panel de operaciones
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
            Supervisión de cuentas, viajes, recargas y cierre financiero para el
            equipo Hercom.
          </p>
        </div>
        <p className="mt-10 text-xs text-slate-400 lg:mt-0">
          Acceso restringido · Solo personal autorizado
        </p>
        <div
          className="pointer-events-none absolute -right-16 top-1/3 h-56 w-56 rounded-full bg-hercom/20 blur-3xl"
          aria-hidden
        />
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <img
              src="/hercom-logo.png"
              alt="Hercom"
              className="mx-auto h-12 w-auto"
            />
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Acceso administrador
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ingresa con tu cuenta corporativa Hercom.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="admin-email" className={labelClass}>
                  Correo
                </label>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="nombre@hercom.pe"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="admin-password" className={labelClass}>
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`${inputClass} pr-16`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              {error !== null && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`${btnPrimaryClass} w-full py-3`}
              >
                {submitting ? "Entrando…" : "Entrar al panel"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
