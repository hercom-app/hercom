import { useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { HercomBrand } from "./HercomBrand";
import { GoogleSignInButton } from "./GoogleSignInButton";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none focus:border-hercom";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);
    formData.set("flow", flow);
    try {
      await signIn("password", formData);
    } catch {
      setError("No se pudo autenticar. Revisa tus credenciales.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center bg-hercom px-6 py-10">
      <div className="mb-10">
        <HercomBrand subtitle="Choferes para reemplazo" />
      </div>

      <div className="mx-auto w-full max-w-sm rounded-3xl bg-white p-6 shadow-lg">
        <h2 className="mb-1 text-lg font-bold text-slate-900">
          {flow === "signIn" ? "Iniciar sesión" : "Crear cuenta"}
        </h2>
        <p className="mb-5 text-sm text-slate-600">
          {flow === "signIn"
            ? "Ingresa para solicitar un chofer."
            : "Regístrate como cliente."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <GoogleSignInButton
            disabled={submitting}
            onError={(message) => setError(message)}
          />

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">o</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {flow === "signUp" && (
            <input
              name="name"
              type="text"
              placeholder="Nombre completo"
              className={inputClass}
            />
          )}
          <input
            name="email"
            type="email"
            required
            placeholder="Correo electrónico"
            className={inputClass}
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Contraseña"
            className={inputClass}
          />

          {error !== null && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-hercom py-3.5 text-base font-bold uppercase tracking-wide text-white transition hover:bg-hercom-dark disabled:opacity-60"
          >
            {submitting
              ? "Procesando..."
              : flow === "signIn"
                ? "Entrar"
                : "Registrarme"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          className="mt-4 w-full text-center text-sm font-semibold text-hercom hover:underline"
        >
          {flow === "signIn"
            ? "¿No tienes cuenta? Regístrate"
            : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </div>
    </div>
  );
}
