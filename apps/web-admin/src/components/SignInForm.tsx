import { useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-hercom focus:ring-1 focus:ring-hercom";

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
    <div className="flex h-full min-h-0 items-center justify-center overflow-hidden bg-white p-6">
      <div className="flex w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="flex w-2/5 min-w-[220px] items-center justify-center border-r border-slate-100 bg-white px-8 py-10">
          <img
            src="/hercom-logo.png"
            alt="Hercom"
            className="w-full max-w-[200px]"
          />
        </div>

        <div className="flex flex-1 flex-col justify-center px-8 py-10">
          <h2 className="mb-6 text-xl font-bold text-slate-900">
            Acceso administrador
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="Correo"
              className={inputClass}
            />
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Contraseña"
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>

            {error !== null && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-hercom py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-hercom-dark disabled:opacity-60"
            >
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
