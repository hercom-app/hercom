# Tipografía Hercom

Guía de fuentes para **web admin**, **web comercial**, **app móvil** y materiales de marca.

Solo fuentes **gratuitas y libres** (SIL Open Font License).

---

## Estado actual por app

| App | Títulos | Cuerpo / UI | Carga |
| --- | --- | --- | --- |
| **Web admin** | Plus Jakarta Sans | Inter | Google Fonts en `index.html` |
| **Web comercial** | *(sin definir)* | Fuente del sistema | Sin Google Fonts aún |
| **App móvil** | **Inter** 700 | **Inter** 400–600 | `@expo-google-fonts/inter` en `App.tsx` — escala grande para adultos mayores |

Clases Tailwind web: `font-display` (títulos) · `font-sans` (resto).

En móvil los tokens viven en `apps/mobile/src/constants/theme.ts` (`POPPINS`, `ARVO`, `DISPLAY` — nombres históricos; ver abajo).

---

## App móvil — Inter sola (activo)

| Token en código | Fuente | Uso |
| --- | --- | --- |
| `INTER` / `POPPINS` | Inter 400–700 | Todo el UI (alias legacy = Inter) |
| `DISPLAY` / `ARVO` / `MONO` | Inter | Títulos y montos (misma familia) |

### Escala (`TYPE` en `theme.ts`) — legibilidad adultos mayores

| Token | px | Uso |
| --- | --- | --- |
| `caption` | 17 | Labels, badges (mínimo) |
| `body` | 19 | Texto general |
| `bodyLg` | 21 | Inputs |
| `button` | 20 | CTAs |
| `title` | 26 | Títulos de sección |
| `headline` | 28 | Placa, encabezados sheet |
| `amount` | 34 | Tarifas destacadas |

---

## Alternativas para móvil (elegir una)

Todas son gratuitas (Google Fonts + Expo) y funcionan en Android/iOS.

### Opción A — **Plus Jakarta Sans + Inter** (recomendada)

| Rol | Fuente | Sensación |
| --- | --- | --- |
| Títulos | Plus Jakarta Sans 600–700 | Moderna, marca, alineada al **web admin** |
| Cuerpo | Inter 400–600 | Muy legible en formularios, precios, tablas |

**Pros:** una sola identidad Hercom en admin + móvil; profesional; probada en producto.  
**Contras:** menos “redonda” que apps de consumo ultra casual.

**Paquetes Expo:** `@expo-google-fonts/plus-jakarta-sans`, `@expo-google-fonts/inter`

---

### Opción B — **Inter sola** (una familia)

Todo UI con Inter 400 / 500 / 600 / 700.

**Pros:** máxima simplicidad; muy parecida a Uber/Lyft (sans neutra); menos peso en la app.  
**Contras:** menos personalidad de marca en títulos.

**Paquete Expo:** `@expo-google-fonts/inter`

---

### Opción C — **DM Sans + Inter**

| Rol | Fuente |
| --- | --- |
| Títulos | DM Sans 600–700 |
| Cuerpo | Inter |

**Pros:** DM Sans es geométrica y “app de movilidad”; amigable sin ser infantil.  
**Contras:** admin seguiría con Plus Jakarta hasta unificar web.

**Paquetes Expo:** `@expo-google-fonts/dm-sans`, `@expo-google-fonts/inter`

---

### Opción D — **SF Pro / Roboto (sistema)**

Sin embeber fuentes: `System` en React Native.

**Pros:** nativo en cada OS; carga instantánea; familiar para el usuario.  
**Contras:** se ve distinto en iPhone vs Android; no coincide con web admin.

---

### Opción E — **Poppins sola**

Una sans redondeada, popular en LATAM.

**Pros:** cercana, legible, menos “seria” que Arvo.  
**Contras:** muy usada (menos distintiva); no alinea con admin.

**Paquete Expo:** `@expo-google-fonts/poppins`

---

## Comparación rápida (para decidir con el dueño)

| Criterio | A: Jakarta+Inter | B: Inter | C: DM+Inter | D: Sistema | E: Poppins |
| --- | --- | --- | --- | --- | --- |
| Igual que web admin | ✅ | Parcial | Parcial | ❌ | ❌ |
| Sensación “app transporte” | ✅ | ✅✅ | ✅✅ | ✅ | ✅ |
| Evita serif / tono militar | ✅ | ✅ | ✅ | ✅ | ✅ |
| Marca Hercom reconocible | ✅✅ | ✅ | ✅ | ❌ | ✅ |

**Recomendación del equipo:** **Opción A** si la prioridad es marca unificada; **Opción B o C** si la prioridad es look tipo Uber/inDrive.

---

## Web — pareja oficial (sin cambios)

| Rol | Fuente |
| --- | --- |
| **Títulos** | [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) |
| **Cuerpo** | [Inter](https://fonts.google.com/specimen/Inter) |

### Web comercial

Hoy: fuente del sistema en `index.css`. Cuando se rediseñe, usar la misma pareja que admin.

---

## Implementación móvil (cuando elijan opción)

1. Instalar paquetes `@expo-google-fonts/...` correspondientes.
2. Actualizar `useFonts` en `apps/mobile/App.tsx`.
3. Actualizar `theme.ts`: mapear `POPPINS` / `DISPLAY` a los nombres reales (o renombrar tokens en un PR aparte).
4. Probar login, bottom sheet, montos y drawer en Expo Go.

---

## Checklist

- [x] Web admin: Plus Jakarta Sans + Inter
- [x] **Móvil:** Inter sola + escala grande (`TYPE` en `theme.ts`)
- [x] `App.tsx` + `theme.ts` + `tailwind.config.js` actualizados
- [ ] Web comercial: unificar cuando haya rediseño

---

## Enlaces

| Fuente | URL |
| --- | --- |
| Inter | https://fonts.google.com/specimen/Inter |
| Plus Jakarta Sans | https://fonts.google.com/specimen/Plus+Jakarta+Sans |
| DM Sans | https://fonts.google.com/specimen/DM+Sans |
| Poppins | https://fonts.google.com/specimen/Poppins |
| Work Sans | https://fonts.google.com/specimen/Work+Sans |
| Arvo | https://fonts.google.com/specimen/Arvo |

Ver también: [`guia-diseno.md`](guia-diseno.md) · [`7 PROPUESTAS LOGIN WEB.md`](7%20PROPUESTAS%20LOGIN%20WEB.md)
