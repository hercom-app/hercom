# Tipografía Hercom

Guía de fuentes para **web admin**, **web comercial**, **app móvil** y materiales de marca.

Solo fuentes **gratuitas y libres** (SIL Open Font License).  
Descartado: ITC Avant Garde, Salesforce Sans, Slack-Lato.

---

## Estado actual por app

| App | Títulos | Cuerpo / UI | Carga de fuentes |
| --- | --- | --- | --- |
| **Web admin** | Plus Jakarta Sans | Inter | Google Fonts en `index.html` |
| **Web comercial** | *(sin definir)* | **Fuente del sistema** | Sin Google Fonts — sin cambios de diseño aún |
| **App móvil** | Fuente del sistema | Fuente del sistema | Sin embeber aún |

Clases Tailwind: `font-display` (títulos) · `font-sans` (resto, default del body).

---

## Web comercial — sin cambios (por ahora)

La web comercial **sigue igual que antes**: fuente del sistema, login original.  
No hay decisiones de diseño ni tipografía aplicadas todavía.

```css
/* apps/web-comercial/src/index.css */
font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
```

Sin Google Fonts en `index.html`. Se ve distinto según dispositivo (Segoe UI, San Francisco, Roboto) y distinto al admin.

Cuando se rediseñe la comercial, usar la pareja **Plus Jakarta Sans + Inter** (sección siguiente).

---

## Web comercial — referencia histórica (pila system-ui)

```css
font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
```

Definido en `apps/web-comercial/src/index.css`. **No había Google Fonts** en `index.html`.

### Qué implicaba eso

| Dispositivo | Fuente que veía el usuario |
| --- | --- |
| **Windows** | Segoe UI |
| **macOS / iOS** | San Francisco (vía `-apple-system`) |
| **Android** | Roboto |
| **Linux** | system-ui del distro |

**Consecuencias:**

- La web comercial se veía **distinta en cada dispositivo**.
- No coincidía con el **web admin** (que ya usaba Inter + Plus Jakarta Sans).
- Títulos y formularios heredaban la sans-serif del OS, sin identidad Hercom.

---

## Pareja oficial Hercom (100 % libre)

Recomendación para **cliente + chofer + admin + móvil**:

| Rol | Fuente | Licencia | Uso |
| --- | --- | --- | --- |
| **Títulos** | [**Plus Jakarta Sans**](https://fonts.google.com/specimen/Plus+Jakarta+Sans) | SIL OFL | Login, encabezados de sección, KPIs |
| **Cuerpo** | [**Inter**](https://fonts.google.com/specimen/Inter) | SIL OFL | Tablas, formularios, labels, botones, párrafos |

**Por qué esta pareja:** Plus Jakarta Sans aporta identidad en logins y títulos; Inter es muy legible en UI densa (tablas del admin, precios, filtros). Ambas se pueden embeber en **app móvil** sin pagar licencia.

### Alternativas libres (otra sensación)

| Si buscan… | Títulos | Cuerpo |
| --- | --- | --- |
| Máxima simplicidad (una sola fuente) | — | **Inter** sola |
| Más “app de consumo” | **DM Sans** | Inter |
| Tono más suave | **Nunito Sans** | Inter |
| Estilo Slack sin Slack-Lato | Plus Jakarta Sans | **Lato** |
| Máxima neutralidad | Plus Jakarta Sans | **Source Sans 3** |

Para Hercom, **Plus Jakarta Sans + Inter** es la opción más equilibrada.

---

## Cuándo usar cada una

### `font-display` — Plus Jakarta Sans

- Título login (*Iniciar sesión*, *Acceso administrador*)
- Títulos de sección en admin
- Montos destacados

### `font-sans` — Inter

- Labels flotantes, inputs, botones
- Tablas, filtros, mensajes de error
- Texto de la app autenticada

**Regla:** no uses `font-display` en celdas de tabla ni párrafos largos.

---

## Pesos recomendados

| Fuente | Pesos | Uso |
| --- | --- | --- |
| Plus Jakarta Sans | 600, 700 | Títulos |
| Inter | 400, 500, 600 | Cuerpo, labels, botones |

---

## Escala tipográfica (web)

| Elemento | Clase sugerida |
| --- | --- |
| Título login | `font-display text-2xl font-semibold tracking-tight` |
| Título sección (admin) | `font-display text-2xl sm:text-3xl font-bold tracking-tight` |
| Label flotante (activo) | `text-xs font-medium text-hercom` |
| Input | `text-sm` |
| Botón | `text-sm font-semibold` |

---

## Login web admin — UI de campos

| Campo visible | `name` en formulario | Notas |
| --- | --- | --- |
| **Usuario** | `email` | Label “Usuario”; login sigue siendo por correo en backend |
| **Contraseña** | `password` | Label flotante + icono ojo (Lucide) |

Patrón **label flotante:** `FloatingField.tsx` (placeholder `" "` + clases `peer`).

Layout login admin: **propuesta 2** — logo grande encima del formulario; panel azul con logo en desktop (`lg+`). Ver [`7 PROPUESTAS LOGIN WEB.md`](7%20PROPUESTAS%20LOGIN%20WEB.md).

---

## Login web comercial

**Pendiente.** Sin indicaciones de diseño aún. No modificar hasta nueva decisión.

---

## Implementación web

### Web admin

| Archivo | Contenido |
| --- | --- |
| `apps/web-admin/index.html` | Inter + Plus Jakarta Sans |
| `apps/web-admin/tailwind.config.js` | `font-display`, `font-sans` |
| `apps/web-admin/src/components/FloatingField.tsx` | Labels flotantes + ojo |
| `apps/web-admin/src/components/SignInForm.tsx` | Login propuesta 2 |

### Web comercial

Sin cambios planificados. Estado actual: `system-ui` en `index.css`, login heredado.

---

## App móvil (pendiente)

Hoy: **fuente del sistema** (San Francisco / Roboto).

Para unificar con web, embeber en `apps/mobile/assets/fonts/`:

- `Inter-Regular.ttf`, `Inter-SemiBold.ttf`, `Inter-Bold.ttf`
- `PlusJakartaSans-SemiBold.ttf`, `PlusJakartaSans-Bold.ttf`

Herramienta: [expo-font](https://docs.expo.dev/develop/user-interface/fonts/) + NativeWind `fontFamily`.

---

## Checklist

- [x] Descartar Avant Garde y Slack-Lato
- [x] Pareja oficial: Plus Jakarta Sans + Inter
- [x] Web admin configurada
- [x] Web admin: fuentes + login propuesta 2 + labels flotantes
- [ ] Web comercial: **sin tocar** hasta nueva indicación
- [ ] App móvil: embeber `.ttf`

---

## Enlaces

| Fuente | URL |
| --- | --- |
| Inter | https://fonts.google.com/specimen/Inter |
| Plus Jakarta Sans | https://fonts.google.com/specimen/Plus+Jakarta+Sans |
| DM Sans | https://fonts.google.com/specimen/DM+Sans |
| Lato | https://fonts.google.com/specimen/Lato |
| Source Sans 3 | https://fonts.google.com/specimen/Source+Sans+3 |

Ver también: [`7 PROPUESTAS LOGIN WEB.md`](7%20PROPUESTAS%20LOGIN%20WEB.md) · [`guia-diseno.md`](guia-diseno.md)
