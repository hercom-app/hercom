import { useState } from "react";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@proyecto/backend";
import { SignInForm } from "./components/SignInForm";
import { AdminNav, type AdminSection } from "./components/AdminNav";
import { HercomHeaderTitle } from "./components/HercomBrand";
import { AdminCard } from "./components/AdminLayout";
import { AccountsView } from "./views/AccountsView";
import { TopUpsView } from "./views/TopUpsView";
import { ServicesView } from "./views/ServicesView";
import { PromotionsView } from "./views/PromotionsView";
import { PremiumTripsView } from "./views/PremiumTripsView";
import { btnSecondaryClass } from "./lib/adminUi";

function Header({
  section,
  onSectionChange,
}: {
  section: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}) {
  const { signOut } = useAuthActions();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white shadow-header">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <HercomHeaderTitle />
        <button
          type="button"
          onClick={() => void signOut()}
          className={`${btnSecondaryClass} shrink-0 px-3 py-2 text-xs sm:text-sm`}
        >
          Cerrar sesión
        </button>
      </div>
      <AdminNav active={section} onChange={onSectionChange} />
    </header>
  );
}

function Dashboard() {
  const me = useQuery(api.users.getMe);
  const [section, setSection] = useState<AdminSection>("services");

  if (me === undefined) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-slate-500">Cargando panel…</p>
      </div>
    );
  }

  if (me === null || me.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <AdminCard>
          <p className="text-sm font-medium text-red-600">
            Tu cuenta no tiene permisos de administrador.
          </p>
        </AdminCard>
      </div>
    );
  }

  return (
    <>
      <Header section={section} onSectionChange={setSection} />
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        {section === "accounts" && <AccountsView />}
        {section === "topups" && <TopUpsView />}
        {section === "services" && <ServicesView />}
        {section === "promotions" && <PromotionsView />}
        {section === "premium" && <PremiumTripsView />}
      </main>
    </>
  );
}

export default function App() {
  return (
    <div className="min-h-dvh bg-admin-surface">
      <AuthLoading>
        <div className="flex min-h-dvh items-center justify-center bg-admin-surface">
          <p className="text-sm text-slate-500">Cargando…</p>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
      <Authenticated>
        <div className="min-h-dvh bg-admin-surface">
          <Dashboard />
        </div>
      </Authenticated>
    </div>
  );
}
