# Guía de diseño — Hercom Choferes

Documento de referencia visual para ubicar **elementos de interfaz**, **clases CSS /
Tailwind** y **decisiones de marca** en cada vista del proyecto.

---

## Aviso importante: móvil vs web

| Plataforma | Tecnología | ¿Usa HTML? |
| --- | --- | --- |
| **App móvil** (`apps/mobile`) | React Native + **NativeWind** | **No.** Usa `View`, `Text`, `TextInput`, `TouchableOpacity`, `Image`, etc. |
| **Webs** (`web-comercial`, `web-admin`) | React + **Tailwind CSS** | **Sí.** Usa `div`, `form`, `input`, `button`, `h1`, `p`, etc. |

En móvil, las clases Tailwind (`className="bg-hercom"`) se traducen a estilos nativos
via NativeWind. En esta guía, cuando digamos “equivalente HTML”, indicamos qué tag web
sería análogo; en móvil **nunca** uses esos tags.

---

## Sistema de diseño Hercom (institucional)

### Paleta de colores

| Token Tailwind | Hex | Uso |
| --- | --- | --- |
| `hercom` / `brand` (móvil) | `#007AFF` | Primario institucional: login, CTAs, **Modo conductor/cliente**, FAB ayuda, estados activos |
| `hercom-dark` / `brand-dark` | `#0062CC` | Pressed / hover del azul |
| `bg-white` | `#FFFFFF` | Bottom sheet, drawer, chips flotantes, cards |
| `text-slate-900` | `#0F172A` | Títulos sobre blanco |
| `text-slate-500` / `600` | `#64748B` / `#475569` | Texto secundario |
| `text-white` | `#FFFFFF` | Texto sobre azul Hercom |
| `text-red-600` / `700` | `#DC2626` | Errores y emergencia (centros de salud) |
| `bg-slate-100` | `#F1F5F9` | Fondo general / ítem activo del drawer |

Definidos en:

- Móvil: [`apps/mobile/tailwind.config.js`](../apps/mobile/tailwind.config.js)
- Móvil (código): [`apps/mobile/src/constants/theme.ts`](../apps/mobile/src/constants/theme.ts)

> **Regla:** no usar verde lima / acentos de otras marcas (inDrive) para CTAs de Hercom.
> El switch de modo del menú lateral usa **`bg-hercom` + texto blanco**.

### Tipografía (móvil — jul 2026)

| Rol | Fuente | Uso |
| --- | --- | --- |
| Familia base | **Poppins** (`Poppins_400Regular`) | Default en `Text` / `TextInput` vía `App.tsx` |
| Medium / SemiBold / Bold | `Poppins_500` / `_600` / `_700` | Títulos, botones, labels |

Carga: `@expo-google-fonts/poppins` + `expo-font` en `apps/mobile/App.tsx`.

| Rol UI | Clases típicas |
| --- | --- |
| Título bottom sheet | `text-lg font-bold text-slate-900` |
| Subtítulo / helper | `text-sm text-slate-500` |
| Label de campo | `text-xs font-semibold text-slate-600` |
| CTA primario | `text-base font-bold text-white` sobre `bg-hercom` |
| Ítem drawer | `text-[15px] font-medium text-slate-800` |

**Web** sigue con Inter / Plus Jakarta según [`TIPOGRAFIA.md`](./TIPOGRAFIA.md) (admin/comercial).

### Home móvil pasajero (rediseño jul 2026)

Patrón **mapa + bottom sheet + FABs** (inspiración inDrive/Yango, marca Hercom):

| Elemento | Descripción |
| --- | --- |
| Fondo | `MapView` a pantalla completa |
| FAB izquierdo | Menú ☰ (círculo blanco) → `SideDrawer` |
| Chip superior | «De dónde» + dirección de recojo |
| FAB derecho | Ayuda `?` → soporte / 105 / salud |
| Bottom sheet | `rounded-t-[28px] bg-white` · título *«¿Dónde necesitas un chofer de reemplazo?»* |
| Switch de modo | Drawer inferior · **azul `#007AFF`**, texto blanco · sin copy meta de “mismo celular” |

Copy a evitar (suena genérico / IA): hints tipo “Sugerencias en Perú…”, banners de “también conduces…”, textos explicativos de región.

Región (dept/prov/dist) se infiere en silencio desde GPS o Places; **no se muestra picker** en la UI de solicitud.

### Espaciado y layout

| Patrón | Clases | Significado |
| --- | --- | --- |
| Pantalla completa | `flex-1` | Ocupa todo el alto disponible |
| Centrado vertical | `justify-center` + `items-center` | Contenido centrado |
| Padding horizontal | `px-6` | Margen lateral estándar móvil |
| Separación de secciones | `mb-10`, `mb-5`, `mb-3` | Ritmo vertical |
| Tarjeta interna | `p-6` | Padding dentro de tarjetas blancas |

### Bordes y tarjetas (estilo Yango + Hercom)

| Elemento | Clases | Descripción |
| --- | --- | --- |
| Tarjeta flotante principal | `rounded-3xl bg-white p-6 shadow-lg` | Esquinas muy redondeadas, emula contenedor del logo |
| Tarjeta secundaria | `rounded-2xl` | Inputs, botones, tarjetas menores |
| Input | `rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5` | Campo legible, fondo gris muy claro |
| Bottom sheet | `rounded-t-[28px] bg-white` + sombra superior | Solicitud de viaje |

> **Nota:** Las tres apps usan la identidad Hercom unificada (`#007AFF`, logo en
> `public/` o `assets/images/`, tarjetas `rounded-3xl`).
### Botones

| Tipo | Clases móvil | Clases web (referencia) |
| --- | --- | --- |
| **Primario Hercom** | `rounded-2xl bg-hercom py-4 active:bg-hercom-dark` | `rounded-lg bg-brand py-2 font-semibold text-white hover:bg-brand-dark` |
| **Secundario / link** | `Text` con `text-brand font-semibold` | `text-brand hover:underline` |
| **Desconectar** (pendiente) | `bg-slate-700 text-white` | igual concepto |
| **Deshabilitado** | `disabled` + opacidad nativa | `disabled:opacity-60` |

---

## Imágenes y assets

| App | Ruta | Archivo actual |
| --- | --- | --- |
| Móvil | `apps/mobile/assets/images/` | `hercom-logo.png` |
| Web comercial | `apps/web-comercial/public/` | `hercom-logo.png` |
| Web admin | `apps/web-admin/public/` | `hercom-logo.png` |

Componente que carga el logo móvil:
[`apps/mobile/src/components/HercomLogo.tsx`](../apps/mobile/src/components/HercomLogo.tsx)

---

## Vista 1 — Login Hercom (app móvil) ⭐ Primera pantalla

### Archivo

```
apps/mobile/src/screens/SignInScreen.tsx
```

Enrutamiento: [`apps/mobile/App.tsx`](../apps/mobile/App.tsx) muestra esta pantalla
cuando el usuario **no está autenticado** (`<Unauthenticated>`).

### ¿Se implementaron las directrices Hercom + Yango?

| Directriz | ¿Implementado? | Detalle |
| --- | --- | --- |
| Azul eléctrico `#007AFF` de fondo | ✅ Sí | `bg-hercom` en contenedor raíz |
| HERCOM + “Choferes para reemplazo” centrados | ✅ Sí | `Text` blanco centrado bajo logo |
| Logo institucional | ✅ Sí | `HercomLogo` → `assets/images/hercom-logo.png` |
| Tarjeta blanca flotante `rounded-3xl` | ✅ Sí | Contenedor del formulario |
| Botón azul, texto blanco, mayúsculas | ✅ Sí | “ENTRAR” con `uppercase font-bold` |
| Texto oscuro sobre tarjeta blanca | ✅ Sí | `text-slate-900` / `text-slate-600` |
| Mapa de fondo pantalla completa | ❌ No | Previsto para **DriverDashboard**, no login |
| Tarjeta superior de ganancias | ❌ No | Previsto en dashboard post-login |
| Botón “CONECTARSE” jornada | ❌ No | Está en `AvailabilityToggle.tsx` (otra pantalla) |

**Conclusión:** el login móvil **sí aplica la identidad Hercom** acordada para esa
pantalla. Lo estilo Yango completo (mapa + tarjetas KPI) corresponde al **panel del
chofer**, aún no rediseñado.

### Árbol de elementos (móvil — no HTML)

```
View (pantalla, bg-hercom)
└── KeyboardAvoidingView
    └── ScrollView
        ├── View (bloque marca, items-center)
        │   ├── HercomLogo → Image
        │   ├── Text "HERCOM"
        │   └── Text "Choferes para reemplazo"
        └── View (tarjeta, rounded-3xl bg-white)
            ├── Text "Iniciar sesión"
            ├── Text descripción
            ├── TextInput email
            ├── TextInput password
            ├── Text error (condicional)
            └── TouchableOpacity botón
                └── Text "ENTRAR"
```

### Equivalencia web (solo referencia conceptual)

| React Native | Análogo HTML | Rol |
| --- | --- | --- |
| `View` | `div` | Contenedor / layout |
| `Text` | `p`, `span`, `h1` | Texto |
| `TextInput` | `input type="email/password"` | Campos de formulario |
| `TouchableOpacity` | `button` | Acción Entrar |
| `ScrollView` | `div` con overflow scroll | Scroll en pantallas pequeñas |
| `Image` | `img` | Logo Hercom |

### Clases CSS / Tailwind principales en login

| Elemento | className |
| --- | --- |
| Fondo pantalla | `flex-1 bg-hercom` |
| Título HERCOM | `mt-6 text-center text-3xl font-bold tracking-widest text-white` |
| Subtítulo | `mt-2 text-center text-base font-semibold uppercase tracking-wide text-white/90` |
| Tarjeta formulario | `rounded-3xl bg-white p-6 shadow-lg` |
| Input | `rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base text-slate-900` |
| Botón | `rounded-2xl bg-hercom py-4 active:bg-hercom-dark` |
| Texto botón | `text-center text-base font-bold uppercase tracking-wide text-white` |
| Error | `text-sm text-red-600` |

---

## Vista 2 — Panel del chofer (app móvil)

**Archivo:** `apps/mobile/src/screens/DriverDashboard.tsx`

| Elemento RN | Clases actuales | Pendiente Hercom |
| --- | --- | --- |
| `View` contenedor | `flex-1 px-4 pt-4` | Fondo mapa + overlay |
| `Text` título | `text-2xl font-bold text-slate-900` | Sobre tarjeta blanca flotante |
| `AvailabilityToggle` | ver abajo | Botón CONECTARSE azul grande |
| `FlatList` viajes | — | Tarjetas `rounded-3xl bg-white` |
| `ServiceCard` | `rounded-2xl bg-white p-4 shadow-sm` | Ajustar a `rounded-3xl` |

**AvailabilityToggle** (`src/components/AvailabilityToggle.tsx`):

| Elemento | Clases |
| --- | --- |
| Tarjeta estado | `rounded-2xl bg-white p-4 shadow-sm` |
| Badge disponible | `rounded-full px-3 py-1 bg-green-100 text-green-700` |
| Botón acción | `rounded-xl bg-brand py-3` → migrar a `bg-hercom` |

---

## Vista 3 — Login / registro (web comercial)

**Archivo:** `apps/web-comercial/src/components/SignInForm.tsx`

### Elementos HTML

| Tag | Clases Tailwind | Función |
| --- | --- | --- |
| `div` | `mx-auto mt-16 max-w-sm rounded-2xl bg-white p-8 shadow-sm` | Tarjeta centrada |
| `h1` | `text-2xl font-bold text-slate-900` | Título |
| `p` | `text-sm text-slate-500` | Subtítulo |
| `form` | `space-y-4` | Formulario login/registro |
| `input` | `w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand` | Campos |
| `button` submit | `w-full rounded-lg bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60` | Entrar / Registrarme |
| `button` toggle | `mt-4 text-sm text-brand hover:underline` | Cambiar login ↔ registro |
| `p` error | `text-sm text-red-600` | Mensaje de error |

> Pendiente: aplicar identidad Hercom en dashboard autenticado (header ya Hercom).

---

## Vista 4 — Dashboard cliente (web comercial)

**Archivo contenedor:** `apps/web-comercial/src/App.tsx`

### Header (`header`)

| Elemento | Clases |
| --- | --- |
| `header` | `flex justify-between border-b border-slate-200 bg-white px-6 py-4` |
| `h1` | `text-lg font-bold text-brand` |
| `button` salir | `text-sm text-slate-500 hover:text-slate-800` |

### RequestServiceForm

| Elemento | Clases |
| --- | --- |
| `section` | `rounded-2xl bg-white p-6 shadow-sm` |
| `h2` | `text-lg font-semibold text-slate-900` |
| `input` / `textarea` | `w-full rounded-lg border border-slate-300 px-3 py-2 text-sm` |
| `button` | `rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark` |

### MyServices

| Elemento | Clases |
| --- | --- |
| `li` tarjeta | `rounded-xl bg-white p-4 shadow-sm` |
| Badge estado | `rounded-full px-2 py-0.5 text-xs font-semibold` + color por estado |
| `pending` | `bg-amber-100 text-amber-700` |
| `assigned` | `bg-blue-100 text-blue-700` |
| `en_route` | `bg-indigo-100 text-indigo-700` |
| `finished` | `bg-green-100 text-green-700` |
| `cancelled` | `bg-slate-200 text-slate-600` |

---

## Vista 5 — Login admin (web admin)

**Archivo:** `apps/web-admin/src/components/SignInForm.tsx`

Misma estructura HTML que web comercial, con copy “Panel administrativo”.
Identidad Hercom aplicada (login azul + logo + tarjeta blanca).

---

## Vista 6 — Dashboard admin (web admin)

**Archivo:** `apps/web-admin/src/App.tsx` + componentes.

### ServicesBoard — tabla HTML

| Elemento | Clases |
| --- | --- |
| `section` | `rounded-2xl bg-white p-6 shadow-sm` |
| `table` | `w-full text-left text-sm` |
| `thead tr` | `border-b border-slate-200 text-slate-500` |
| `tbody tr` | `border-b border-slate-100` |
| `select` chofer | `rounded border border-slate-300 px-2 py-1 text-xs` |
| `button` Asignar | `rounded bg-brand px-3 py-1 text-xs font-semibold text-white` |

### PaymentsPanel / PayoutsPanel

| Elemento | Clases |
| --- | --- |
| `section` | `rounded-2xl bg-white p-6 shadow-sm` |
| `li` fila | `flex justify-between rounded-xl border border-slate-100 p-3` |
| `button` acción | `rounded bg-brand px-3 py-1 text-xs font-semibold text-white` |

---

## Estados visuales de servicio (compartidos)

| Estado | Etiqueta UI | Color badge |
| --- | --- | --- |
| `pending` | Pendiente | ámbar |
| `assigned` | Asignado | azul |
| `en_route` | En camino | índigo |
| `finished` | Finalizado | verde |
| `cancelled` | Cancelado | gris |

---

## Checklist para nuevas pantallas Hercom

Al crear o retocar una vista:

1. Fondo azul `bg-hercom` o mapa debajo de tarjetas blancas.
2. Tarjetas con `rounded-3xl bg-white shadow-lg`.
3. Títulos `font-bold text-slate-900`; montos `font-bold`.
4. Un solo botón primario azul por zona de acción; mayúsculas si es CTA principal.
5. Errores en `text-red-600`; acciones peligrosas en `bg-slate-700` o rojo sutil.
6. Logo desde `assets/images/` (móvil) o `public/` (web).
7. Móvil: **nunca** `div`/`button` HTML — solo componentes React Native.

---

## Documentos relacionados

- [flujo-vistas.md](./flujo-vistas.md) — qué pantalla existe y flujo de negocio
- [README.md](../README.md) — mapa de archivos del repo
- [PLAN.md](../PLAN.md) — arquitectura técnica
