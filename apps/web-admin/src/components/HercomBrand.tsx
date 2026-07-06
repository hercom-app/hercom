/** Marca compacta para header autenticado */
export function HercomHeaderTitle() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hercom-muted">
        <img
          src="/hercom-logo.png"
          alt=""
          className="h-6 w-auto"
          aria-hidden
        />
      </div>
      <div className="min-w-0">
        <p className="truncate font-display text-base font-bold tracking-tight text-slate-900 sm:text-lg">
          Hercom Admin
        </p>
        <p className="hidden truncate text-xs text-slate-500 sm:block">
          Panel de operaciones
        </p>
      </div>
    </div>
  );
}
