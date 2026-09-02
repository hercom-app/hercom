import { useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { btnPrimaryClass, cardClass } from "../lib/adminUi";
import { FloatingField, FloatingPasswordField } from "./FloatingField";

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
      setError("Usuario o contraseña incorrectos.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-zinc-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-center">
        <h1 className="max-w-sm text-3xl font-semibold tracking-tight">
          Panel de operaciones
        </h1>
        <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-hercom/20 blur-3xl" />
      </aside>

      <main className="flex items-center justify-center bg-admin-canvas px-4 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <img
              src="/hercom-logo.png"
              alt="Hercom"
              className="mx-auto h-24 w-auto"
            />
          </div>

          <div className={`${cardClass} shadow-panel`}>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Bienvenido
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
              Iniciar sesión
            </h2>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <FloatingField
                id="admin-email"
                name="email"
                type="email"
                label="Usuario"
                autoComplete="username"
                required
              />

              <FloatingPasswordField
                showPassword={showPassword}
                onToggle={() => setShowPassword((previous) => !previous)}
              />

              {error !== null && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`${btnPrimaryClass} w-full py-2.5`}
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
