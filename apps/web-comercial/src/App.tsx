import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { SignInForm } from "./components/SignInForm";
import { RequestServiceForm } from "./components/RequestServiceForm";
import { MyServices } from "./components/MyServices";

function Header() {
  const { signOut } = useAuthActions();
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <h1 className="text-lg font-bold text-brand">Choferes de Reemplazo</h1>
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
        <main className="mx-auto max-w-2xl space-y-6 p-6">
          <RequestServiceForm />
          <MyServices />
        </main>
      </Authenticated>
    </div>
  );
}
