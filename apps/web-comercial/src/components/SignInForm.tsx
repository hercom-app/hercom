import { useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

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
    <div className="mx-auto mt-16 w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">
        Choferes de Reemplazo
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        {flow === "signIn" ? "Inicia sesión" : "Crea tu cuenta"} para solicitar
        un chofer.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {flow === "signUp" && (
          <input
            name="name"
            type="text"
            placeholder="Nombre completo"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        )}
        <input
          name="email"
          type="email"
          required
          placeholder="Correo electrónico"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Contraseña"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand"
        />

        {error !== null && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-brand py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
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
        className="mt-4 w-full text-center text-sm text-brand hover:underline"
      >
        {flow === "signIn"
          ? "¿No tienes cuenta? Regístrate"
          : "¿Ya tienes cuenta? Inicia sesión"}
      </button>
    </div>
  );
}
