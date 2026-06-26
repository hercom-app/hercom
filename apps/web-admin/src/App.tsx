import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@proyecto/backend";
import { SignInForm } from "./components/SignInForm";
import { ServicesBoard } from "./components/ServicesBoard";
import { PaymentsPanel } from "./components/PaymentsPanel";
import { PayoutsPanel } from "./components/PayoutsPanel";
import { TopUpsTodayPanel } from "./components/TopUpsTodayPanel";
import { UsersPanel } from "./components/UsersPanel";
import { HercomHeaderTitle } from "./components/HercomBrand";

function Header() {
  const { signOut } = useAuthActions();
  return (
    <header className="flex items-center justify-between bg-hercom px-6 py-4 shadow-md">
      <HercomHeaderTitle />
      <button
        type="button"
        onClick={() => void signOut()}
        className="text-sm font-medium text-white/90 hover:text-white"
      >
        Cerrar sesión
      </button>
    </header>
  );
}

function Dashboard() {
  const me = useQuery(api.users.getMe);

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
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <UsersPanel />
      <ServicesBoard />
      <TopUpsTodayPanel />
      <div className="grid gap-6 md:grid-cols-2">
        <PaymentsPanel />
        <PayoutsPanel />
      </div>
    </main>
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
          <Header />
          <Dashboard />
        </div>
      </Authenticated>
    </div>
  );
}
