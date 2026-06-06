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

function Header() {
  const { signOut } = useAuthActions();
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <h1 className="text-lg font-bold text-brand">Panel Admin</h1>
      <button
        type="button"
        onClick={() => void signOut()}
        className="text-sm text-slate-500 hover:text-slate-800"
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
      <div className="p-6">
        <p className="text-sm text-red-600">
          Tu cuenta no tiene permisos de administrador.
        </p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <ServicesBoard />
      <div className="grid gap-6 md:grid-cols-2">
        <PaymentsPanel />
        <PayoutsPanel />
      </div>
    </main>
  );
}

export default function App() {
  return (
    <div className="min-h-full">
      <AuthLoading>
        <p className="p-6 text-sm text-slate-500">Cargando...</p>
      </AuthLoading>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
      <Authenticated>
        <Header />
        <Dashboard />
      </Authenticated>
    </div>
  );
}
