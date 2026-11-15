import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { EyeIcon, EyeOffIcon } from "./icons/EyeIcons";

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 7 9-7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}

function PillField({
  id,
  name,
  type,
  label,
  autoComplete,
  icon,
  trailing,
}: {
  id: string;
  name: string;
  type: string;
  label: string;
  autoComplete?: string;
  icon: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
        {icon}
      </span>
      <input
        id={id}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        placeholder={label}
        className={`h-12 w-full rounded-full border border-slate-600 bg-white pl-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-600 focus:border-hercom-dark focus:ring-2 focus:ring-hercom-dark/30 ${
          trailing !== undefined ? "pr-12" : "pr-4"
        }`}
      />
      {trailing}
    </label>
  );
}

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("login-lock");
    return () => {
      root.classList.remove("login-lock");
    };
  }, []);

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
    <div className="grid h-dvh max-h-dvh overflow-x-clip overflow-y-auto bg-white lg:grid-cols-2">
      <aside
        className="relative hidden overflow-hidden px-14 py-16 text-white lg:flex lg:flex-col lg:justify-center"
        style={{
          backgroundImage: "linear-gradient(165deg, #0959CC 0%, #073E96 100%)",
        }}
      >
        <div className="pointer-events-none absolute -bottom-28 -left-28 h-[460px] w-[460px] rounded-full border border-white/30" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-[300px] w-[300px] rounded-full border border-white/30" />
        <div className="pointer-events-none absolute bottom-16 left-16 h-[150px] w-[150px] rounded-full border border-white/35" />

        <div className="login-panel-left relative z-10 max-w-md">
          <p className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Hercom
          </p>
          <p className="mt-4 max-w-xs text-lg font-medium leading-relaxed text-white">
            Panel de Operaciones
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center overflow-hidden bg-white px-6 py-12 sm:px-10">
        <div className="login-panel-right w-full max-w-[380px]">
          <img
            src="/hercom-mark.png"
            alt="Hercom"
            className="login-logo mx-auto mb-8 h-[5.5rem] w-auto sm:h-28"
          />

          <div className="login-form">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
            Hola de nuevo
          </h2>
          <p className="mt-1 text-sm text-slate-600">Bienvenido</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <PillField
              id="admin-email"
              name="email"
              type="email"
              label="Correo"
              autoComplete="username"
              icon={<MailIcon />}
            />

            <PillField
              id="admin-password"
              name="password"
              type={showPassword ? "text" : "password"}
              label="Contraseña"
              autoComplete="current-password"
              icon={<LockIcon />}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              }
            />

            {error !== null && (
              <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center rounded-full bg-hercom-dark text-base font-semibold text-white shadow-sm transition hover:bg-hercom-deeper focus:outline-none focus:ring-2 focus:ring-hercom-dark/40 disabled:cursor-not-allowed disabled:opacity-60"
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
