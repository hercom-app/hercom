# Pantalla «¿Dónde necesitas un chofer de remplazo?» (móvil)

Referencia para diseño (Dribbble, Figma), desarrollo y capturas. Es el **paso 1**
del flujo de pedido del **modo pasajero/cliente** (`flowStep === "compose"`).

Captura Dribbble sugerida: `imagenes/capturas/04-pedir-servicio.png` (ver
[`imagenes/TABLERO-DRIBBBLE.md`](../imagenes/TABLERO-DRIBBBLE.md)).

---

## Archivo principal

| Archivo | Qué hace |
| --- | --- |
| [`apps/mobile/src/screens/ClientDashboard.tsx`](../apps/mobile/src/screens/ClientDashboard.tsx) | **Toda la vista cliente**: este paso, búsqueda de direcciones, confirmación con mapa, historial |
| [`apps/mobile/src/screens/HomeScreen.tsx`](../apps/mobile/src/screens/HomeScreen.tsx) | Si el modo es pasajero → renderiza `ClientDashboard` |
| [`apps/mobile/App.tsx`](../apps/mobile/App.tsx) | Tras login → `HomeScreen` |

No hay un archivo aparte solo para esta pantalla: vive dentro de
`ClientDashboard` cuando `flowStep === "compose"` y `addressSearchField === null`.

---

## Diagrama (paso compose — vista principal)

```text
┌─────────────────────────────────────────┐
│ StatusBar (sistema)                     │
├─────────────────────────────────────────┤
│ ZONA A — App bar                        │
│ [ ☰ menú ]                              │
│ bg-canvas, safe area top                │
├─────────────────────────────────────────┤
│ ZONA B — Título de pantalla             │
│ «¿Dónde necesitas un Chofer para        │
│   Remplazo?»                            │
│ text-2xl font-bold text-slate-900       │
├─────────────────────────────────────────┤
│ ZONA C — Route card (UiCard)            │
│ bg-white rounded-3xl + CARD_SHADOW      │
│                                         │
│   C1 Punto de recojo (campo táctil)     │
│   C2 «Usar mi ubicación actual» (CTA 2) │
│   C3 Destino (campo táctil)              │
│   C4 Paradas extra (opcional, 0..n)     │
│   C5 «+ Agregar parada» (link)          │
│   C6 «Continuar» (CTA primario)         │
├─────────────────────────────────────────┤
│ ZONA D — Ilustración decorativa         │
│ chofer.png (contain, no interactiva)    │
├─────────────────────────────────────────┤
│ ZONA E — Error (solo si falla validación)│
│ texto rojo centrado                     │
└─────────────────────────────────────────┘
```

### Vista alternativa: búsqueda de dirección

Si el usuario toca recojo/destino/parada, `addressSearchField !== null` y la
pantalla cambia a un **bottom sheet** blanco (`rounded-t-[28px]`) con
`AddressAutocomplete` y el título «Busca tu dirección». No es otra ruta de
navegación: es el mismo archivo, otro estado.

---

## Cada elemento (glosario para diseño)

| # | Nombre en diseño | Código / clase | Descripción |
| --- | --- | --- | --- |
| A1 | **App bar** / top bar | `View` + `HamburgerButton` | Solo menú lateral (drawer); sin logo en esquina |
| A2 | **Menú hamburguesa** | `HamburgerButton` | Abre `SideDrawer` (historial, cuenta, soporte…) |
| B1 | **Screen title** / H1 | `Text` | «¿Dónde necesitas un Chofer para Remplazo?» — `text-2xl font-bold` |
| C1 | **Route card** | `UiCard` | Tarjeta blanca con sombra suave (`CARD_SHADOW` en `ui.tsx`) |
| C2 | **Pickup field** | `addressFieldButton("Punto de recojo", …)` | Fila con label 12px gris + `Pressable` fondo `bg-slate-100 rounded-2xl` |
| C3 | **Use GPS CTA** | `UiButton variant="secondary"` | «Usar mi ubicación actual»; llama geolocalización del dispositivo |
| C4 | **Destination field** | `addressFieldButton("Destino", …)` | Misma estructura que recojo; placeholder «¿A dónde vas?» |
| C5 | **Extra stop row** | `extraDestinations.map` | Parada 2, 3… opcional; botón ✕ para quitar |
| C6 | **Add stop link** | `TouchableOpacity` | «+ Agregar parada»; añade otro `AddressDraft` vacío |
| C7 | **Primary CTA** | `UiButton label="Continuar"` | Deshabilitado hasta que recojo y destino tengan coordenadas (`canContinue`) |
| D1 | **Hero illustration** | `ChauffeurIllustration` → `chofer.png` | Dentro de la card (fondo blanco); ~248px alto, bordes difuminados con SVG |
| E1 | **Error banner** | `Text text-red-600` | Mensaje de validación o error de red |

### Tokens de color (esta pantalla)

| Token | Hex / clase | Uso |
| --- | --- | --- |
| `canvas` | `#F4F6F8` | Fondo de pantalla `bg-canvas` |
| `hercom` | `#0B70FE` | CTA «Continuar» (primario) |
| `hercom-soft` | (tailwind) | Fondo CTA secundario «Usar mi ubicación» |
| `slate-100` | — | Campos de dirección (estado reposo) |
| `slate-900` | — | Título y texto con valor |
| `slate-400` | — | Placeholders vacíos |

---

## Componentes reutilizados

| Componente | Archivo | Rol en esta pantalla |
| --- | --- | --- |
| `UiCard` | `src/components/ui.tsx` | Contenedor blanco de la ruta |
| `UiButton` | `src/components/ui.tsx` | Continuar, usar GPS |
| `HamburgerButton` | `src/components/HamburgerButton.tsx` | Abrir drawer |
| `SideDrawer` | `src/components/SideDrawer.tsx` | Menú lateral (overlay) |
| `AddressAutocomplete` | `src/components/AddressAutocomplete.tsx` | Solo en modo búsqueda (sheet) |
| `HelpFab` | `src/components/HelpFab.tsx` | No visible en compose; sí en paso confirm (mapa) |

---

## Flujo de navegación (cliente)

```text
App.tsx
  └─ Authenticated → HomeScreen
       └─ modo pasajero → ClientDashboard
            ├─ identityComplete !== true → ClientIdentityForm
            ├─ menuSection historial → lista de servicios
            ├─ flowStep "compose"  ← ESTA PANTALLA
            │    └─ addressSearchActive → sheet «Busca tu dirección»
            └─ flowStep "confirm" → mapa + horas/tarifa + solicitar
```

Estados clave en código:

- `flowStep`: `"compose"` | `"confirm"`
- `addressSearchField`: `null` | `"origin"` | `"destination"` | `number` (índice parada)
- `canContinue`: recojo y destino con lat/lng válidos

---

## Assets

| Asset | Ubicación en repo | Uso |
| --- | --- | --- |
| `chofer.png` | [`imagenes/chofer.png`](../imagenes/chofer.png) (origen diseño) | Master / Dribbble |
| `chofer.png` | [`apps/mobile/assets/images/chofer.png`](../apps/mobile/assets/images/chofer.png) | Bundled en la app (`require`) |

---

## Capturas para Dribbble

1. Usuario logueado en **modo pasajero** (no chofer).
2. Identidad completada (`ClientIdentityForm` ya enviado).
3. Pantalla compose sin sheet abierto → screenshot → `04-pedir-servicio.png`.

Ver también: [`mobile-login-y-estructura.md`](mobile-login-y-estructura.md),
[`guia-diseno.md`](guia-diseno.md).
