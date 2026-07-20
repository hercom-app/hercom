# Choferes de Reemplazo — Hercom

Monorepo (pnpm + Turborepo) para una plataforma de choferes para reemplazo con un
backend único de Convex compartido por tres aplicaciones.

> **Guía de vistas y flujo del negocio:** [`docs/flujo-vistas.md`](docs/flujo-vistas.md)
> (orientada a alguien ajeno al código).
>
> **Guía de diseño (elementos UI, CSS/Tailwind, marca Hercom):**
> [`docs/guia-diseno.md`](docs/guia-diseno.md)
>
> **Flujo visual Google Auth (diagramas):**
> [`docs/flujo-google-auth.md`](docs/flujo-google-auth.md)

---

## Estructura general

```
proyecto/
├─ packages/backend/          # Backend Convex (schema, auth, funciones)
├─ apps/web-comercial/        # Web clientes (Vite + React + Tailwind)
├─ apps/web-admin/            # Panel admin (Vite + React + Tailwind)
├─ apps/mobile/               # App choferes (Expo + NativeWind)
├─ docs/                      # Guías operativas
├─ PLAN.md                    # Plan de arquitectura
└─ README.md                  # Este archivo
```

---

## Vistas actuales (mapa rápido)

| App | Vista | Archivo principal |
| --- | --- | --- |
| Móvil | Login Hercom | `apps/mobile/src/screens/SignInScreen.tsx` |
| Móvil | Panel del chofer | `apps/mobile/src/screens/DriverDashboard.tsx` |
| Web comercial | Login / registro | `apps/web-comercial/src/components/SignInForm.tsx` |
| Web comercial | Solicitar + mis servicios | `apps/web-comercial/src/App.tsx` |
| Web admin | Login admin | `apps/web-admin/src/components/SignInForm.tsx` |
| Web admin | Tablero + pagos + comisiones | `apps/web-admin/src/App.tsx` |

---

## Mapa de archivos por aplicación

<!-- RESUMEN DE FUNCIONALIDADES — usar esta sección para ubicar vistas y assets -->

### App móvil (`apps/mobile/`)

Punto de entrada y enrutamiento por sesión (no hay React Navigation aún; `App.tsx`
decide qué pantalla mostrar).

| Archivo | Función |
| --- | --- |
| `App.tsx` | Enruta: cargando → login → panel chofer. Configura Convex + auth seguro. |
| `index.ts` | Registra la app en Expo. |
| `app.json` | Configuración Expo (nombre, slug, bundle id). |
| `tailwind.config.js` | Colores Hercom (`hercom` = `#007AFF`) y clases NativeWind. |
| `global.css` | Estilos base Tailwind para NativeWind. |
| `babel.config.js` | Babel + NativeWind + worklets. |
| `metro.config.js` | Bundler; soporte monorepo. |
| `.env` | `EXPO_PUBLIC_CONVEX_URL` — URL del backend. |

**Pantallas (`src/screens/`)**

| Archivo | Vista | Qué hace |
| --- | --- | --- |
| `SignInScreen.tsx` | **Login Hercom** | Logo, HERCOM, formulario email/contraseña, botón Entrar. |
| `DriverDashboard.tsx` | **Panel chofer** | Disponibilidad, lista de viajes activos, cerrar sesión. Muestra aviso si no hay perfil de chofer. |

**Componentes (`src/components/`)**

| Archivo | Qué hace |
| --- | --- |
| `HercomLogo.tsx` | Renderiza `assets/images/hercom-logo.png`. |
| `AvailabilityToggle.tsx` | Cambia estado: disponible / desconectado / en servicio. |
| `ServiceCard.tsx` | Tarjeta de viaje con botones Iniciar / Finalizar. |

**Constantes (`src/constants/`)**

| Archivo | Qué hace |
| --- | --- |
| `theme.ts` | Paleta Hercom en código (`#007AFF`, etc.). |

**Imágenes — dónde poner logos e íconos**

```
apps/mobile/assets/images/
└── hercom-logo.png    ← logo principal Hercom (reemplazar este archivo)
```

Uso en código: `require("../../assets/images/hercom-logo.png")` desde componentes en
`src/`.

---

### Web comercial (`apps/web-comercial/`)

| Archivo | Función |
| --- | --- |
| `src/main.tsx` | Arranca React + ConvexAuthProvider. |
| `src/App.tsx` | Sin sesión → login. Con sesión → formulario + lista de servicios. |
| `src/components/SignInForm.tsx` | **Vista login/registro** de clientes. |
| `src/components/RequestServiceForm.tsx` | **Vista solicitud:** origen, destino, precio. |
| `src/components/MyServices.tsx` | **Vista seguimiento:** lista de servicios del cliente en tiempo real. |
| `src/index.css` | Estilos Tailwind globales. |
| `tailwind.config.js` | Tema visual web comercial. |
| `.env.local` | `VITE_CONVEX_URL` |

**Imágenes — dónde poner logos**

```
apps/web-comercial/public/          ← crear esta carpeta
└── logo-hercom.png                 ← accesible como /logo-hercom.png
```

O bien: `apps/web-comercial/src/assets/` e importar en componentes.

Puerto: **http://localhost:5173**

---

### Web admin (`apps/web-admin/`)

| Archivo | Función |
| --- | --- |
| `src/main.tsx` | Arranca React + ConvexAuthProvider. |
| `src/App.tsx` | Login → valida rol admin → dashboard o acceso denegado. |
| `src/components/SignInForm.tsx` | **Vista login** solo para administradores. |
| `src/components/ServicesBoard.tsx` | **Vista servicios:** tabla + asignar chofer. |
| `src/components/PaymentsPanel.tsx` | **Vista pagos:** marcar pagos de clientes. |
| `src/components/PayoutsPanel.tsx` | **Vista comisiones:** liquidar pagos a choferes. |
| `.env.local` | `VITE_CONVEX_URL` |

**Imágenes:** igual que web comercial → `apps/web-admin/public/`

Puerto: **http://localhost:5174**

---

### Backend Convex (`packages/backend/`)

| Archivo | Función |
| --- | --- |
| `convex/schema.ts` | Tablas e índices (users, drivers, services, payments, payouts). |
| `convex/auth.ts` | Login con contraseña (Convex Auth). |
| `convex/users.ts` | Perfil, roles (`getMe`, `setRole`). |
| `convex/drivers.ts` | Choferes: disponibilidad, perfil. |
| `convex/services.ts` | Ciclo de vida del viaje (crear, asignar, estados). |
| `convex/payments.ts` | Pagos de clientes. |
| `convex/payouts.ts` | Comisiones de choferes. |
| `convex/seed.ts` | Datos demo (`npx convex run seed:seedDemo`). |
| `convex/lib/auth.ts` | Helpers: `requireUser`, `requireRole`, `requireDriver`. |
| `convex/lib/constants.ts` | `COMMISSION_RATE` (20 %). |
| `.env.local` | Generado por `convex dev` (no editar a mano). |

---

## Requisitos

- Node.js >= 18
- pnpm 9 (`npm install -g pnpm`)
- Cuenta de [Convex](https://convex.dev)
- **Expo Go** con **SDK 54** (App Store / Play Store)

## Puesta en marcha

```bash
pnpm install
pnpm --filter @proyecto/backend dev    # Terminal 1 — dejar abierta
pnpm mobile                            # Terminal 2 — QR para Expo Go
pnpm web:comercial                     # http://localhost:5173
pnpm web:admin                         # http://localhost:5174
```

Guías detalladas:

- Flujo de vistas y negocio: [`docs/flujo-vistas.md`](docs/flujo-vistas.md)
- Guía de diseño (UI, CSS, Hercom): [`docs/guia-diseno.md`](docs/guia-diseno.md)
- Conexión Convex + Expo: [`docs/conectar-convex-expo.md`](docs/conectar-convex-expo.md)
- Login con Google (Gmail): [`docs/convex-google-auth.md`](docs/convex-google-auth.md)
- SMS, WhatsApp y otros métodos: [`docs/opciones-autenticacion.md`](docs/opciones-autenticacion.md)
- Demo en celular (QR): [`docs/demo-expo.md`](docs/demo-expo.md)
- Google Maps / Places / Waze: [`docs/google-maps-y-waze.md`](docs/google-maps-y-waze.md)
- Plan de arquitectura: [`PLAN.md`](PLAN.md)

## Scripts útiles

| Script | Descripción |
| --- | --- |
| `pnpm backend:dev` | Arranca `convex dev` |
| `pnpm web:comercial` | Web de clientes |
| `pnpm web:admin` | Panel administrativo |
| `pnpm mobile` | App Expo de choferes |

## Reglas del proyecto

- TypeScript estricto en todo el monorepo.
- Convex: `query` para leer, `mutation` para escribir.
- App móvil: solo componentes `react-native` (nunca HTML); estilos con NativeWind.
- Marca Hercom: azul `#007AFF`, tarjetas blancas `rounded-3xl`, tipografía bold en títulos.
