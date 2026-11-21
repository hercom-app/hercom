import type { ReactNode } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { AdminSection } from "./AdminNav";
import { clearAdminSessionMarkers } from "../lib/adminSessionPolicy";
import { btnSecondaryClass } from "../lib/adminUi";

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
    id: "drivers",
    label: "Choferes",
    description: "Perfiles y solicitudes",
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
  {
    id: "markets",
    label: "Moneda y tipo de cambio",
    description: "Soles, USD y tarifas por país",
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
    id: "accounts",
    label: "Cuentas de usuario",
    description: "Admins y cuentas internas",
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
    id: "clients",
    label: "Clientes",
    description: "Usuarios de la app",
    icon: (
      <NavIcon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="8" r="3" />
          <path d="M5 19c0-3.3 3.1-6 7-6s7 2.7 7 6" strokeLinecap="round" />
        </svg>
      </NavIcon>
    ),
  },
  {
    id: "quotes",
    label: "Servicios premium",
    description: "Viajes corporativos",
    icon: (
      <NavIcon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
          <path d="M14 3v6h6M8 13h8M8 17h5" strokeLinecap="round" />
        </svg>
      </NavIcon>
    ),
  },
  {
    id: "support",
    label: "Chat con usuarios",
    description: "Chats de la app",
    icon: (
      <NavIcon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M5 6h14a2 2 0 012 2v7a2 2 0 01-2 2H9l-4 3v-3H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
        </svg>
      </NavIcon>
    ),
  },
  {
    id: "errors",
    label: "Errores de app",
    description: "Reportes de la app",
    icon: (
      <NavIcon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
          <path d="M10.3 4.7L2.8 17.5A2 2 0 004.5 20.5h15a2 2 0 001.7-3L13.7 4.7a2 2 0 00-3.4 0z" />
        </svg>
      </NavIcon>
    ),
  },
];

const SCOPED_ADMIN_SECTIONS: AdminSection[] = [
  "drivers",
  "services",
  "clients",
  "support",
];

const HR_SECTIONS: AdminSection[] = ["drivers"];

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
  userEmail?: string | undefined;
  isFullAdmin: boolean;
  isHrOnly?: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function AdminSidebar({
  active,
  onChange,
  userName,
  userEmail,
  isFullAdmin,
  isHrOnly = false,
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const { signOut } = useAuthActions();
  const supportUnread = useQuery(api.support.getAdminUnreadCount) ?? 0;
  const navItems = isHrOnly
    ? NAV_ITEMS.filter((item) => HR_SECTIONS.includes(item.id))
    : isFullAdmin
      ? NAV_ITEMS
      : NAV_ITEMS.filter((item) => SCOPED_ADMIN_SECTIONS.includes(item.id));

  const displayName = userName.trim() !== "" ? userName.trim() : "Administrador";
  const profileLabel = isHrOnly
    ? "Recursos humanos"
    : isFullAdmin
      ? "Superadmin"
      : "Admin";
  const profileIsRedundant =
    displayName.localeCompare(profileLabel, "es", { sensitivity: "accent" }) === 0;
  const hasEmail = userEmail !== undefined && userEmail !== "";

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200/80 px-5 py-4">
        <img
          src="/hercom-mark.png"
          alt="Hercom"
          className="h-14 w-auto"
        />
        <p className="mt-3 text-sm font-semibold leading-snug text-slate-900">
          {displayName}
        </p>
        {profileIsRedundant ? null : (
          <p className="mt-1 text-xs font-medium leading-snug text-hercom-dark">
            {profileLabel}
          </p>
        )}
        {hasEmail ? (
          <p className="mt-1 break-all text-xs leading-snug text-slate-600">
            {userEmail}
          </p>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
          MENU
        </p>
        {navItems.map((item) => {
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
                  ? "bg-hercom-muted text-hercom-dark"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.icon}
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="block truncate text-sm font-medium">
                    {item.label}
                  </span>
                  {item.id === "support" && supportUnread > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        isActive
                          ? "bg-hercom-dark text-white"
                          : "bg-hercom-muted text-hercom-dark"
                      }`}
                    >
                      {supportUnread}
                    </span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-200/80 p-4">
        <button
          type="button"
          onClick={() => {
            clearAdminSessionMarkers();
            void signOut();
          }}
          className={`${btnSecondaryClass} w-full border-slate-400 font-semibold text-slate-800 hover:border-slate-600 hover:bg-slate-100`}
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
        className={`fixed inset-y-0 left-0 z-50 w-[min(272px,calc(100vw-1.5rem))] border-r border-slate-200/80 bg-white pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] transition-transform duration-200 lg:w-[272px] lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>
    </>
  );
}
