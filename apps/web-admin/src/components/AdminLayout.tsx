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
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {description !== undefined && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        )}
      </div>
      {actions !== undefined ? (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
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
  return <div className={tableWrapClass}>{children}</div>;
}

type AdminStateProps = {
  message: string;
};

export function AdminLoading({ message = "Cargando…" }: AdminStateProps) {
  return (
    <p className="flex items-center gap-2 text-sm text-slate-500">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-hercom" />
      {message}
    </p>
  );
}

export function AdminEmpty({ message }: AdminStateProps) {
  return (
    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {message}
    </p>
  );
}
