import type { ReactNode } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import type { AdminSection } from "./AdminNav";

type NavItem = {
  id: AdminSection;
  label: string;
  description: string;
  icon: ReactNode;
};

const ICON_CLASS = "h-5 w-5 shrink-0";

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <span className={`${ICON_CLASS} text-current opacity-90`}>{children}</span>
  );
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "services",
    label: "Servicios",
    description: "Operación en vivo",
    icon: (
      <NavIcon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M3 7h18M3 12h18M3 17h18" strokeLinecap="round" />
        </svg>
      </NavIcon>
    ),
  },
  {
    id: "income",
    label: "Ingresos",
    description: "Reportes financieros",
    icon: (
      <NavIcon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M4 19V5M4 19h16M8 15v-3M12 15V9M16 15V11" strokeLinecap="round" />
        </svg>
      </NavIcon>
    ),
  },
  {
    id: "accounts",
    label: "Cuentas",
    description: "Usuarios y choferes",
    icon: (
      <NavIcon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="9" cy="8" r="3" />
          <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" strokeLinecap="round" />
          <path d="M16 11h5M18.5 8.5v5" strokeLinecap="round" />
        </svg>
      </NavIcon>
    ),
  },
  {
    id: "topups",
    label: "Recargas",
    description: "Billeteras chofer",
    icon: (
      <NavIcon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
        </svg>
      </NavIcon>
    ),
  },
  {
    id: "promotions",
    label: "Promociones",
    description: "Campañas por región",
    icon: (
      <NavIcon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 3l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.5 6.4 20.5l2.1-6.7L3 9.8h6.8L12 3z" />
        </svg>
      </NavIcon>
    ),
  },
  {
    id: "markets",
    label: "Mercados",
    description: "Moneda y tarifas",
    icon: (
      <NavIcon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="8" />
          <path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" />
        </svg>
      </NavIcon>
    ),
  },
  {
    id: "premium",
    label: "Premium",
    description: "Viajes gestionados",
    icon: (
      <NavIcon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M5 17l2-6h10l2 6M7 11l2-4h6l2 4" strokeLinejoin="round" />
          <circle cx="7.5" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="16.5" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </NavIcon>
    ),
  },
];

export const SECTION_META: Record<
  AdminSection,
  { title: string; description: string }
> = Object.fromEntries(
  NAV_ITEMS.map((item) => [
    item.id,
    { title: item.label, description: item.description },
  ]),
) as Record<AdminSection, { title: string; description: string }>;

type AdminSidebarProps = {
  active: AdminSection;
  onChange: (section: AdminSection) => void;
  userName: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function AdminSidebar({
  active,
  onChange,
  userName,
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const { signOut } = useAuthActions();

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200/80 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-hercom text-sm font-bold text-white shadow-sm">
          H
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">Hercom</p>
          <p className="truncate text-xs text-slate-500">Operations</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          General
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onChange(item.id);
                onMobileClose();
              }}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {item.icon}
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {item.label}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-200/80 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-hercom/10 text-sm font-semibold text-hercom">
            {(userName.trim()[0] ?? "A").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {userName.trim() !== "" ? userName : "Administrador"}
            </p>
            <p className="truncate text-xs text-slate-500">admin@hercom</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] lg:hidden"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[272px] border-r border-slate-200/80 bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>
    </>
  );
}
