# Pendientes + variables de entorno (cuentas empresa)

Checklist tras migrar de cuentas **personales** → **empresa**
(`hercom.desarrollo@gmail.com` / team Convex `hercom-app` / Expo `hercom-worker`).

Comando Expo local (no lo ejecuta el agente; tú lo corres):

```powershell
pnpm --filter @proyecto/mobile start -- --tunnel --clear
```

---

## A) Variables de entorno — qué falta / dónde va

### 1. Convex (backend) — dashboard o CLI

Desde `packages/backend`:

```powershell
cd packages/backend
npx convex env list
```

| Variable | Para qué | Estado típico post-migración |
| --- | --- | --- |
| `AUTH_GOOGLE_ID` | Login Google | Configurar en proyecto empresa |
| `AUTH_GOOGLE_SECRET` | Login Google | Configurar en proyecto empresa |
| `SITE_URL` | Callback OAuth / Auth | Ej. `https://perceptive-setter-262.convex.site` o URL admin |
| `JWKS` / `JWT_PRIVATE_KEY` | Convex Auth | Las crea `npx @convex-dev/auth` |
| `DECOLECTA_API_KEY` | Validar DNI RENIEC | **Pendiente** — por eso fallaba «Validar» |

```powershell
npx convex env set AUTH_GOOGLE_ID "...."
npx convex env set AUTH_GOOGLE_SECRET "...."
npx convex env set SITE_URL "https://TU-DEPLOYMENT.convex.site"
# Cuando tengas Decolecta:
npx convex env set DECOLECTA_API_KEY "...."
```

Google Cloud (cuenta empresa): OAuth client con redirect  
`https://TU-DEPLOYMENT.convex.site/api/auth/callback/google`

### 2. App móvil — `apps/mobile/.env`

| Variable | Ejemplo |
| --- | --- |
| `EXPO_PUBLIC_CONVEX_URL` | `https://perceptive-setter-262.convex.cloud` |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Key Places/Geocoding/Maps SDK |

Reinicia Metro tras cambiar `.env`.

### 3. EAS / Expo (`apps/mobile/eas.json` + secrets)

Mismas `EXPO_PUBLIC_*` en perfiles `development` / `preview` / `production`.  
Maps en `app.json` (`ios.config.googleMapsApiKey`, `android.config.googleMaps.apiKey`).

### 4. Vercel (web-admin / web-comercial)

| Variable | Notas |
| --- | --- |
| `VITE_CONVEX_URL` (o la que use el front) | URL Convex empresa |
| Auth | Misma app Google + `SITE_URL` alineado al dominio Vercel |

Ver también [`6 DEPLOY ADMIN VERCEL.md`](./6%20DEPLOY%20ADMIN%20VERCEL.md).

### 5. GitHub

Sin secrets obligatorios para Expo Go local. CI (si hay) debe apuntar al repo/org empresa.

---

## B) Lista de actividades pendientes

### Bloqueantes / alta

| # | Actividad | Notas |
| --- | --- | --- |
| 1 | Completar env Convex empresa (`AUTH_GOOGLE_*`, `SITE_URL`) | Sin esto falla o es inestable el login Google |
| 2 | Configurar OAuth Google en GCP empresa + redirect Convex | Ver `convex-google-auth.md` |
| 3 | Confirmar `.env` móvil y `eas.json` con URL Convex empresa | Ya suele ser `perceptive-setter-262` |
| 4 | **Restaurar validación RENIEC** (`DECOLECTA_API_KEY` + `lookupDni`) | Hoy está en modo demo |
| 5 | Quitar / restringir `drivers.ensureDemoDriverProfile` | Solo para QA; no producción |

### Producto / compliance chofer

| # | Actividad | Notas |
| --- | --- | --- |
| 6 | Volver a exigir fotos brevete + CUL en registro | Backend `submit` ya las pide; el atajo «Modo conductor» las salta |
| 7 | Flujo de aprobación admin (no auto-approve) | Hoy `submit` aprueba al instante |
| 8 | Completar datos de vehículo (no `DEMO` / `PENDIENTE`) | |
| 9 | Número real de soporte (`helpContacts.ts`) | Placeholder `51999999999` |
| 10 | Ocultar código de seguridad en UI del chofer | Hoy lo ve el chofer en `ServiceCard` |

### UX / deuda

| # | Actividad | Notas |
| --- | --- | --- |
| 11 | Cablear ítems del drawer (historial, config, etc.) | Casi stubs |
| 12 | Actualizar `flujo-vistas.md` (sigue describiendo móvil “solo chofer”) | |
| 13 | Habilitar Maps SDK en GCP si el mapa sale en blanco | Ver `google-maps-y-waze.md` |

### Demo temporal (activo ahora)

| Comportamiento | Código |
| --- | --- |
| «Validar» DNI **no** llama Decolecta; nombres editables | `DriverRegisterScreen.tsx` |
| «Modo conductor» sin perfil → crea chofer demo y entra | `SideDrawer` + `drivers.ensureDemoDriverProfile` |

Cuando restaures RENIEC: revertir esos dos puntos y tachar #4 y #5.

---

## C) Referencias

- Modelo de flujo: [`0 MODELO DEL SISTEMA - FLUJO MOVIL.md`](./0%20MODELO%20DEL%20SISTEMA%20-%20FLUJO%20MOVIL.md)
- Google Auth: [`convex-google-auth.md`](./convex-google-auth.md)
- Registro chofer + Decolecta: [`registro-chofer.md`](./registro-chofer.md)
- Maps / Waze: [`google-maps-y-waze.md`](./google-maps-y-waze.md)
- Diseño: [`guia-diseno.md`](./guia-diseno.md)
