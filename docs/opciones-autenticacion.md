# Opciones de autenticación — Hercom + Convex

Resumen de **qué soporta Convex Auth nativamente** y **con qué servicios** puedes
añadir SMS o WhatsApp si lo necesitas después.

---

## Estado actual del proyecto

| App | Métodos disponibles |
| --- | --- |
| **App móvil (chofer)** | **Solo Google** |
| Web comercial | Google + email/contraseña |
| Web admin | Google + email/contraseña |
| Backend | Google + Password (configurado en `auth.ts`) |

El Gmail / email del usuario se guarda en **`users.email`**.  
El teléfono (si lo usas después) iría en **`users.phone`**.

---

## Lo que Convex Auth trae listo

| Método | ¿Incluido? | Notas |
| --- | --- | --- |
| **Google OAuth** | Sí | Ya configurado (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`) |
| **GitHub, Apple, etc.** | Sí | Mismo patrón OAuth que Google |
| **Email + contraseña** | Sí | Provider `Password` (web + seed demo) |
| **OTP por email** | Sí | Código de 6–8 dígitos vía **Resend**, SendGrid, etc. |
| **Magic link (email)** | Sí | Enlace en el correo, un clic y entras |
| **SMS / OTP por teléfono** | No nativo | Hay que **integrar un proveedor** (ej. Twilio) |
| **WhatsApp** | No nativo | Hay que **integrar Meta / Twilio WhatsApp** |

Documentación oficial: [Convex Auth — métodos](https://labs.convex.dev/auth/config)

---

## SMS (código al celular)

Convex **no envía SMS solo**. Tú conectas un proveedor:

### Opción A — Twilio SMS + OTP custom (recomendada con Convex)

- **Quién:** [Twilio](https://www.twilio.com/)
- **Cómo:** Provider personalizado en Convex (ejemplo en el [repo de Convex Auth](https://github.com/get-convex/convex-auth-example))
- **Flujo:** Usuario ingresa `+52...` → Twilio envía SMS con código → usuario lo escribe en la app → Convex valida y crea sesión
- **Dónde se guarda:** `users.phone` + índice `phone` (ya existe en tu schema)
- **Costo:** ~USD 0.01–0.05 por SMS según país
- **Pros:** Muy usado, buena doc, funciona en México
- **Contras:** Configuración extra, cuenta Twilio, número verificado

### Opción B — Twilio Verify

- **Quién:** Twilio Verify (servicio gestionado de OTP)
- **Cómo:** Provider `ConvexCredentials` que llama API Verify (Twilio genera y valida el código)
- **Pros:** Menos lógica tuya (Twilio maneja expiración e intentos)
- **Contras:** Más caro que SMS crudo, dependencia de Twilio

### Opción C — Firebase Phone Auth + token en Convex

- **Quién:** Google Firebase Authentication
- **Cómo:** Firebase verifica el SMS en el móvil; tu app pasa el token a Convex con un provider custom
- **Pros:** SDK móvil maduro
- **Contras:** Dos sistemas (Firebase + Convex), más complejo de mantener

### Opción D — Proveedores locales (México / LATAM)

- **Ejemplos:** MessageBird, Vonage, AWS SNS, algunos agregadores locales
- **Cómo:** Igual que Twilio: HTTP desde una mutation/action de Convex para enviar y validar OTP
- **Cuándo:** Si Twilio es caro o quieres soporte local específico

---

## WhatsApp

Convex **no tiene provider de WhatsApp**. Opciones:

### Opción 1 — Twilio WhatsApp API

- Envías el código OTP por **WhatsApp Business** (no chat personal)
- Requiere cuenta Meta Business verificada + plantillas de mensaje aprobadas
- Integración similar a SMS vía Twilio desde Convex
- **Pros:** Usuario recibe código en WhatsApp (muy natural en LATAM)
- **Contras:** Aprobación de plantillas, costo, setup más largo

### Opción 2 — Meta WhatsApp Cloud API

- **Quién:** [developers.facebook.com](https://developers.facebook.com/) — WhatsApp Business Platform
- **Cómo:** Convex Action llama la API de Meta para enviar mensaje con código (plantilla `authentication`)
- **Pros:** Directo con Meta, sin intermediario (si ya tienes WhatsApp Business)
- **Contras:** Verificación de negocio, plantillas, webhooks

### Opción 3 — No usar WhatsApp para login

- Login con **Google** (ya lo tienes) o **SMS**
- WhatsApp solo para **notificaciones** de viajes (Twilio/Meta aparte, no auth)
- **Pros:** Más simple; auth y mensajería separados
- **Recomendado** para una primera versión

---

## Email OTP (alternativa sin SMS)

Si no quieres SMS pero sí “sin contraseña”:

| Servicio | Rol |
| --- | --- |
| **Resend** | Envía código por email (muy fácil con Convex Auth) |
| **SendGrid**, **Postmark** | Igual, vía provider Email de Auth.js |

Flujo: usuario pone email → recibe código → lo ingresa en la app.  
**Contras en móvil:** el usuario debe salir a revisar el correo (peor UX que Google o SMS).

---

## Comparación rápida para Hercom

| Necesidad | Recomendación |
| --- | --- |
| Choferes entran rápido en la app | **Google** (ya implementado) |
| Clientes web sin Gmail | Email/contraseña o Google en web comercial |
| Login solo con número de celular | **Twilio SMS** o **Twilio Verify** + provider custom |
| Código por WhatsApp | **Twilio WhatsApp** o **Meta Cloud API** (fase 2) |
| Admin interno | Email/contraseña o Google + `role: admin` manual |
| Demo / pruebas | Seed `demo1234` (password) |

---

## Próximo paso si quieres SMS

1. Crear cuenta Twilio y comprar/verificar un número SMS.
2. Añadir provider `PhoneOTP` en `packages/backend/convex/` (similar al ejemplo Twilio de Convex Auth).
3. Pantalla móvil: campo teléfono + código de 6 dígitos.
4. Guardar en `users.phone` al verificar.

Si quieres WhatsApp, el flujo es parecido pero con plantillas de autenticación aprobadas por Meta.

---

## Documentos relacionados

- [convex-google-auth.md](./convex-google-auth.md) — Google ya configurado
- [conectar-convex-expo.md](./conectar-convex-expo.md)
- [flujo-vistas.md](./flujo-vistas.md)
