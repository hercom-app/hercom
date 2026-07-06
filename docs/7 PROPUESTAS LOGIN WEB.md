# Propuestas de diseño — pantallas de login (web)

Documento para **elegir** el estilo del login antes de implementarlo.

> **Estado:** **Web admin** — propuesta **2** implementada (ver checklist abajo).  
> **Web comercial** — sin cambios; pendiente hasta que indiques diseño.  
> Referencia de marca general: [`guia-diseno.md`](guia-diseno.md)

---

## Qué no nos convence hoy

### Web admin (login actual)

| Elemento | Problema |
| --- | --- |
| Bloque lateral: *“Panel de operaciones”* … *“Solo personal autorizado”* | Suena genérico / “hecho por IA”, demasiado texto de relleno |
| *“Ingresa con tu cuenta corporativa Hercom”* | Misma sensación; no aporta confianza real |
| Botón **“Ver”** en contraseña | Debería ser icono de ojo, no texto |

### Web comercial (login actual)

| Elemento | Problema |
| --- | --- |
| Fondo azul + tarjeta blanca | Funcional pero muy básico, poco diferenciado |
| Poco contraste visual entre marca y formulario | Todo compite en poco espacio |
| Misma familia de problemas de copy si se agregan frases largas | Evitar párrafos explicativos |

---

## Reglas de copy (texto humano, corto)

**Evitar:**

- “Panel de operaciones”, “solución integral”, “experiencia”, “plataforma”
- “Cuenta corporativa”, “personal autorizado”, “acceso restringido”
- Párrafos de más de una línea en el login

**Preferir:**

- Un solo título claro
- Cero subtítulo, o una línea concreta
- Labels en campos (`Correo`, `Contraseña`), no placeholders que repitan todo

### Textos sugeridos — **Admin**

| Ubicación | Opción A (mínima) | Opción B (con contexto) |
| --- | --- | --- |
| Título del formulario | **Acceso administrador** | **Hercom · Admin** |
| Subtítulo | *(ninguno)* | *(ninguno)* |
| Botón | **Entrar** | **Iniciar sesión** |
| Error | **Correo o contraseña incorrectos** | igual |

Si hay columna lateral, **solo logo** (sin texto), o como mucho:

> **Hercom**  
> Admin

### Textos sugeridos — **Comercial (clientes)**

| Ubicación | Opción A | Opción B |
| --- | --- | --- |
| Título | **Iniciar sesión** | **Entrar a Hercom** |
| Subtítulo | *(ninguno)* | **Pide tu chofer de reemplazo** |
| Registro | **Crear cuenta** | **Registrarme** |
| Botón | **Entrar** | **Continuar** |

---

## Icono ojo (contraseña) — [Icônes](https://icones.js.org/)

En [icones.js.org](https://icones.js.org/) busca la colección **Lucide** (limpia, profesional, muy usada en dashboards):

| Uso | Icono | Enlace directo |
| --- | --- | --- |
| Mostrar contraseña | `lucide:eye` | [icones.js.org → lucide eye](https://icones.js.org/collection/lucide?s=eye) |
| Ocultar contraseña | `lucide:eye-off` | [icones.js.org → lucide eye-off](https://icones.js.org/collection/lucide?s=eye-off) |

Alternativas si prefieres otro estilo:

| Colección | Estilo | Enlace |
| --- | --- | --- |
| **Heroicons** | Más redondeado (estilo Tailwind UI) | [heroicons outline eye](https://icones.js.org/collection/heroicons?s=eye) |
| **Phosphor** | Intermedio, muy legible | [ph eye](https://icones.js.org/collection/ph?s=eye) |

**Recomendación:** `lucide:eye` / `lucide:eye-off` — encaja con tipografía Plus Jakarta Sans y tablas del admin.

Implementación futura (cuando elijas): SVG inline o `@iconify/react` (sin cambiar el resto del panel).

---

## Cinco propuestas de layout (elige una dirección)

Cada propuesta indica **admin** y **comercial**. Misma lógica visual en ambas webs, con copy distinto.

---

### Propuesta 1 — **Tarjeta centrada clásica** (recomendada para empezar)

**Descripción:** Fondo azul Hercom (`#007AFF`) o gris muy claro; logo arriba; una sola tarjeta blanca con el formulario. Sin columna lateral, sin párrafos.

```
┌─────────────────────────────┐
│         [logo Hercom]       │
│   ┌─────────────────────┐   │
│   │ Acceso administrador│   │
│   │ Correo              │   │
│   │ Contraseña      👁  │   │
│   │ [ Entrar ]          │   │
│   └─────────────────────┘   │
└─────────────────────────────┘
```

**Por qué funciona:** Sobrio, reconocible, poco mantenimiento, responsive natural.

**Referencias visuales:**

- [Linear — sign in](https://linear.app/login) — minimalismo, una tarjeta, poco texto
- [Stripe Dashboard login](https://dashboard.stripe.com/login) — confianza empresarial, campos claros
- [Vercel login](https://vercel.com/login) — blanco sobre fondo neutro

**Comercial:** Igual + botón Google debajo del título, separador “o con correo”.

**Voto del doc:** ⭐ Mejor equilibrio **empresa + simplicidad** para Hercom.

---

### Propuesta 2 — **Split 40/60 solo imagen de marca**

**Descripción:** Izquierda: logo grande sobre fondo azul o foto desaturada (tráfico Lima / volante). Derecha: formulario blanco. **Sin texto marketing** en la izquierda.

**Referencias:**

- [Notion login](https://www.notion.so/login) — split limpio, poco copy
- [Slack sign in](https://slack.com/signin) — marca a un lado, formulario al otro

**Admin:** Izquierda solo logo (o logo + “Admin” en una línea).  
**Comercial:** Izquierda logo + tagline corto opcional: *Chofer para reemplazo*.

**Riesgo:** En móvil hay que apilar bien; la foto debe ser propia (no stock genérico).

---

### Propuesta 3 — **Fondo blanco total (SaaS moderno)**

**Descripción:** Toda la pantalla blanca o gris `#F8FAFC`; logo pequeño arriba a la izquierda; formulario centrado con borde sutil; acento azul solo en botón y focus.

**Referencias:**

- [GitHub login](https://github.com/login) — blanco, tipografía fuerte, cero relleno
- [Figma login](https://www.figma.com/login) — aire, labels claros

**Sensación:** Muy “producto tech”, menos “app de transporte peruana”. Útil si quieren parecerse a un SaaS B2B.

---

### Propuesta 4 — **Barra superior + formulario (portal interno)**

**Descripción:** Header blanco con logo Hercom; cuerpo gris claro; formulario en tarjeta pequeña al centro. Sin split, sin gradientes oscuros.

**Referencias:**

- Portales bancarios empresariales (estructura simple: cabecera institucional + caja de login)
- [Cloudflare Zero Trust login](https://one.dash.cloudflare.com/) — header + card

**Sensación:** Muy **admin / intranet**. Ideal sobre todo para **admin**; comercial puede sentirse frío.

---

### Propuesta 5 — **Azul completo + tarjeta flotante (evolución del comercial actual)**

**Descripción:** Mejorar lo que ya tienen en web comercial: más padding, logo más grande, tarjeta con sombra suave, tipografía Plus Jakarta Sans, icono ojo, **menos texto**.

**Referencias:**

- Apps de movilidad peruanas (estructura familiar para usuarios locales)
- [Uber web login](https://auth.uber.com/) — marca dominante, formulario compacto

**Sensación:** Continuidad con lo que el usuario de comercial ya conoce; cambio incremental.

---

## Tabla comparativa rápida

| # | Nombre | Empresarial | Simple | Responsive | Mejor para |
| --- | --- | --- | --- | --- | --- |
| 1 | Tarjeta centrada | ★★★★ | ★★★★★ | ★★★★★ | **Admin + comercial** |
| 2 | Split imagen | ★★★★ | ★★★ | ★★★ | Marca fuerte |
| 3 | Blanco SaaS | ★★★★★ | ★★★★ | ★★★★★ | Tech / B2B |
| 4 | Header + card | ★★★★★ | ★★★★ | ★★★★ | **Solo admin** |
| 5 | Azul + tarjeta | ★★★ | ★★★★★ | ★★★★★ | **Solo comercial** |

---

## Recomendación del equipo (documento)

| App | Propuesta sugerida | Motivo |
| --- | --- | --- |
| **Web admin** | **1** (tarjeta centrada) o **4** (header + card) | Quita el bloque “IA”; se siente portal serio |
| **Web comercial** | **1** o **5** (evolución del actual) | Familiar para clientes; fácil de pulir |

**Unificar:** Misma tipografía (Plus Jakarta Sans), mismos inputs, mismo icono ojo, distinto título y color de fondo opcional (admin gris/blanco, comercial azul Hercom).

---

## Checklist cuando elijas

**Decisión login admin:** **Propuesta 2** — logo encima del formulario; panel azul en desktop; campo **Usuario**; labels flotantes; icono ojo. Tipografía: [`TIPOGRAFIA.md`](TIPOGRAFIA.md).

**Web comercial:** sin cambios de login (pendiente).

- [x] Propuesta admin: **2**
- [ ] Propuesta comercial: *(pendiente — no indicada aún)*
- [x] Copy admin: **Opción A (mínima)**
- [x] Icono: **lucide** (`eye` / `eye-off`)
- [ ] ¿Foto en split? **no** (no aplica a propuesta 4)

---

## Links útiles de inspiración (más ejemplos)

| Recurso | Para qué |
| --- | --- |
| [Icônes](https://icones.js.org/) | Iconos SVG (ojo, etc.) |
| [Mobbin — Sign up / Login](https://mobbin.com/browse/ios/apps) | Patrones reales de apps (filtro Login) |
| [Dribbble — login dashboard](https://dribbble.com/search/login-dashboard) | Ideas visuales (filtrar lo sobrio) |
| [Tailwind UI — Sign-in](https://tailwindui.com/components/application-ui/forms/sign-in) | Estructuras HTML probadas (referencia) |
| [Refero — Sign In](https://refero.design/) | Capturas de productos reales |

---

## Próximo paso

1. **Admin:** login listo (propuesta 2). Ajustes finos solo si los pides.
2. **Comercial:** cuando quieras, elige propuesta y copy en el checklist; hasta entonces no se toca.
3. Icono ojo en admin: Lucide vía [icones.js.org](https://icones.js.org/collection/lucide?s=eye).

Ejemplo para comercial más adelante: *“Comercial propuesta 5 + lucide eye + copy mínimo”*.
