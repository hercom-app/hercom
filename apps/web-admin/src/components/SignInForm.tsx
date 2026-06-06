import { useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    <div className="mx-auto mt-24 w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Panel Admin</h1>
      <p className="mb-6 text-sm text-slate-500">
        Acceso restringido a administradores.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="email"
          type="email"
          required
          placeholder="Correo"
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
          className="w-full rounded-lg bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
