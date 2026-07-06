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
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="hidden items-center justify-center bg-hercom px-8 lg:flex lg:w-[42%]">
        <img
          src="/hercom-logo.png"
          alt="Hercom"
          className="h-28 w-auto brightness-0 invert xl:h-36"
        />
      </aside>

      <main className="flex flex-1 items-center justify-center bg-white px-4 py-10 sm:bg-admin-surface sm:px-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex justify-center lg:mb-10">
            <img
              src="/hercom-logo.png"
              alt="Hercom"
              className="h-20 w-auto sm:h-24 lg:h-28"
            />
          </div>

          <div className={`${cardClass} sm:shadow-card`}>
            <h1 className="text-center font-display text-2xl font-semibold tracking-tight text-slate-900">
              Acceso administrador
            </h1>

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
                className={`${btnPrimaryClass} w-full py-3`}
              >
                {submitting ? "Entrando…" : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
