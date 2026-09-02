import type { ReactNode } from "react";
import {
  cardClass,
  pageShellClass,
  tableWrapClass,
} from "../lib/adminUi";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function AdminPageHeader({
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
          {title}
        </h2>
        {description !== undefined && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">
            {description}
          </p>
        )}
      </div>
      {actions !== undefined ? (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

type AdminCardProps = {
  children: ReactNode;
  className?: string;
};

export function AdminCard({ children, className = "" }: AdminCardProps) {
  return <section className={`${cardClass} ${className}`.trim()}>{children}</section>;
}

type AdminPageProps = {
  children: ReactNode;
};

export function AdminPage({ children }: AdminPageProps) {
  return <div className={pageShellClass}>{children}</div>;
}

type AdminTableWrapProps = {
  children: ReactNode;
};

export function AdminTableWrap({ children }: AdminTableWrapProps) {
  return (
    <div>
      <p className="mb-2 text-xs text-zinc-400 md:hidden">
        Desliza hacia los lados para ver todas las columnas
      </p>
      <div className={tableWrapClass}>{children}</div>
    </div>
  );
}

type AdminStateProps = {
  message: string;
};

export function AdminLoading({ message = "Cargando…" }: AdminStateProps) {
  return (
    <p className="flex items-center gap-2 text-sm text-zinc-500">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
      {message}
    </p>
  );
}

export function AdminEmpty({ message }: AdminStateProps) {
  return (
    <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">
      {message}
    </p>
  );
}
