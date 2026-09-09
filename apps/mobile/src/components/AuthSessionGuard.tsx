import { useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";

/**
 * Si la sesión JWT sigue viva pero el usuario ya no existe en Convex
 * (borrado en dashboard), cierra sesión limpia en el dispositivo.
 */
export function AuthSessionGuard({ children }: { children: React.ReactNode }) {
  const me = useQuery(api.users.getMe);
  const { signOut } = useAuthActions();

  useEffect(() => {
    // undefined = aún cargando; null = sesión sin usuario (borrado / token huérfano)
    if (me === undefined || me !== null) {
      return;
    }
    void (async () => {
      try {
        await signOut();
      } catch {
        // Ignorar: el objetivo es limpiar la sesión local
      }
    })();
  }, [me, signOut]);

  return <>{children}</>;
}
