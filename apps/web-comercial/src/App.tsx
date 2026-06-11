import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { SignInForm } from "./components/SignInForm";
import { RequestServiceForm } from "./components/RequestServiceForm";
import { MyServices } from "./components/MyServices";
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

export default function App() {
  return (
    <div className="min-h-full bg-slate-100">
      <AuthLoading>
        <div className="flex min-h-full items-center justify-center bg-hercom">
          <p className="text-sm text-white/90">Cargando...</p>
        </div>
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
