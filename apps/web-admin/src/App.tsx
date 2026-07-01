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
import { AccountsView } from "./views/AccountsView";
import { TopUpsView } from "./views/TopUpsView";
import { ServicesView } from "./views/ServicesView";
import { PromotionsView } from "./views/PromotionsView";
import { PremiumTripsView } from "./views/PremiumTripsView";

function Header({
  section,
  onSectionChange,
}: {
  section: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}) {
  const { signOut } = useAuthActions();
  return (
    <header className="bg-hercom shadow-md">
      <div className="flex items-center justify-between px-6 py-4">
        <HercomHeaderTitle />
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-sm font-medium text-white/90 hover:text-white"
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
    return <p className="p-6 text-sm text-slate-500">Cargando...</p>;
  }

  if (me === null || me.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-3xl bg-white p-6 shadow-lg">
          <p className="text-sm font-medium text-red-600">
            Tu cuenta no tiene permisos de administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header section={section} onSectionChange={setSection} />
      <main className="mx-auto max-w-6xl p-6">
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
    <div className="h-full min-h-0 overflow-hidden bg-white">
      <AuthLoading>
        <div className="flex h-full min-h-0 items-center justify-center overflow-hidden bg-white">
          <p className="text-sm text-slate-500">Cargando...</p>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="h-full min-h-0 overflow-hidden">
          <SignInForm />
        </div>
      </Unauthenticated>
      <Authenticated>
        <div className="flex h-full min-h-0 flex-col overflow-auto bg-slate-100">
          <Dashboard />
        </div>
      </Authenticated>
    </div>
  );
}
