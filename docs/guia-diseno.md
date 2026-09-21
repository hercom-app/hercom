# Guía de diseño — Hercom

Referencia visual: **elementos de UI**, **Tailwind / NativeWind**, **marca** y **patrones de layout** (app de transporte: mapa + bottom sheet).

Documento tipográfico detallado y alternativas para el dueño: [`TIPOGRAFIA.md`](./TIPOGRAFIA.md).

---

## Aviso: móvil vs web

| Plataforma | Stack | HTML |
| --- | --- | --- |
| **App móvil** (`apps/mobile`) | React Native + NativeWind | **No** — solo `View`, `Text`, `TouchableOpacity`, etc. |
| **Webs** (`web-comercial`, `web-admin`) | React + Tailwind | **Sí** |

---

## Dirección visual actual (2026)

| Antes (retirado en docs) | Ahora |
| --- | --- |
| Estética “field service” / paneles oscuros / nomenclatura legacy en código | **App de transporte:** mapa fullscreen, sheet blanco, FABs, azul Hercom |
| Tipografía móvil documentada como Poppins | **Código real:** Work Sans + Arvo — **en revisión** (ver [`TIPOGRAFIA.md`](./TIPOGRAFIA.md)) |
| Azul `#007AFF` (iOS genérico) | **Azul institucional `#0B70FE`** (logo Hercom) |

> **Código legacy:** el archivo `tactical.tsx` y tokens `TACTICAL_*` en `theme.ts` son **nombres viejos de implementación**. No documentar ni diseñar pantallas nuevas con esa estética. Para UI nueva usar `components/ui.tsx`, `components/uber/*` y tokens `HERCOM_COLORS` / `UBER_RADIUS`.

---

## Paleta de colores

| Token | Hex | Uso |
| --- | --- | --- |
| `hercom` / `brand` | `#0B70FE` | CTAs, links, estados activos, FAB ayuda |
| `hercom-dark` / `brand-dark` | `#0959CC` | Pressed / hover |
| `primarySoft` | `#E8F2FF` | PIN viaje, badges, bandas de dato |
| `canvas` | `#F4F6F8` | Fondo pantallas secundarias (ajustes, historial) |
| `white` / `surface` | `#FFFFFF` | Bottom sheet, cards, drawer |
| `text` / slate-900 | `#0F172A` | Títulos |
| `textMuted` | `#64748B` | Subtítulos, hints |
| `danger` | `#DC2626` | Errores, cancelar |
| `success` | `#15803D` | Confirmaciones |

Definidos en:

- [`apps/mobile/tailwind.config.js`](../apps/mobile/tailwind.config.js)
- [`apps/mobile/src/constants/theme.ts`](../apps/mobile/src/constants/theme.ts)

**Regla:** no usar verde lima ni acentos de otras marcas (inDrive) en CTAs Hercom.

---

## Tipografía

| Plataforma | Estado | Detalle |
| --- | --- | --- |
| **Web admin** | Definida | Plus Jakarta Sans (títulos) + Inter (cuerpo) |
| **Web comercial** | Pendiente | System UI hasta rediseño |
| **App móvil** | **Inter sola** | Escala grande (`TYPE` en `theme.ts`) para adultos mayores |

Detalle de tamaños: [`TIPOGRAFIA.md`](./TIPOGRAFIA.md).

### Escala móvil (`TYPE` en `theme.ts`)

| Token | Tamaño | Uso |
| --- | --- | --- |
| `caption` | 17 | Labels, badges (mínimo) |
| `body` | 19 | Texto general |
| `bodyLg` | 21 | Inputs, filas sheet |
| `button` | 20 | Botones primarios |
| `title` | 26 | Títulos de sección |
| `headline` | 28 | Placa, montos grandes |
| `amount` | 34 | Tarifa destacada |

---

## Patrón layout móvil — mapa + bottom sheet (Uber / Hercom)

Inspiración: simplicidad, mapa central, tarjetas de estado, CTAs claros.  
Componentes: [`apps/mobile/src/components/uber/`](../apps/mobile/src/components/uber/).

| Elemento | Implementación |
| --- | --- |
| Mapa | `MapView` fullscreen (`PROVIDER_GOOGLE` en Android) |
| Menú | `HamburgerButton` variant `light` — círculo blanco sobre mapa |
| Chip ubicación | `LocationChip` — «De dónde» + dirección |
| Ayuda | `HelpFab` — esquina superior derecha |
| Bottom sheet | `UberBottomSheet` — `rounded-t-[28px]`, `UBER_RADIUS.sheet`, `SHEET_SHADOW` |
| Viaje activo | `ClientActiveTripSheet` — ETA, PIN, chofer, acciones del flujo existente |
| Botón primario | `UiButton` — `bg-hercom`, `UBER_RADIUS.button` |
| Pantallas cuenta | `AccountScreenShell` + `UberScreenHeader` — fondo `canvas` |

**Copy a evitar:** hints genéricos de IA, banners meta de “también conduces…”, pickers de región visibles (la región se infiere por GPS/Places).

---

## Componentes UI móvil (usar en diseño nuevo)

| Módulo | Cuándo |
| --- | --- |
| [`ui.tsx`](../apps/mobile/src/components/ui.tsx) | `UiButton`, `UiCard`, `UiChip`, `UiInput`, `UiEmpty` |
| [`uber/*`](../apps/mobile/src/components/uber/) | Mapa, sheets, viaje activo, chips |
| [`SideDrawer`](../apps/mobile/src/components/SideDrawer.tsx) | Menú lateral |
| [`HamburgerButton`](../apps/mobile/src/components/HamburgerButton.tsx) | FAB menú |

No introducir nuevos patrones visuales en `tactical.tsx` — solo mantenimiento de pantallas que aún lo importen hasta migrarlas.

---

## Espaciado y tarjetas

| Patrón | Clases / tokens |
| --- | --- |
| Pantalla | `flex-1` |
| Sheet superior | `rounded-t-[28px]` (`UBER_RADIUS.sheet`) |
| Card | `rounded-2xl` / `UBER_RADIUS.card`, fondo blanco, sombra suave |
| Input | `rounded-2xl`, borde `border`, fondo `surfaceMuted` |
| Padding horizontal | `px-4` / `px-6` |
| Área táctil mínima | 44×44 px |

---

## Botones

| Tipo | Móvil | Web (referencia) |
| --- | --- | --- |
| Primario | `UiButton` primary / `bg-hercom` | `bg-brand text-white font-semibold` |
| Secundario | `UiButton` variant `secondary` | borde + texto brand |
| Peligro | borde/texto `danger` | igual |
| Deshabilitado | opacidad ~45% | `disabled:opacity-60` |

---

## Assets

| App | Ruta |
| --- | --- |
| Móvil | `apps/mobile/assets/images/` (`hercom-logo.png`, `chofer.png`, …) |
| Web | `public/` en cada app |

Logo móvil: [`HercomLogo.tsx`](../apps/mobile/src/components/HercomLogo.tsx).

---

## Mapa de pantallas móviles

| Vista | Archivo | Patrón |
| --- | --- | --- |
| Login | `SignInScreen.tsx` | Hero azul + card blanca |
| Home (router) | `HomeScreen.tsx` | Cliente vs chofer |
| Cliente — pedir / viaje | `ClientDashboard.tsx` | Mapa + sheet |
| Chofer — panel | `DriverDashboard.tsx` | Header claro + secciones drawer |
| Registro chofer | `DriverRegisterScreen.tsx` | Formulario scroll |
| Checklist recojo | `ChecklistRecojoScreen.tsx` | Header blanco + form |
| Ajustes / seguridad / ayuda | `ClientSettingsScreen`, `ClientSecurityScreen`, `SupportChatScreen` | `AccountScreenShell` |

Documentación de flujo: [`flujo-vistas.md`](./flujo-vistas.md) · login: [`mobile-login-y-estructura.md`](./mobile-login-y-estructura.md) · pedir servicio: [`mobile-cliente-pedir-servicio.md`](./mobile-cliente-pedir-servicio.md).

---

## Web admin / comercial

Sin cambios de estructura en esta guía. Admin usa Plus Jakarta + Inter; comercial pendiente de rediseño.

Tablas, login admin y badges de servicio: ver secciones históricas en commits anteriores o [`7 PROPUESTAS LOGIN WEB.md`](./7%20PROPUESTAS%20LOGIN%20WEB.md).

---

## Estados de servicio (badges)

| Estado | Color |
| --- | --- |
| `pending` | ámbar |
| `assigned` | azul |
| `en_route` / en camino | índigo |
| `finished` | verde |
| `cancelled` | gris |

---

## Checklist — pantalla nueva Hercom

1. Mapa + sheet **o** fondo `canvas` / blanco (no paneles oscuros legacy).
2. Azul `#0B70FE` para un CTA principal por zona.
3. Tipografía según [`TIPOGRAFIA.md`](./TIPOGRAFIA.md) (cuando el dueño elija).
4. Tarjetas blancas, radios 16–28 px.
5. Móvil: solo React Native; reutilizar `ui` + `uber`.
6. No agregar botones/flows que no existan en Convex / admin.

---

## Documentos relacionados

- [`TIPOGRAFIA.md`](./TIPOGRAFIA.md) — fuentes y alternativas móvil
- [`flujo-vistas.md`](./flujo-vistas.md) — negocio y pantallas
- [`.cursor/rules/mobile-uber-redesign.mdc`](../.cursor/rules/mobile-uber-redesign.mdc) — reglas agente Cursor
- [`README.md`](../README.md) — mapa del repo
