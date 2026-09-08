# Pantalla de login (móvil) y estructura del proyecto

Referencia para diseño (Dribbble, Figma), desarrollo y capturas. Describe la **primera
pantalla** que ve el usuario al abrir Hercom sin sesión.

---

## ¿Es HTML?

**No.** La app móvil (`apps/mobile`) usa **React Native** + **TypeScript** (archivos
`.tsx`) con **Expo** y **NativeWind** (clases estilo Tailwind).

| Web (HTML) | React Native (móvil) | Rol |
| --- | --- | --- |
| `<div>` | `<View>` | Contenedor / layout |
| `<p>`, `<span>` | `<Text>` | Todo texto visible |
| `<button>` | `<TouchableOpacity>` | Botones táctiles |
| `<img>` | `<Image>` | Imágenes (logo PNG) |
| `class="..."` | `className="..."` | Estilos vía NativeWind |

La app corre en **Expo Go** o en build nativo; no es una página web.

---

## Archivos de esta pantalla

| Archivo | Qué hace |
| --- | --- |
| [`apps/mobile/src/screens/SignInScreen.tsx`](../apps/mobile/src/screens/SignInScreen.tsx) | **Layout completo** del login |
| [`apps/mobile/src/components/HercomLogo.tsx`](../apps/mobile/src/components/HercomLogo.tsx) | Muestra `assets/images/hercom-logo.png` |
| [`apps/mobile/src/components/GoogleSignInButton.tsx`](../apps/mobile/src/components/GoogleSignInButton.tsx) | Botón «Continuar con Google» (OAuth) |
| [`apps/mobile/src/components/LegalDocumentModal.tsx`](../apps/mobile/src/components/LegalDocumentModal.tsx) | Modal de Términos / Privacidad |
| [`apps/mobile/App.tsx`](../apps/mobile/App.tsx) | Si no hay sesión → `SignInScreen`; si hay → `HomeScreen` |
| [`apps/mobile/tailwind.config.js`](../apps/mobile/tailwind.config.js) | Colores `hercom`, `canvas`, etc. |
| [`apps/mobile/src/constants/theme.ts`](../apps/mobile/src/constants/theme.ts) | Paleta en código (CTAs, íconos) |
| [`apps/mobile/assets/images/hercom-logo.png`](../apps/mobile/assets/images/hercom-logo.png) | Logo institucional (PNG) |

---

## Diagrama de la pantalla (capas)

Vista de arriba hacia abajo:

```text
┌─────────────────────────────────────────┐
│ StatusBar (sistema: hora, batería)      │  ← expo-status-bar, style="light"
├─────────────────────────────────────────┤
│                                         │
│   ZONA A — Hero / cabecera de marca     │
│   Fondo: bg-hercom (#0B70FE)            │
│   flex-1 (ocupa el espacio disponible)  │
│                                         │
│        [ hercom-logo.png ]              │  ← HercomLogo, width ~200
│                                         │
├────── curva rounded-t-[28px] ───────────┤  ← Transición visual
│   ZONA B — Panel inferior (mínimo)      │
│   Fondo: bg-canvas (#F4F6F8)           │
│   Sin flex-1: solo alto del contenido   │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │ ZONA C — Login card             │   │
│   │ bg-white, rounded-3xl, sombra   │   │
│   │                                 │   │
│   │   «Inicia sesión» (título)      │   │
│   │   [ Continuar con Google ]      │   │  ← CTA principal
│   │   (mensaje error si falla)      │   │
│   └─────────────────────────────────┘   │
│                                         │
│   ZONA D — Footer legal (links)         │
│   Términos de Uso · Política…           │
└─────────────────────────────────────────┘
```

---

## Cada elemento (glosario para diseño)

| # | Nombre en diseño | Código / clase | Descripción |
| --- | --- | --- | --- |
| A1 | **Hero header** / brand header | `View` + `bg-hercom` + `flex-1` | Bloque azul superior; debe coincidir con el azul del PNG (`#0B70FE`) |
| A2 | **Logo mark** | `HercomLogo` → PNG | Imagen con caja blanca, wordmark y tagline incluidos en el asset |
| B1 | **Sheet transition** / curva | `rounded-t-[28px]` + `marginTop: -20` | Esquinas superiores redondeadas; el panel gris «sube» sobre el azul |
| B2 | **Canvas** / surface de fondo | `bg-canvas` (`#F4F6F8`) | Gris muy claro del panel inferior |
| C1 | **Login card** / action card | `bg-white`, `rounded-3xl`, `LOGIN_CARD_SHADOW` | Tarjeta blanca con borde `slate-100` y sombra hacia abajo |
| C2 | **Section title** | `Text` «Inicia sesión» | `text-lg font-bold text-slate-900` |
| C3 | **Primary CTA** | `GoogleSignInButton` | OAuth Google; altura ~56px (`h-14`), borde gris claro |
| C4 | **Error state** | `Text` rojo | Solo si falla el login |
| D1 | **Legal disclaimer** | `Text` 12px `text-slate-500` | Links subrayados a modales legales |

### Tokens de color (login)

| Token | Hex | Uso en login |
| --- | --- | --- |
| `hercom` | `#0B70FE` | Fondo hero — **mismo azul que el PNG** del logo |
| `hercom-dark` | `#0959CC` | Estados pressed en resto de la app |
| `canvas` | `#F4F6F8` | Panel inferior |
| `white` | `#FFFFFF` | Card y botón Google |

> El azul anterior `#007AFF` (iOS) no coincidía con el logo; se alineó a `#0B70FE`
> muestreado del PNG.

---

## Flujo de navegación (auth)

```text
App.tsx
  └─ ConvexAuthProvider
       ├─ AuthLoading → spinner
       ├─ Unauthenticated → SignInScreen  ← esta pantalla
       └─ Authenticated → HomeScreen (pasajero / chofer)
```

Tras Google OAuth exitoso, Convex Auth guarda sesión y la app muestra `HomeScreen` sin
volver a pasar por login.

---

## Estructura del monorepo Hercom

```text
hercom/                         ← https://github.com/hercom-app/hercom
├── apps/
│   ├── mobile/                 ← App Expo (choferes / pasajeros)
│   │   ├── App.tsx             ← Entrada, fuentes, auth
│   │   ├── app.config.js       ← Config Expo (dev vs EAS Build)
│   │   ├── app.json            ← Metadatos, splash, íconos
│   │   ├── assets/images/      ← Logo, icon, splash
│   │   └── src/
│   │       ├── screens/        ← Pantallas (SignIn, Home, dashboards…)
│   │       ├── components/     ← UI reutilizable (botones, modales…)
│   │       ├── constants/      ← theme.ts, textos legales
│   │       ├── contexts/       ← Estado global (modo pasajero/chofer)
│   │       └── hooks/          ← Lógica reutilizable
│   ├── web-admin/              ← Panel administración (React + Vite)
│   ├── web-comercial/          ← Web comercial
│   └── landing-page/           ← Landing pública
├── packages/
│   └── backend/                ← Convex (schema, funciones, auth)
├── docs/                       ← Documentación (este archivo, setup, flujos…)
├── scripts/
│   └── start-mobile-tunnel.ps1 ← Levantar Expo con túnel en Windows
├── package.json                ← Scripts raíz (mobile:tunnel, backend:dev…)
└── pnpm-workspace.yaml         ← Monorepo pnpm
```

### Comandos habituales (raíz)

| Comando | Qué hace |
| --- | --- |
| `pnpm backend:dev` | Convex en desarrollo |
| `pnpm mobile:tunnel` | Expo + túnel (`exp.direct`) para celular |
| `pnpm mobile` | Expo en LAN (misma Wi‑Fi) |
| `pnpm web:admin` | Panel admin local |

Ver también: [`setup-pc.md`](setup-pc.md), [`demo-expo.md`](demo-expo.md).

---

## Capturas para Dribbble

1. Levantar Expo con túnel (ver `setup-pc.md`).
2. Pantalla login → screenshot → `imagenes/capturas/01-login.png` (ver
   [`imagenes/TABLERO-DRIBBBLE.md`](../imagenes/TABLERO-DRIBBBLE.md)).
3. Vocabulario de capas: usar la tabla «Cada elemento» de este doc al armar el
   layout en Figma.

---

## Cambios de diseño recientes (login)

- Eliminado subtítulo «Chofer para remplazo» bajo «Inicia sesión» (el tagline sigue
  en el PNG del logo si el asset lo incluye).
- Panel inferior (`canvas`) con **altura mínima** (sin `flex-1`).
- Azul institucional alineado al logo: `#0B70FE`.
- Sombra de la card solo hacia abajo para no chocar con la curva de transición.
