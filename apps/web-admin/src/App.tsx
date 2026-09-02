import { useEffect, useState } from "react";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";
import { api } from "@proyecto/backend";
import { SignInForm } from "./components/SignInForm";
import { AdminSidebar, SECTION_META } from "./components/AdminSidebar";
import type { AdminSection } from "./components/AdminNav";
import { AdminCard } from "./components/AdminLayout";
import { AccountsView } from "./views/AccountsView";
import { DriversView } from "./views/DriversView";
import { TopUpsView } from "./views/TopUpsView";
import { ServicesView } from "./views/ServicesView";
import { PromotionsView } from "./views/PromotionsView";
import { MarketsView } from "./views/MarketsView";

const SCOPED_SECTIONS: AdminSection[] = ["drivers", "services", "clients"];

function Dashboard() {
  const me = useQuery(api.users.getAdminContext);
  const [section, setSection] = useState<AdminSection>("drivers");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isStaff =
    me !== null &&
    me !== undefined &&
    (me.role === "admin" || me.role === "superadmin");
  const isFullAdmin = me?.isFullAdmin === true;

  useEffect(() => {
    if (!isStaff) {
      return;
    }
    if (!isFullAdmin && !SCOPED_SECTIONS.includes(section)) {
      setSection("drivers");
    }
  }, [isFullAdmin, isStaff, section]);

  const meta = SECTION_META[section];
  const userName = me?.name ?? me?.email ?? "Administrador";

  if (me === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-admin-canvas">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
          Cargando panel…
        </div>
      </div>
    );
  }

  if (me === null || !isStaff) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-admin-canvas p-6">
        <AdminCard className="max-w-md">
          <p className="text-sm font-medium text-red-600">
            Tu cuenta no tiene permisos de administrador.
          </p>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-admin-canvas">
      <AdminSidebar
        active={section}
        onChange={setSection}
        userName={userName}
        userEmail={me.email}
        isFullAdmin={isFullAdmin}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 lg:hidden"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Abrir menú"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                  {meta.title}
                </h1>
                <p className="truncate text-sm text-slate-500">
                  {isFullAdmin
                    ? meta.description
                    : me.districtScopes
                        .map((scope) => scope.district)
                        .join(" · ") || meta.description}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {section === "drivers" && (
            <DriversView
              isFullAdmin={isFullAdmin}
              districtScopes={me.districtScopes}
            />
          )}
          {isFullAdmin && section === "markets" && <MarketsView />}
          {section === "services" && (
            <ServicesView
              isFullAdmin={isFullAdmin}
              districtScopes={me.districtScopes}
            />
          )}
          {isFullAdmin && section === "topups" && <TopUpsView />}
          {isFullAdmin && section === "promotions" && <PromotionsView />}
          {isFullAdmin && section === "accounts" && (
            <AccountsView
              isFullAdmin={isFullAdmin}
              districtScopes={me.districtScopes}
              audience="staff"
            />
          )}
          {section === "clients" && (
            <AccountsView
              isFullAdmin={isFullAdmin}
              districtScopes={me.districtScopes}
              audience="clients"
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <AuthLoading>
        <div className="flex min-h-dvh items-center justify-center bg-admin-canvas">
          <p className="text-sm text-slate-500">Cargando…</p>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
      <Authenticated>
        <Dashboard />
      </Authenticated>
    </>
  );
}
