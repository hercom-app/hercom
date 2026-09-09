# Cambios: prod único + registro chofer (sep 2026)

Resumen de lo implementado y desplegado alrededor del commit **`e04a354`**  
(*Unificar a Convex prod y mejorar registro de chofer*).

---

## Decisión de ambientes

| Antes | Ahora (hasta Play Store) |
| --- | --- |
| APK preview → Convex **dev** (`perceptive-setter-262`) | Todo → Convex **prod** `lovable-kudu-343` |
| Admin Vercel a veces en otro deployment | Admin → misma URL prod |
| Docs mezclaban `wry-lapwing-809` / `hip-mink-145` | Docs unificadas a `lovable-kudu-343` |

**Preview Vercel / Convex de prueba:** se vuelve a introducir **después** de Play Store.

URL admin (producción; el nombre “opal” es solo el alias de Vercel):  
https://hercom-web-admin-opal.vercel.app/

---

## Backend (Convex prod)

- Desplegado a `https://lovable-kudu-343.convex.cloud`
- `driverApplications.submit` acepta `licenseFormat` (`physical` | `digital`)
- Nuevo campo `vehicleBodyType` (`auto` | `camioneta`)
- Queries `getMe`-relacionadas no tiran si el usuario ya no existe (`getCurrentUser` + logout en app)
- Data: se corrió `seed:resetForOwnerKickoff --prod` (limpieza) + `seed:seedDemo --prod`

Dashboard: https://dashboard.convex.dev/d/lovable-kudu-343

---

## App móvil — registro de chofer

Archivos clave:

- `apps/mobile/src/screens/DriverRegisterScreen.tsx`
- `apps/mobile/src/components/DriverRegionFields.tsx`
- `apps/mobile/src/components/DocumentPreviewModal.tsx`
- `apps/mobile/src/components/AuthSessionGuard.tsx`
- `apps/mobile/eas.json` / `.env` → Convex prod

Cambios de producto:

1. Modales país / departamento / provincia / distrito legibles (sheet con altura fija)
2. Eliminada la sección / copy de “zona de operación”
3. Orden del formulario: **DNI → sexo → ubicación → brevete → récord → CUL**
4. Brevete digital: **PDF o imagen** + link https://licencias.mtc.gob.pe/#/index
5. Fotos: **cámara o galería**
6. Vista previa de documentos (imagen en modal; PDF abre visor)
7. Checklist **auto / camioneta**
8. Si borran el usuario en Convex, la app **cierra sesión** (`AuthSessionGuard`)

---

## Web admin

- `DriversView`: lista **solicitudes pendientes** aunque aún no exista fila en `drivers`
- `VITE_CONVEX_URL` = prod
- Redeploy Vercel producción alias opal

Login demo: `admin@demo.com` / `demo1234`

---

## Tooling PC (Windows)

Scripts nuevos/actualizados:

| Script | Uso |
| --- | --- |
| `scripts/install-dev-tools.ps1` | Instala Node + Git + pnpm en User PATH |
| `scripts/verify-convex.ps1` | Chequea tools + URL Convex + HTTP |
| `scripts/start-mobile-tunnel.ps1` | Expo túnel sin depender de `.tools` |
| `scripts/git.ps1` | Git del sistema o portable |

Cursor: terminal con `ExecutionPolicy Bypass` + PATH a `Programs\nodejs` y `Programs\Git` (ver setup desde cero).

---

## Builds / deploys de referencia

| Qué | Detalle |
| --- | --- |
| Commit | `e04a354` en `main` (repo `hercom-app/hercom`) |
| Admin | Deploy prod → https://hercom-web-admin-opal.vercel.app/ |
| EAS | Build preview Android desde `e04a354` (ver Expo dashboard) |

La APK anterior (`47fbc9f`) **no** incluye estos cambios ni la URL prod: hay que instalar la build nueva.

---

## Cómo reproducir deploy

```powershell
# Backend
cd packages\backend
npx convex deploy --yes

# Admin (desde raíz del monorepo)
cd ..\..
npx vercel deploy --prod --yes --scope hercoms-projects

# APK
cd apps\mobile
$env:EAS_BUILD = "true"
npx eas-cli build --platform android --profile preview --non-interactive --no-wait
```

Guía completa desde cero: [0 SETUP DESDE CERO.md](./0%20SETUP%20DESDE%20CERO.md)
