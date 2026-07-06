import { useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { btnPrimaryClass, cardClass, inputClass, labelClass } from "../lib/adminUi";
import { EyeIcon, EyeOffIcon } from "./icons/EyeIcons";

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
      setError("Correo o contraseña incorrectos.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-admin-surface">
      <header className="border-b border-slate-200/80 bg-white shadow-header">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <img
            src="/hercom-logo.png"
            alt="Hercom"
            className="h-9 w-auto sm:h-10"
          />
          <span className="hidden h-5 w-px bg-slate-200 sm:block" aria-hidden />
          <span className="hidden text-sm font-semibold text-slate-500 sm:inline">
            Admin
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className={`w-full max-w-[400px] ${cardClass}`}>
          <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Acceso administrador
          </h1>

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
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
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
              {submitting ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
