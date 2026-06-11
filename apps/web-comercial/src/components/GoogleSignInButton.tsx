import { useAuthActions } from "@convex-dev/auth/react";

type GoogleSignInButtonProps = {
  disabled?: boolean;
  onError?: (message: string) => void;
};

/** Inicia sesión con Google (Gmail) vía OAuth + Convex Auth. */
export function GoogleSignInButton({
  disabled = false,
  onError,
}: GoogleSignInButtonProps) {
  const { signIn } = useAuthActions();

  async function handleClick() {
    try {
      await signIn("google");
    } catch {
      onError?.("No se pudo iniciar sesión con Google.");
    }
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void handleClick()}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-base font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
        G
      </span>
      Continuar con Google
    </button>
  );
}
