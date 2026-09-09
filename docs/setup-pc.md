# Setup en una PC (Windows)

Guía para levantar Hercom **contra producción** (un solo ambiente hasta Play Store).

---

## Política de ambientes (actual)

Hasta que la app esté en Play Store:

| Pieza | Valor |
| --- | --- |
| Convex | **Producción** `https://lovable-kudu-343.convex.cloud` |
| Mobile / EAS | Misma URL en `.env` y `eas.json` |
| Web admin local | Misma URL en `apps/web-admin/.env.local` |
| Web admin Vercel | `VITE_CONVEX_URL` = misma URL |

No uses deployments de prueba (`perceptive-setter-262`, etc.) para datos reales. Un preview Vercel / Convex de prueba se agregará **después** de Play Store.

---

## Arranque en esta PC

### 1) Una sola vez — Node, Git, pnpm

```powershell
cd "C:\Users\Gustavo Miguel\Documents\hercom"
powershell -ExecutionPolicy Bypass -File .\scripts\install-dev-tools.ps1
```

Cerrá y abrí Cursor. Luego:

```powershell
node -v
npm -v
git --version
pnpm -v
```

### 2) Dependencias + verificar Convex prod

```powershell
pnpm install
powershell -ExecutionPolicy Bypass -File .\scripts\verify-convex.ps1
```

### 3) Cómo ver datos

1. [Dashboard Convex → lovable-kudu-343](https://dashboard.convex.dev/d/lovable-kudu-343) → Data → `driverApplications`
2. Admin: [https://hercom-web-admin-opal.vercel.app/](https://hercom-web-admin-opal.vercel.app/) (debe tener `VITE_CONVEX_URL=https://lovable-kudu-343.convex.cloud`)
3. Choferes lista **solicitudes pendientes** y choferes aprobados

Login admin demo (seed): `admin@demo.com` / `demo1234`

---

## Trabajo diario

```powershell
cd "C:\Users\Gustavo Miguel\Documents\hercom"

# Solo si editás packages/backend/convex — publica a PROD
cd packages\backend
npx convex deploy --yes

# Mobile
cd "C:\Users\Gustavo Miguel\Documents\hercom"
powershell -ExecutionPolicy Bypass -File .\scripts\start-mobile-tunnel.ps1

# Admin local
pnpm web:admin
```

> Con la política actual, los cambios de backend van a **prod** (`npx convex deploy`). No hace falta `convex dev` contra otro deployment.

---

## Checklist

1. [ ] `node` / `npm` / `git` / `pnpm` sin declarar PATH
2. [ ] `.env` mobile y admin apuntan a `lovable-kudu-343`
3. [ ] `verify-convex.ps1` OK
4. [ ] Google OAuth callback incluye `https://lovable-kudu-343.convex.site/api/auth/callback/google`

---

## Esta PC

| Detalle | Valor |
| --- | --- |
| Repo | https://github.com/hercom-app/hercom |
| Ruta | `C:\Users\Gustavo Miguel\Documents\hercom` |
| Convex | `https://lovable-kudu-343.convex.cloud` |
| Admin | https://hercom-web-admin-opal.vercel.app/ |

---

## Referencias

- Admin Vercel: `docs/6 DEPLOY ADMIN VERCEL.md`
- Panel admin: `docs/5 WEB ADMIN PANEL.md`
- Registro chofer: `docs/registro-chofer.md`
