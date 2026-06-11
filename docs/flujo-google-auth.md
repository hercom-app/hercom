# Flujo de registro e inicio de sesión con Google

Documento visual del proceso OAuth configurado en Hercom. Complementa la guía de
setup en [`convex-google-auth.md`](./convex-google-auth.md).

---

## Resumen en una imagen mental

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Usuario   │────▶│  App Hercom  │────▶│   Convex    │────▶│    Google    │
│  (Gmail)    │◀────│ web / móvil  │◀────│  Auth + DB  │◀────│    OAuth     │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                           │                     │
                           │                     ▼
                           │              ┌──────────────┐
                           └─────────────▶│ users.email  │
                                          │ role: client │
                                          └──────────────┘
```

**Idea clave:** el usuario nunca envía su contraseña de Google a Hercom. Google
confirma la identidad; Convex crea o reutiliza la cuenta y guarda el Gmail en
`users.email`.

---

## Actores del sistema

```mermaid
flowchart LR
  subgraph Cliente["👤 Cliente"]
    U[Usuario con Gmail]
  end

  subgraph Apps["📱 Apps Hercom"]
    WC[Web comercial<br/>:5173]
    WA[Web admin<br/>:5174]
    MO[App móvil choferes<br/>Expo]
  end

  subgraph Convex["☁️ Convex — hip-mink-145"]
    AUTH[Convex Auth<br/>HTTP Actions]
    DB[(Base de datos)]
  end

  subgraph Google["🔐 Google"]
    OAUTH[OAuth 2.0]
  end

  U --> WC & WA & MO
  WC & WA & MO --> AUTH
  AUTH --> OAUTH
  OAUTH --> AUTH
  AUTH --> DB
```

| Actor | Rol |
| --- | --- |
| **Usuario** | Elige cuenta Google y autoriza el acceso |
| **App (web/móvil)** | Muestra botón Google y guarda la sesión local |
| **Convex Auth** | Orquesta OAuth, crea sesión JWT, escribe en BD |
| **Google** | Autentica al usuario y devuelve email, nombre y foto |

---

## Flujo completo — Web (comercial o admin)

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuario
  participant W as Web Hercom<br/>(Vite + React)
  participant C as Convex Auth<br/>.convex.site
  participant G as Google OAuth
  participant DB as Convex DB

  U->>W: Pulsa "Continuar con Google"
  W->>C: signIn("google")
  C->>G: Redirige a pantalla de login Google
  G->>U: Elige cuenta Gmail
  U->>G: Autoriza la app
  G->>C: Callback con código OAuth<br/>/api/auth/callback/google
  C->>DB: ¿Existe authAccounts<br/>provider=google?
  alt Primera vez (registro)
    C->>DB: Crear users + authAccounts + authSessions
    Note over DB: users.email = gmail<br/>users.role = "client"
  else Ya registrado (login)
    C->>DB: Actualizar sesión existente
  end
  C->>W: Redirige de vuelta a localhost<br/>con token de sesión
  W->>W: ConvexAuthProvider guarda sesión
  W->>U: Muestra pantalla autenticada
```

### Qué archivo dispara cada paso (web)

| Paso | Archivo |
| --- | --- |
| Botón Google | `apps/web-comercial/src/components/GoogleSignInButton.tsx` |
| Pantalla login | `apps/web-comercial/src/components/SignInForm.tsx` |
| Provider de sesión | `apps/web-comercial/src/main.tsx` → `ConvexAuthProvider` |
| Rutas OAuth backend | `packages/backend/convex/http.ts` → `auth.addHttpRoutes` |
| Provider Google + perfil | `packages/backend/convex/auth.ts` → `ProviderGoogle` |

---

## Flujo completo — App móvil (solo Google)

```mermaid
sequenceDiagram
  autonumber
  actor U as Chofer
  participant M as App Expo
  participant B as Navegador<br/>(expo-web-browser)
  participant C as Convex Auth
  participant G as Google
  participant DB as Convex DB

  U->>M: Pulsa "Registrarse con Google"
  M->>M: redirectTo = Linking.createURL("/")<br/>exp://… o choferes://
  M->>C: signIn("google", { redirectTo })
  C->>B: Abre URL OAuth
  B->>G: Login Google
  G->>C: Callback OAuth
  C->>DB: Crear/actualizar usuario
  C->>B: Redirige a exp://… o choferes://
  B->>M: maybeCompleteAuthSession()
  M->>M: Token en expo-secure-store
  M->>U: DriverDashboard
```

| Detalle móvil | Valor |
| --- | --- |
| Scheme nativo | `choferes` (`apps/mobile/app.json`) |
| Expo Go | `exp://192.168.x.x:8081/--/` |
| Almacén de sesión | `expo-secure-store` en `App.tsx` |
| Redirect permitido | Validado en `auth.ts` → callback `redirect` |

---

## ¿Registro o login? — Es el mismo flujo

```mermaid
flowchart TD
  A[Usuario pulsa Google] --> B{¿authAccounts con<br/>provider google<br/>y mismo Gmail?}
  B -->|No| C[🆕 REGISTRO]
  B -->|Sí| D[🔑 LOGIN]

  C --> E[Crear fila en users]
  C --> F[Crear fila en authAccounts]
  C --> G[Crear authSessions]

  D --> H[Reutilizar users existente]
  D --> G

  E --> I[role = client por defecto]
  F --> I
  G --> J[App muestra contenido autenticado]

  style C fill:#dbeafe,stroke:#007AFF
  style D fill:#dcfce7,stroke:#16a34a
```

No hay pantalla de “registro” separada: **el primer acceso con Google crea la
cuenta automáticamente**.

---

## Qué se guarda en la base de datos

```mermaid
erDiagram
  users ||--o{ authAccounts : "userId"
  users ||--o{ authSessions : "userId"

  users {
    id _id PK
    string email "Gmail del usuario"
    string name "Nombre Google"
    string image "URL foto"
    string role "client | admin"
    number _creationTime "Fecha registro"
  }

  authAccounts {
    id _id PK
    id userId FK
    string provider "google"
    string providerAccountId "sub de Google"
  }

  authSessions {
    id _id PK
    id userId FK
  }
```

### Ejemplo visual de una fila tras registrarse

```
┌──────────────────────────────────────────────────────────────────┐
│  Tabla: users                                                    │
├─────────────────┬────────────────────────────────────────────────┤
│ email           │ juan.perez@gmail.com                           │
│ name            │ Juan Pérez                                     │
│ image           │ https://lh3.googleusercontent.com/...          │
│ role            │ client                                         │
│ _creationTime   │ 2026-06-09 10:30                               │
└─────────────────┴────────────────────────────────────────────────┘
```

### Dónde verlo en el proyecto

| Lugar | Cómo |
| --- | --- |
| **Dashboard Convex** | [Data → users](https://dashboard.convex.dev/d/hip-mink-145) |
| **Panel admin** | `pnpm web:admin` → sección **Cuentas registradas** |
| **Código** | Query `api.users.listAll` (solo admins) |

---

## Mapa de configuración externa

```mermaid
flowchart TB
  subgraph GCP["Google Cloud Console"]
    CONSENT[Pantalla de consentimiento]
    CREDS[OAuth Client ID<br/>tipo: Aplicación web]
    REDIR[URI redirect autorizada]
    ORIG[Orígenes JS autorizados]
  end

  subgraph ConvexEnv["Variables Convex"]
    ID[AUTH_GOOGLE_ID]
    SEC[AUTH_GOOGLE_SECRET]
    SITE[SITE_URL]
    JWT[JWT_PRIVATE_KEY + JWKS]
  end

  CREDS --> ID & SEC
  REDIR --> URL["https://hip-mink-145.convex.site<br/>/api/auth/callback/google"]
  ORIG --> LOC["http://localhost:5173<br/>http://localhost:5174"]

  ID & SEC --> AUTH[packages/backend/convex/auth.ts]
  JWT --> AUTH
```

---

## Estado de verificación (código + deployment)

Verificado contra el repositorio y el deployment `hip-mink-145`:

| Check | Estado | Notas |
| --- | :---: | --- |
| Provider Google en `auth.ts` | ✅ | Guarda `email`, `name`, `image`, `role: client` |
| Rutas HTTP Auth (`http.ts`) | ✅ | `auth.addHttpRoutes(http)` |
| Callback `redirect` (web + móvil) | ✅ | Permite `localhost`, `exp://`, `choferes://` |
| `AUTH_GOOGLE_ID` en Convex | ✅ | Configurado |
| `AUTH_GOOGLE_SECRET` en Convex | ✅ | Configurado |
| Claves JWT (`JWKS`, `JWT_PRIVATE_KEY`) | ✅ | Generadas por `@convex-dev/auth` |
| Botón Google web comercial | ✅ | `signIn("google")` |
| Botón Google web admin | ✅ | `signIn("google")` |
| Botón Google móvil | ✅ | `signIn("google", { redirectTo })` |
| Scheme móvil `choferes` | ✅ | `app.json` |
| Panel admin usuarios registrados | ✅ | `UsersPanel.tsx` |
| Usuarios Google en BD ahora mismo | ⚠️ | Solo cuentas seed (`*@demo.com`); falta probar login real |

### Ajuste recomendado

`SITE_URL` en Convex está en `http://localhost:3000`, pero las webs corren en
**5173** y **5174**. No bloquea OAuth (el callback va a `.convex.site`), pero
conviene alinearlo:

```powershell
cd packages/backend
npx convex env set SITE_URL http://localhost:5173
```

---

## Cómo probar tú mismo (checklist)

```mermaid
flowchart LR
  S1[1. convex dev<br/>corriendo] --> S2[2. pnpm web:comercial]
  S2 --> S3[3. Clic Google]
  S3 --> S4[4. Elegir Gmail<br/>usuario de prueba]
  S4 --> S5{¿Volvió a la app?}
  S5 -->|Sí| S6[5. Ver users en<br/>dashboard o admin]
  S5 -->|No| S7[Ver tabla de errores ↓]
```

### Web comercial

```powershell
# Terminal 1
pnpm --filter @proyecto/backend dev

# Terminal 2
pnpm web:comercial
```

1. Abre `http://localhost:5173`
2. **Continuar con Google**
3. Inicia sesión con un Gmail añadido como **usuario de prueba** en Google Cloud
4. Deberías ver el formulario de solicitar servicio
5. En admin (`pnpm web:admin`) → **Cuentas registradas** aparece tu Gmail

### App móvil

```powershell
pnpm mobile -- --clear
```

1. Splash Hercom → **Registrarse con Google**
2. Navegador Google → autorizar → vuelve a Expo
3. Si no hay perfil chofer, verás el dashboard básico (login OK)

---

## Árbol de errores frecuentes

```mermaid
flowchart TD
  E[Algo falló] --> R1{redirect_uri_mismatch?}
  R1 -->|Sí| F1[URI en Google Cloud debe ser exactamente<br/>https://hip-mink-145.convex.site/api/auth/callback/google]
  R1 -->|No| R2{Google bloquea acceso?}
  R2 -->|Sí| F2[Agregar Gmail en Usuarios de prueba<br/>modo prueba de OAuth]
  R2 -->|No| R3{redirectTo no permitido?}
  R3 -->|Sí| F3[Móvil: recargar Expo; verificar scheme choferes]
  R3 -->|No| R4{Entré pero no soy admin?}
  R4 -->|Sí| F4[Normal: role=client; cambiar en users o UsersPanel]
  R4 -->|No| F5[Revisar logs: npx convex logs]
```

---

## Comparativa por app

| | Web comercial | Web admin | App móvil |
| --- | --- | --- | --- |
| **Login Google** | ✅ Sí | ✅ Sí | ✅ Solo Google |
| **Login password** | ✅ Sí | ✅ Sí | ❌ No |
| **Rol inicial Google** | `client` | `client` | `client` |
| **Acceso tras Google** | Solicitar servicios | Solo si `role=admin` | Dashboard chofer |
| **redirectTo** | Automático (URL actual) | Automático | `Linking.createURL("/")` |
| **Almacén sesión** | Cookies / localStorage | Igual | SecureStore |

---

## Referencias en el código

```
packages/backend/convex/
├── auth.ts          ← Provider Google + callback redirect
├── auth.config.ts   ← Dominio Convex para JWT
├── http.ts          ← Rutas /api/auth/*
├── schema.ts        ← Tabla users + authTables
└── users.ts         ← getMe, listAll, setRole

apps/web-comercial/src/components/GoogleSignInButton.tsx
apps/web-admin/src/components/GoogleSignInButton.tsx
apps/mobile/src/components/GoogleSignInButton.tsx
apps/web-admin/src/components/UsersPanel.tsx   ← ver registrados
```

---

## Documentos relacionados

- [convex-google-auth.md](./convex-google-auth.md) — setup paso a paso en Google Cloud
- [opciones-autenticacion.md](./opciones-autenticacion.md) — alternativas (SMS, etc.)
- [Convex Auth — Google](https://labs.convex.dev/auth/config/oauth/google) — documentación oficial
