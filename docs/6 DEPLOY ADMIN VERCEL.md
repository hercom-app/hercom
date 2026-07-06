# Publicar el panel admin en producción

Guía completa (Hercom, julio 2026). Lenguaje simple + comandos exactos.

---

## Mapa de lo que hay en internet

| Qué | URL | Dónde vive |
| --- | --- | --- |
| Landing pública | `www.hercom.pe` | Proyecto Vercel **aparte** (landing) |
| Panel admin | `admin.hercom.pe` | Proyecto Vercel **`hercom-web-admin`** |
| Backend (datos) | Convex producción | `https://wry-lapwing-809.convex.cloud` |
| Desarrollo local | tu PC | Convex dev `https://hip-mink-145.convex.cloud` |

**Importante:** local y producción son **dos bases de datos distintas**. Lo que creas en dev no existe en prod hasta que lo ejecutes con `--prod`.

---

## Checklist rápido (orden correcto)

- [x] Código en GitHub (`hercom-prjct/app-choferes-hercom`)
- [x] `npx convex deploy` → backend en producción
- [x] Proyecto Vercel con Root Directory `apps/web-admin`
- [x] Variable `VITE_CONVEX_URL` = URL de **producción** Convex
- [x] `npx @convex-dev/auth --prod` → claves JWT en producción
- [x] `npx convex run seed:seedDemo --prod` → usuarios demo en producción
- [x] Login OK en `https://hercom-web-admin.vercel.app`
- [ ] Dominio `admin.hercom.pe` (DNS + Vercel Domains)
- [ ] Actualizar `SITE_URL` a `https://admin.hercom.pe` (después del dominio)

---

## Paso 1 — Backend en producción (Convex)

Desde `packages/backend`:

```powershell
cd packages/backend
npx convex deploy
```

Cuando pregunte si subir a prod → **Yes**.

| Entorno | Deployment | URL |
| --- | --- | --- |
| **Dev** (local, `convex dev`) | `hip-mink-145` | `https://hip-mink-145.convex.cloud` |
| **Prod** (internet) | `wry-lapwing-809` | `https://wry-lapwing-809.convex.cloud` |

En Vercel **siempre** usa la URL de **prod** (`wry-lapwing-809`), no la de dev.

---

## Paso 2 — Activar login en producción (Convex Auth)

El deploy de Convex sube código, pero el **login** necesita claves JWT en prod. Sin esto, el seed crea usuarios pero el navegador responde *“Credenciales inválidas”*.

Desde `packages/backend`:

```powershell
npx @convex-dev/auth --prod
```

Te preguntará la URL del sitio. Pon la URL de Vercel por ahora:

```
https://hercom-web-admin.vercel.app
```

Eso configura en producción:

- `SITE_URL`
- `JWT_PRIVATE_KEY`
- `JWKS`

> **Nota:** la versión antigua del CLI (`0.0.87`) no tiene `--web-server-url`. Usa el comando interactivo de arriba o `npx @convex-dev/auth@latest --prod`.

---

## Paso 3 — Usuarios demo en producción

Los usuarios `admin@demo.com` / `demo1234` existen en **dev** por defecto. En **prod** hay que crearlos:

```powershell
npx convex run seed:seedDemo --prod
```

Cuentas creadas (misma contraseña `demo1234`):

| Rol | Email |
| --- | --- |
| Admin | `admin@demo.com` |
| Chofer | `chofer@demo.com` |
| Cliente | `cliente@demo.com` |

Idempotente: puedes correrlo varias veces.

---

## Paso 4 — Proyecto en Vercel

### Crear proyecto (separado de la landing)

1. [vercel.com](https://vercel.com) → cuenta **hercom.desarrollo@gmail.com**
2. **Add New → Project** → repo `hercom-prjct/app-choferes-hercom`
3. **Root Directory:** `apps/web-admin` (solo el admin, no mobile ni web-comercial)
4. Framework: **Vite** (detectado automático)
5. **Environment Variables** antes del Deploy:

| Key | Value |
| --- | --- |
| `VITE_CONVEX_URL` | `https://wry-lapwing-809.convex.cloud` |

6. **Deploy**

URL temporal actual: **https://hercom-web-admin.vercel.app**

### Si agregaste la variable después del primer deploy

Vite la embebe al compilar. Hay que **Redeploy**:

Deployments → último deploy → **⋯ → Redeploy**

---

## Paso 5 — Dominio `admin.hercom.pe`

### 5.1 En Vercel

1. Proyecto **hercom-web-admin**
2. **Settings → Domains**
3. Agregar: **`admin.hercom.pe`**
4. Vercel muestra el registro DNS que falta

### 5.2 En el panel DNS de `hercom.pe`

Crear registro:

| Tipo | Nombre / Host | Valor |
| --- | --- | --- |
| **CNAME** | `admin` | Lo que indique Vercel (ej. `cname.vercel-dns.com`) |

Esperar propagación (5 min – 1 h). Cuando Vercel marque **Valid**, abrir:

**https://admin.hercom.pe**

### 5.3 Actualizar SITE_URL en Convex (después del dominio)

Cuando `admin.hercom.pe` funcione, alinear Convex:

```powershell
cd packages/backend
npx convex env set SITE_URL https://admin.hercom.pe --prod
```

---

## GitHub + Vercel (cuentas distintas)

| Servicio | Cuenta usada |
| --- | --- |
| GitHub repo | org `hercom-prjct` (antes `gggaaarl`) |
| Vercel | `hercom.desarrollo@gmail.com` |

No hace falta que el correo de GitHub coincida con Vercel. Lo importante:

1. La cuenta de GitHub con acceso al repo esté conectada a Vercel
2. En GitHub → Settings → Applications → **Vercel** → dar acceso al repo `app-choferes-hercom`

---

## Deploys automáticos

Cada `git push` a `main` redeploya el admin si el proyecto Vercel apunta a esa rama.

Build local de prueba:

```powershell
pnpm --filter @proyecto/web-admin build
```

Config en repo: `apps/web-admin/vercel.json`

---

## Problemas que ya resolvimos

### “Credenciales inválidas” con seed OK

**Causa:** producción sin claves JWT (`JWT_PRIVATE_KEY`, `JWKS`).

**Solución:** `npx @convex-dev/auth --prod` + volver a correr `seed:seedDemo --prod`.

### Login OK en local, no en Vercel

**Causa:** `VITE_CONVEX_URL` apunta a dev (`hip-mink-145`) o falta redeploy.

**Solución:** variable = `https://wry-lapwing-809.convex.cloud` + Redeploy.

### Repo no aparece en Vercel

**Causa:** app de Vercel en GitHub sin acceso al repo.

**Solución:** GitHub → Applications → Vercel → Repository access → incluir `app-choferes-hercom`.

### `cd packages/backend` falla

Estás dentro de `packages/`. Usa `cd backend` o la ruta completa:

```powershell
cd C:\Users\Usuario\PROYECTOS\app-choferes-hercom\packages\backend
```

### `unknown option '--web-server-url'`

Versión vieja del CLI. Usa `npx @convex-dev/auth --prod` (interactivo) o `@latest`.

### “No tiene permisos de administrador”

El usuario existe pero su rol no es `admin`. Cambiar rol desde el panel o en tabla `users` del dashboard Convex prod.

---

## Seguridad

- No enlazar el admin desde la landing pública.
- Cambiar contraseñas demo antes de operación real.
- Opcional: restringir `admin.hercom.pe` por IP en Cloudflare.

---

## Resumen en una frase

**Convex prod + auth JWT + seed prod + Vercel (`apps/web-admin` + `VITE_CONVEX_URL`) + CNAME `admin` → Vercel.**

Ver también: [`5 WEB ADMIN PANEL.md`](5%20WEB%20ADMIN%20PANEL.md) · [`0 RESUMEN SIMPLE.md`](0%20RESUMEN%20SIMPLE.md)
