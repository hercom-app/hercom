import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { DataModel } from "./_generated/dataModel";

/**
 * Perfil del usuario al registrarse. Por defecto el rol es "client".
 * El rol "admin" debe asignarse manualmente desde el backend/dashboard
 * (ver `users.setRole`), nunca desde el formulario público de registro.
 */
const ProviderPassword = Password<DataModel>({
  profile(params) {
    return {
      email: params.email as string,
      name: (params.name as string | undefined) ?? undefined,
      phone: (params.phone as string | undefined) ?? undefined,
      role: "client" as const,
    };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [ProviderPassword],
});
