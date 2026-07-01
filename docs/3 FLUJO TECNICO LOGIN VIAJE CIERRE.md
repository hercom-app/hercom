# FLUJO TECNICO - LOGIN A CIERRE DE VIAJE

Documento tecnico de referencia para explicar:

- Que archivos de frontend participan (React Native, no HTML).
- Que metodos de backend participan (Convex queries/mutations/actions).
- Que tablas se leen/escriben en cada etapa.
- Revision de la ultima correccion aplicada al problema "la app se sale".

---

## 1) Revision de la ultima correccion (incidente "se sale la pantalla")

### 1.1 Sintoma reportado

- Al iniciar sesion (cliente o chofer), la app "se sale" al entrar al menu.

### 1.2 Evidencia encontrada

- En logs de Convex aparecian errores de funciones faltantes en deployment:
  - `driverWallets:getMine`
  - `services:listOpenForOffers`
  - `notifications:listMine`
- Luego, al sincronizar backend, esos errores desaparecieron y quedaron solo logs esperables de "no autenticado" cuando se consulta desde CLI sin sesion.

### 1.3 Causa raiz

1. Desfase frontend/backend en deployment de Convex:
   - El frontend llamaba funciones nuevas que no estaban publicadas aun en el deployment activo.
2. Robustez de app:
   - Si existia data pendiente corrupta en `SecureStore`, podia romper el flujo de registro de chofer.

### 1.4 Correcciones aplicadas

- Publicacion de funciones al deployment de desarrollo:
  - `npx convex dev --once`
- Hardening en app movil:
  - `apps/mobile/src/lib/driverRegistration.ts`
    - parse seguro de JSON (si falla, limpia llave y continua).
  - `apps/mobile/src/components/AppErrorBoundary.tsx` (nuevo)
    - boundary global para evitar cierre abrupto de UI por error de render.
  - `apps/mobile/App.tsx`
    - integra `AppErrorBoundary`.
  - `apps/mobile/src/screens/DriverRegisterScreen.tsx`
    - valida `file` undefined en seleccion de PDF antes de usarlo.

### 1.5 Estado tecnico

- `pnpm --filter @proyecto/mobile typecheck` -> OK.
- Backend nuevo publicado en Convex dev.

---

## 2) Frontend principal que participa (movil)

> En esta app no hay HTML tradicional. Son pantallas/componentes React Native (`.tsx`).

### 2.1 Shell, auth y ruteo de alto nivel

- `apps/mobile/App.tsx`
  - Inicializa `ConvexReactClient`.
  - Monta `ConvexAuthProvider`.
  - Separa flujo `Unauthenticated` vs `Authenticated`.
  - Ejecuta `PendingRegistrationSubmit` antes de `HomeScreen`.

- `apps/mobile/src/components/AppErrorBoundary.tsx`
  - Captura errores de render en arbol de UI y evita cierre abrupto.

### 2.2 Login / registro de chofer

- `apps/mobile/src/screens/SignInScreen.tsx`
  - Pantalla de entrada.
  - Acceso a login Google / password.
  - Entrada a registro de chofer.

- `apps/mobile/src/screens/DriverRegisterScreen.tsx`
  - Formulario documental del chofer.
  - Llama RENIEC y prepara evidencia (fotos/PDF).

- `apps/mobile/src/components/GoogleSignInButton.tsx`
  - OAuth Google para completar autenticacion.

- `apps/mobile/src/components/PendingRegistrationSubmit.tsx`
  - Tras login, sube archivos a Convex storage y ejecuta `driverApplications.submit`.

### 2.3 Resolucion de perfil y dashboard

- `apps/mobile/src/screens/HomeScreen.tsx`
  - Lee `users.getMe` + `drivers.getMyDriverProfile`.
  - Decide dashboard de cliente o chofer.

- `apps/mobile/src/screens/ClientDashboard.tsx`
  - Cliente solicita servicio y gestiona ofertas/notificaciones.

- `apps/mobile/src/screens/DriverDashboard.tsx`
  - Chofer gestiona disponibilidad, saldo, ofertas, notificaciones y viajes activos.

- `apps/mobile/src/components/AvailabilityToggle.tsx`
  - Cambia estado de chofer (`available/offline`).

- `apps/mobile/src/components/ServiceCard.tsx`
  - Flujo operativo del viaje del lado chofer:
    - estados,
    - checklist,
    - codigo seguridad,
    - slide para iniciar,
    - navegacion Waze.

- `apps/mobile/src/components/SlideToConfirm.tsx`
  - Confirmacion deslizante para iniciar viaje (evita toque accidental).

---

## 3) Backend principal que participa (Convex)

### 3.1 Auth y usuario

- `packages/backend/convex/users.ts`
  - `getMe`, `updateProfile`, `setRole`, `listAll`.

- `packages/backend/convex/lib/auth.ts`
  - `requireUser`, `requireRole`, `requireDriver`.

### 3.2 Registro de chofer

- `packages/backend/convex/reniec.ts`
  - `lookupDni` (action).

- `packages/backend/convex/driverApplications.ts`
  - `generateUploadUrl`
  - `submit`
  - `getMyApplication`
  - `listPending`

- `packages/backend/convex/drivers.ts`
  - `getMyDriverProfile`
  - `setStatus`
  - `listAvailable` / `listAll`

### 3.3 Flujo de servicio y ofertas

- `packages/backend/convex/services.ts`
  - `createService`
  - `listForClient`, `listForDriver`, `listOpenForOffers`
  - `updateStatus`
  - `startTripWithCode`
  - `cancelService`
  - `listAllForAdmin`

- `packages/backend/convex/serviceOffers.ts`
  - `submitMyOffer`
  - `listForServiceAsClient`
  - `acceptOffer`
  - `listMine`

### 3.4 Notificaciones, wallet y checklist

- `packages/backend/convex/notifications.ts`
  - `listMine`, `getUnreadCount`, `markAsRead`, `markAllAsRead`
  - helper interno `createNotification`

- `packages/backend/convex/driverWallets.ts`
  - `getMine`, `listMyTransactions`, `topUpMine`
  - `listTopUpsTodayForAdmin`
  - helpers: `ensureWallet`, `hasSufficientBalance`, `debitCommissionForService`

- `packages/backend/convex/serviceChecklists.ts`
  - `getForMyService`
  - `upsertPickupChecklist`

### 3.5 Modelo de datos (tablas clave)

- `users`
- `drivers`
- `driverApplications`
- `services`
- `serviceOffers`
- `notifications`
- `driverWallets`
- `walletTransactions`
- `serviceVehicleChecklists`
- `payments`

---

## 4) Flujo completo (login -> pedir viaje -> realizar -> terminar)

## 4.1 Etapa A - Inicio de sesion y perfil

1. Usuario entra por `SignInScreen`.
2. Se autentica (Google/password via Convex Auth).
3. `App.tsx` pasa a rama `Authenticated`.
4. `HomeScreen` consulta:
   - `users.getMe`
   - `drivers.getMyDriverProfile`
5. Decision de vista:
   - Si tiene rol/perfil de chofer -> `DriverDashboard`.
   - Caso contrario -> `ClientDashboard`.

Tablas tocadas:

- Lectura: `users`, `drivers`.

---

## 4.2 Etapa B - Registro de chofer (si aplica)

1. Usuario abre `DriverRegisterScreen`.
2. Valida DNI con `reniec.lookupDni`.
3. Guarda datos pendientes en secure storage local.
4. Tras Google OAuth, `PendingRegistrationSubmit`:
   - pide URL de subida `driverApplications.generateUploadUrl`,
   - sube fotos/PDF a storage,
   - ejecuta `driverApplications.submit`.
5. Backend crea:
   - solicitud aprobada en `driverApplications`,
   - perfil en `drivers`,
   - wallet inicial en `driverWallets`,
   - actualiza rol en `users`.

Tablas tocadas:

- Escritura: `driverApplications`, `drivers`, `driverWallets`, `users`, `storage`.

---

## 4.3 Etapa C - Cliente pide viaje

1. `ClientDashboard` ejecuta `services.createService` con:
   - `origin` (recojo),
   - `destination`,
   - `basePrice` (>= 40),
   - `tipAmount`.
2. Servicio queda en `pending`.

Tablas tocadas:

- Escritura: `services`.

---

## 4.4 Etapa D - Chofer oferta, cliente elige

1. Chofer ve pendientes con `services.listOpenForOffers`.
2. Chofer envia oferta con `serviceOffers.submitMyOffer`.
3. Backend notifica cliente (`notifications` tipo oferta).
4. Cliente lista ofertas con `serviceOffers.listForServiceAsClient`.
5. Cliente acepta con `serviceOffers.acceptOffer`.
6. Efecto de aceptacion:
   - servicio `assigned`,
   - chofer `busy`,
   - se genera `securityCode`,
   - ofertas restantes `rejected`,
   - notificaciones a cliente y chofer.

Tablas tocadas:

- Lectura/escritura: `services`, `serviceOffers`, `drivers`, `driverWallets`, `notifications`.

---

## 4.5 Etapa E - Ejecucion del viaje

1. Chofer cambia a `heading_to_pickup` (`services.updateStatus`):
   - notificacion al cliente,
   - frontend abre Waze hacia `origin`.
2. Chofer marca `arrived_pickup` (`services.updateStatus`):
   - notificacion al cliente.
3. Antes de iniciar:
   - guarda checklist con `serviceChecklists.upsertPickupChecklist`:
     - estado vehiculo / observaciones
     - tarjeta propiedad
     - SOAT
4. Chofer valida codigo con slide:
   - `services.startTripWithCode` (requiere codigo correcto + checklist valido),
   - frontend abre Waze hacia `destination`.
5. Chofer marca `arrived_destination` y luego `finished` con `services.updateStatus`.

Tablas tocadas:

- Escritura: `services`, `serviceVehicleChecklists`, `notifications`.

---

## 4.6 Etapa F - Cierre financiero del viaje

Al pasar a `finished`:

1. Se descuenta comision del chofer:
   - update en `driverWallets`
   - insercion en `walletTransactions` tipo `commission_debit`
2. Se crea pago pendiente del cliente (idempotente):
   - insercion en `payments` si no existe.
3. Chofer vuelve a `available` y aumenta `totalTrips`.

Tablas tocadas:

- Escritura: `driverWallets`, `walletTransactions`, `payments`, `drivers`, `services`.

---

## 5) Matriz rapida: paso vs metodos vs BD

| Paso | Frontend | Backend | Tablas |
| --- | --- | --- | --- |
| Login + resolver perfil | `App.tsx`, `HomeScreen.tsx` | `users.getMe`, `drivers.getMyDriverProfile` | `users`, `drivers` |
| Registro chofer | `DriverRegisterScreen.tsx`, `PendingRegistrationSubmit.tsx` | `reniec.lookupDni`, `driverApplications.generateUploadUrl`, `driverApplications.submit` | `driverApplications`, `drivers`, `driverWallets`, `users`, `storage` |
| Solicitar viaje | `ClientDashboard.tsx` | `services.createService` | `services` |
| Ofertar/aceptar | `DriverDashboard.tsx`, `ClientDashboard.tsx` | `serviceOffers.submitMyOffer`, `serviceOffers.acceptOffer`, `serviceOffers.listForServiceAsClient` | `serviceOffers`, `services`, `notifications`, `drivers` |
| Operar viaje | `ServiceCard.tsx`, `SlideToConfirm.tsx` | `services.updateStatus`, `serviceChecklists.upsertPickupChecklist`, `services.startTripWithCode` | `services`, `serviceVehicleChecklists`, `notifications` |
| Finalizar | `ServiceCard.tsx` | `services.updateStatus` (+ helpers internos) | `services`, `driverWallets`, `walletTransactions`, `payments`, `drivers` |

---

## 6) Observacion operativa importante

Cada vez que cambie backend Convex (`schema` o funciones):

```powershell
cd packages/backend
npx convex codegen
npx convex dev --once
```

Si este paso se omite, el frontend puede quedar desfasado con deployment y producir errores de pantalla al entrar a menu por funciones no encontradas.

