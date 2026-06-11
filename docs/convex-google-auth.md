# Login con Google (Gmail) + base de datos Convex

Guía para configurar OAuth con Google en Hercom y entender **dónde se guarda
el correo** en Convex.

> **Flujo visual (diagramas):** [`flujo-google-auth.md`](./flujo-google-auth.md) —
> secuencias, base de datos, checklist de verificación y errores frecuentes.

---

## ¿En qué columna se guarda el Gmail?

| Tabla | Campo | Qué contiene |
| --- | --- | --- |
| **`users`** | **`email`** | El correo de Gmail (`usuario@gmail.com`). **Este es el campo principal** para tu lógica de negocio (cliente, chofer, admin). |
| `users` | `name` | Nombre de la cuenta Google |
| `users` | `image` | Foto de perfil de Google |
| `users` | `role` | `"client"` o `"admin"` (por defecto `"client"` al entrar con Google) |
| `authAccounts` | (interna) | Vincula la cuenta Google (`provider: "google"`) con el `userId`. **No la editas a mano.** |
| `authSessions` | (interna) | Sesión activa del dispositivo/navegador |

**Resumen:** el Gmail queda en **`users.email`**. Puedes consultarlo con el índice
`email` definido en [`packages/backend/convex/schema.ts`](../packages/backend/convex/schema.ts).

Ejemplo en el dashboard de Convex → **Data** → tabla **`users`** → columna **`email`**.

---

## Paso 1 — Google Cloud Console

1. Entra a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea o abre un proyecto.
3. **APIs y servicios** → **Pantalla de consentimiento OAuth** → configura app **Externa**
   y agrega tu Gmail como **usuario de prueba** (mientras esté en modo prueba).
4. **Credenciales** → **Crear credenciales** → **ID de cliente OAuth** → tipo **Aplicación web**.

### Orígenes autorizados (JavaScript)

```
http://localhost:5173
http://localhost:5174
```

### URI de redirección autorizados

Tu URL de **HTTP Actions** (termina en `.site`, no `.cloud`):

```
https://hip-mink-145.convex.site/api/auth/callback/google
```

5. Copia **Client ID** y **Client secret**.

---

## Paso 2 — Variables en Convex

Con `convex dev` corriendo, en `packages/backend`:

```powershell
cd C:\Users\jorge\Documents\proyecto\packages\backend
npx convex env set AUTH_GOOGLE_ID TU_CLIENT_ID
npx convex env set AUTH_GOOGLE_SECRET TU_CLIENT_SECRET
```

También puedes pegarlas en el [dashboard de Convex](https://dashboard.convex.dev/d/hip-mink-145) → **Settings** → **Environment variables**.

Verifica que exista `SITE_URL` (la crea `npx @convex-dev/auth`, suele ser `http://localhost:5173` para web).

---

## Paso 3 — Código backend (ya configurado)

Archivo [`packages/backend/convex/auth.ts`](../packages/backend/convex/auth.ts):

- Provider **Google** junto con **Password** (email/contraseña sigue funcionando).
- Al entrar con Google se crea/actualiza un documento en **`users`** con `email`, `name`, `image`, `role: "client"`.

Tras cambiar `auth.ts`, `convex dev` sincroniza solo. Si no corre, reinícialo.

---

## Paso 4 — Probar

### Web comercial / admin

```powershell
pnpm web:comercial   # localhost:5173
pnpm web:admin       # localhost:5174
```

Botón **Continuar con Google** en la pantalla de login.

### App móvil (Expo)

```powershell
pnpm mobile
```

Mismo botón en el login. Abre el navegador de Google y vuelve a la app vía deep link `choferes://`.

En **Expo Go** el redirect usa `exp://...`; en build nativo usa `choferes://` (scheme en `app.json`).

---

## Roles (admin vs cliente)

| Método de login | Rol inicial |
| --- | --- |
| Google | `client` |
| Registro email/contraseña | `client` |
| Seed / manual | `admin` solo si lo asignas |

Para hacer admin a alguien que entró con Gmail:

1. Dashboard Convex → **users** → busca por `email`.
2. O ejecuta la mutation `users.setRole` (requiere ya tener un admin).

**Nota:** entrar con Google al **panel admin** no dará acceso hasta que `role` sea `"admin"`.

---

## Trabajar con la base de datos Convex

### Dashboard (recomendado para empezar)

1. [dashboard.convex.dev](https://dashboard.convex.dev/d/hip-mink-145)
2. **Data** → elige tabla (`users`, `drivers`, `services`, …)
3. Ver, filtrar y editar filas manualmente.

### Tablas del negocio

| Tabla | Para qué |
| --- | --- |
| `users` | Clientes y admins (`email`, `role`, `name`) |
| `drivers` | Perfil chofer (`userId` → `users`) |
| `services` | Viajes/solicitudes |
| `payments` | Pagos de clientes |
| `payouts` | Comisiones choferes |

### Tablas de auth (automáticas)

`authAccounts`, `authSessions`, `authRefreshTokens`, etc. Las gestiona Convex Auth.

### Consultar desde código

```ts
// Ejemplo: usuario actual
import { api } from "@proyecto/backend";
const me = useQuery(api.users.getMe);
// me.email → Gmail o email registrado
// me.role → "client" | "admin"
```

### Seed de demo (password, no Google)

```powershell
npx convex run seed:seedDemo
```

Cuentas: `cliente@demo.com`, `chofer@demo.com`, `admin@demo.com` / `demo1234`.

---

## Problemas frecuentes

| Error | Solución |
| --- | --- |
| `redirect_uri_mismatch` en Google | URI exacta: `https://hip-mink-145.convex.site/api/auth/callback/google` |
| Google no deja entrar | Agrega tu Gmail en **Usuarios de prueba** (app en modo prueba) |
| `Invalid redirectTo` en móvil | Scheme `choferes` en `app.json`; recarga Expo |
| Entré con Google pero no soy admin | Normal: cambia `role` a `"admin"` en tabla `users` |
| No veo el email en users | Revisa tabla `users`, columna `email`, tras login exitoso |

---

## Documentos relacionados

- [**flujo-google-auth.md**](./flujo-google-auth.md) — diagramas del registro/login con Google
- [conectar-convex-expo.md](./conectar-convex-expo.md)
- [flujo-vistas.md](./flujo-vistas.md)
- [Convex Auth — Google](https://labs.convex.dev/auth/config/oauth/google)
