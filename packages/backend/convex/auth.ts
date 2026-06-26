import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

/**
 * Perfil por defecto al registrarse con email/contraseña.
 * El rol "admin" se asigna manualmente (users.setRole).
 */
const ProviderPassword = Password({
  profile(params) {
    const name = params.name as string | undefined;
    const phone = params.phone as string | undefined;
    return {
      email: params.email as string,
      role: "client" as const,
      ...(name !== undefined ? { name } : {}),
      ...(phone !== undefined ? { phone } : {}),
    };
  },
});

/**
 * Google OAuth (Gmail). El email de Google se guarda en users.email.
 * La cuenta OAuth se vincula en authAccounts (tabla interna de Convex Auth).
 */
const ProviderGoogle = Google({
  profile(profile) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
      role: "client" as const,
    };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [ProviderPassword, ProviderGoogle],
  callbacks: {
    /**
     * Permite volver a la app web (Vite) o a Expo Go / build nativo tras OAuth.
     */
    async redirect({ redirectTo }) {
      if (redirectTo === undefined) {
        return redirectTo;
      }
      const allowed =
        redirectTo.startsWith("http://localhost:") ||
        redirectTo.startsWith("https://localhost:") ||
        redirectTo.startsWith("choferes://") ||
        redirectTo.startsWith("exp://") ||
        redirectTo.startsWith("exp+choferes://");
      if (allowed) {
        return redirectTo;
      }
      throw new Error(`redirectTo no permitido: ${redirectTo}`);
    },
  },
});
