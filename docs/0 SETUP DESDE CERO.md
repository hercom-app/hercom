# Setup desde cero (Windows + Cursor)

Guía para armar Hercom en una PC nueva: herramientas, repo, Convex, Expo/EAS, Vercel y Cursor.

**Política actual (hasta Play Store):** un solo backend — Convex **producción**  
`https://lovable-kudu-343.convex.cloud`

---

## Mapa rápido

| Pieza | Qué es | URL / valor |
| --- | --- | --- |
| Repo | Código | https://github.com/hercom-app/hercom |
| Convex | Base de datos + API | `https://lovable-kudu-343.convex.cloud` |
| Dashboard Convex | Datos / logs | https://dashboard.convex.dev/d/lovable-kudu-343 |
| Admin web | Panel operaciones | https://hercom-web-admin-opal.vercel.app/ |
| Expo / EAS | Builds APK | cuenta `hercom-worker` / proyecto `choferes-reemplazo-driver` |
| Vercel | Hosting admin | team `hercoms-projects` / proyecto `hercom-web-admin` |

Cuentas típicas del equipo: `hercom.desarrollo@gmail.com` (Expo/Convex/Vercel según acceso).

---

## 1) Instalar Node, npm y Git (PATH permanente)

### Opción A — script del repo (recomendado en esta PC)

Con el repo ya clonado:

```powershell
cd "C:\Users\<TU_USUARIO>\Documents\hercom"
powershell -ExecutionPolicy Bypass -File .\scripts\install-dev-tools.ps1
```

Instala en el perfil de usuario (sin admin):

- Node LTS → `%LOCALAPPDATA%\Programs\nodejs`
- Git portable → `%LOCALAPPDATA%\Programs\Git`
- pnpm 9 (global)

Actualiza el **User PATH** y crea un **PowerShell profile**.

**Cerrá y abrí Cursor** (o una terminal nueva). Comprobá:

```powershell
node -v
npm -v
git --version
pnpm -v
```

### Opción B — instaladores oficiales

1. Node LTS: https://nodejs.org (incluye npm)  
2. Git: https://git-scm.com/download/win  
3. Luego: `npm install -g pnpm@9`

### Si Cursor no ve `node` aunque el PATH esté bien

PowerShell a veces bloquea el profile. En Cursor → Settings → `settings.json`:

```json
{
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.profiles.windows": {
    "PowerShell": {
      "source": "PowerShell",
      "args": ["-NoLogo", "-ExecutionPolicy", "Bypass"]
    }
  },
  "terminal.integrated.env.windows": {
    "Path": "C:\\Users\\<TU_USUARIO>\\AppData\\Local\\Programs\\nodejs;C:\\Users\\<TU_USUARIO>\\AppData\\Local\\Programs\\Git\\cmd;C:\\Users\\<TU_USUARIO>\\AppData\\Local\\Programs\\Git\\usr\\bin;${env:Path}"
  }
}
```

Matá la terminal vieja y abrí una **nueva**.

Verificación:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-convex.ps1
```

---

## 2) Clonar el repo y conectar GitHub con Cursor

```powershell
cd "C:\Users\<TU_USUARIO>\Documents"
git clone https://github.com/hercom-app/hercom.git
cd hercom
```

### Login GitHub (CLI `gh` o Cursor Connect)

**Con `gh` (device code):**

```powershell
gh auth login --hostname github.com --git-protocol https --web
```

1. La terminal muestra un código tipo `ABCD-1234`  
2. Abrís https://github.com/login/device  
3. **Pegás el código** (GitHub no lo muestra; lo escribís vos)  
4. Authorize  

**Con Cursor:**  
Chat / Source Control → Connect GitHub → autorizar la cuenta del org `hercom-app`.

```powershell
git status
gh auth status
```

---

## 3) Instalar dependencias del monorepo

```powershell
cd "C:\Users\<TU_USUARIO>\Documents\hercom"
pnpm install
```

---

## 4) Conectar Convex (con Cursor / CLI)

### 4.1 Login

```powershell
cd packages\backend
npx convex login --device-name "hercom-pc-<tu-nombre>" --login-flow poll --no-open
```

Abrí la URL `auth.convex.dev/device?user_code=...` que imprime la terminal e iniciá sesión (cuenta del team `hercom-app`).

```powershell
npx convex login status
```

### 4.2 Apuntar a producción (política actual)

Archivos que deben usar la misma URL:

| Archivo | Variable |
| --- | --- |
| `apps/mobile/.env` | `EXPO_PUBLIC_CONVEX_URL=https://lovable-kudu-343.convex.cloud` |
| `apps/mobile/eas.json` | mismos valores en `development` / `preview` / `production` |
| `apps/web-admin/.env.local` | `VITE_CONVEX_URL=https://lovable-kudu-343.convex.cloud` |
| `packages/backend/.env.local` | `CONVEX_DEPLOYMENT=prod:lovable-kudu-343` + `CONVEX_URL=...` |

Publicar funciones a prod:

```powershell
cd packages\backend
npx convex deploy --yes
```

Dashboard: https://dashboard.convex.dev/d/lovable-kudu-343

> **No** uses deployments viejos (`perceptive-setter-262`, `wry-lapwing-809`, `hip-mink-145`) para datos reales.

Seed admin demo (si hace falta):

```powershell
npx convex run seed:seedDemo --prod
```

Cuenta: `admin@demo.com` / `demo1234`

Reset limpio (borra usuarios salvo dueño + re-seed owner):

```powershell
npx convex run seed:resetForOwnerKickoff --prod
```

---

## 5) Conectar Expo / EAS (con Cursor)

### 5.1 Login

```powershell
cd apps\mobile
npx eas-cli login --browser
```

Cuenta esperada: `hercom.desarrollo@gmail.com` → orgs `hercom-worker` / `hercom-expo`.

```powershell
npx eas-cli whoami
```

### 5.2 Proyecto EAS

Project ID (en `apps/mobile/app.json` → `extra.eas.projectId`):

`d19ae84f-d2a4-4dbc-a727-6c4935de3906`

```powershell
# En Windows, si `npx eas-cli` falla invocado como `eas`, usá:
# node %LOCALAPPDATA%\Programs\eas-cli-pkg\node_modules\eas-cli\bin\run ...
$env:EAS_BUILD = "true"
npx eas-cli init --id d19ae84f-d2a4-4dbc-a727-6c4935de3906 --non-interactive
```

> `app.config.js` quita `owner` / `projectId` en Expo Go local. Para builds EAS poné `EAS_BUILD=true`.

### 5.3 Build APK (preview interno)

```powershell
cd apps\mobile
$env:EAS_BUILD = "true"
npx eas-cli build --platform android --profile preview --non-interactive --no-wait
```

El perfil `preview` usa `EXPO_PUBLIC_CONVEX_URL` de `eas.json` (debe ser **prod**).

Builds: https://expo.dev/accounts/hercom-worker/projects/choferes-reemplazo-driver/builds

---

## 6) Conectar Vercel (admin) con Cursor

### 6.1 Login

```powershell
cd "C:\Users\<TU_USUARIO>\Documents\hercom"
npx vercel login
```

Abrí el device link, autorizá (cuenta con acceso a `hercoms-projects`).

```powershell
npx vercel whoami
```

### 6.2 Link del proyecto

```powershell
npx vercel link --yes --project hercom-web-admin --scope hercoms-projects
```

Root Directory en Vercel: `apps/web-admin`.

### 6.3 Variable de entorno (prod)

```text
VITE_CONVEX_URL=https://lovable-kudu-343.convex.cloud
```

En dashboard Vercel → Project → Settings → Environment Variables, o:

```powershell
cd apps\web-admin
echo https://lovable-kudu-343.convex.cloud | npx vercel env add VITE_CONVEX_URL production --scope hercoms-projects
```

### 6.4 Deploy

Desde la **raíz del monorepo** (para que `Root Directory = apps/web-admin` exista en el upload):

```powershell
cd "C:\Users\<TU_USUARIO>\Documents\hercom"
npx vercel deploy --prod --yes --scope hercoms-projects
```

URL canónica: https://hercom-web-admin-opal.vercel.app/  
(“opal” es el alias del proyecto; **es producción**, no un ambiente de prueba.)

---

## 7) Qué abrir en el día a día

```powershell
cd "C:\Users\<TU_USUARIO>\Documents\hercom"

# Admin local
pnpm web:admin

# Mobile (túnel Expo Go)
powershell -ExecutionPolicy Bypass -File .\scripts\start-mobile-tunnel.ps1

# Backend: publicar cambios a PROD
cd packages\backend
npx convex deploy --yes
```

Checklist:

1. [ ] `node` / `npm` / `git` / `pnpm` sin redeclarar PATH  
2. [ ] `gh auth status` o push a GitHub OK  
3. [ ] `npx convex login status` → team `hercom-app`  
4. [ ] `npx eas-cli whoami` → `hercom-worker`  
5. [ ] `npx vercel whoami` → team `hercoms-projects`  
6. [ ] Apps apuntan a `lovable-kudu-343`  
7. [ ] `.\scripts\verify-convex.ps1` OK  

---

## 8) Google OAuth (móvil)

Callback Convex prod:

```text
https://lovable-kudu-343.convex.site/api/auth/callback/google
```

Debe estar en Google Cloud Console → credenciales OAuth.  
Detalle: `docs/convex-google-auth.md`.

---

## 9) Problemas frecuentes

| Síntoma | Qué hacer |
| --- | --- |
| `node` no se reconoce en Cursor | Settings PATH + terminal nueva + ExecutionPolicy Bypass |
| `ArgumentValidationError` / `licenseFormat` | Backend viejo o APK vieja; `convex deploy` + **nueva** build EAS |
| Admin vacío / no ve solicitudes | Misma URL Convex + Choferes lista pendientes (post `e04a354`) |
| Usuario borrado en Convex → app se cae | Con `AuthSessionGuard` cierra sesión; reinstalar APK nueva |
| `eas` no se reconoce | Invocar `node ...\eas-cli\bin\run` o arreglar PATH de Node para `cmd` |
| Push GitHub pide login | `gh auth login` + código en https://github.com/login/device |
| Vercel: Root Directory no existe | Deploy desde **raíz** del monorepo, no solo desde `apps/web-admin` |

---

## 10) Docs relacionadas

| Doc | Contenido |
| --- | --- |
| [0 CAMBIOS PROD Y REGISTRO CHOFER.md](./0%20CAMBIOS%20PROD%20Y%20REGISTRO%20CHOFER.md) | Qué se cambió en sep 2026 (prod único + registro) |
| [setup-pc.md](./setup-pc.md) | Arranque rápido en esta PC |
| [6 DEPLOY ADMIN VERCEL.md](./6%20DEPLOY%20ADMIN%20VERCEL.md) | Deploy admin |
| [eas-build-setup.md](./eas-build-setup.md) | Builds EAS |
| [conectar-convex-expo.md](./conectar-convex-expo.md) | Convex + Expo (histórico; preferir esta guía) |
| [registro-chofer.md](./registro-chofer.md) | Flujo registro chofer |
| [5 WEB ADMIN PANEL.md](./5%20WEB%20ADMIN%20PANEL.md) | Panel admin |
