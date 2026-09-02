# DICCIONARIO DE DATOS

Este formato esta pensado para plegado por encabezados en Cursor/VSCode.
Puedes contraer/expandir cada bloque usando la flecha del gutter.

# 1) Tablas de Convex Auth (sistema de autenticacion)

Convex Auth usa `authTables` desde `@convex-dev/auth/server`, que agrega tablas internas:

- `authSessions`
- `authAccounts`
- `authRefreshTokens`
- `authVerificationCodes`
- `authVerifiers`
- `authRateLimits`
- `users` (en este proyecto se sobreescribe para agregar `role` y `phone`)

Por eso en el dashboard de Convex se ven tablas adicionales respecto a negocio.

Todas las tablas de Convex tienen metacampos:

- `_id`
- `_creationTime`

Ademas, algunos campos referencian IDs con `v.id("<tabla>")`.

## `authSessions` (sesion activa por usuario/dispositivo)

Campos:
- `userId` (id `users`)
- `expirationTime` (number)

Indice:
- `userId` sobre `userId`

## `authAccounts` (cuenta por proveedor de autenticacion)

Campos:
- `userId` (id `users`)
- `provider` (string)
- `providerAccountId` (string)
- `secret` (optional string)
- `emailVerified` (optional string)
- `phoneVerified` (optional string)

Indices:
- `userIdAndProvider` sobre `userId, provider`
- `providerAndAccountId` sobre `provider, providerAccountId`

## `authRefreshTokens` (refresh tokens por sesion)

Campos:
- `sessionId` (id `authSessions`)
- `expirationTime` (number)
- `firstUsedTime` (optional number)
- `parentRefreshTokenId` (optional id `authRefreshTokens`)

Indices:
- `sessionId` sobre `sessionId`
- `sessionIdAndParentRefreshTokenId` sobre `sessionId, parentRefreshTokenId`

## `authVerificationCodes` (codigos OTP/magic link/OAuth)

Campos:
- `accountId` (id `authAccounts`)
- `provider` (string)
- `code` (string)
- `expirationTime` (number)
- `verifier` (optional string)
- `emailVerified` (optional string)
- `phoneVerified` (optional string)

Indices:
- `accountId` sobre `accountId`
- `code` sobre `code`

## `authVerifiers` (verificadores PKCE de OAuth)

Campos:
- `sessionId` (optional id `authSessions`)
- `signature` (optional string)

Indice:
- `signature` sobre `signature`

## `authRateLimits` (control de intentos OTP/password)

Campos:
- `identifier` (string)
- `lastAttemptTime` (number)
- `attemptsLeft` (number)

Indice:
- `identifier` sobre `identifier`

# 2) Tablas de negocio (modelo de la app)

Estas tablas estan definidas manualmente en `packages/backend/convex/schema.ts`.

## `users` (usuario extendido con rol de negocio)

Origen: tabla de auth extendida por el proyecto.

Campos:
- `name` (optional string): nombre mostrado del usuario.
- `email` (optional string): correo.
- `phone` (optional string): telefono.
- `image` (optional string): URL de avatar/foto.
- `emailVerificationTime` (optional number): timestamp de verificacion email.
- `phoneVerificationTime` (optional number): timestamp de verificacion telefono.
- `isAnonymous` (optional boolean): marca de cuenta anonima.
- `role` (`"client" | "driver" | "admin"`): rol de negocio.

Indices:
- `email` sobre `email`
- `phone` sobre `phone`

## `drivers` (perfil operativo del chofer)

Campos:
- `userId` (id `users`)
- `status` (`"available" | "busy" | "offline"`)
- `vehicle` (object):
  - `make` (string)
  - `model` (string)
  - `plate` (string)
  - `year` (number)
  - `color` (optional string)
- `licenseNumber` (string)
- `licenseExpiry` (number)
- `rating` (number)
- `totalTrips` (number)

Indices:
- `by_user` sobre `userId`
- `by_status` sobre `status`

## `driverApplications` (solicitud de alta de chofer)

Campos:
- `userId` (id `users`)
- `dni` (string)
- `firstName` (string)
- `firstLastName` (string)
- `secondLastName` (string)
- `sex` (`"M" | "F"`)
- `licenseNumber` (string)
- `licenseCategory` (string)
- `licensePhotoIds` (array de id `_storage`)
- `culPdfId` (id `_storage`) — CUL (Certificado Único Laboral)
- `conductorRecordPdfId` (optional id `_storage`) — récord de conductor MTC
- `status` (`"pending" | "approved" | "rejected"`)
- `submittedAt` (number)
- `reviewedAt` (optional number)

Indices:
- `by_user` sobre `userId`
- `by_dni` sobre `dni`
- `by_status` sobre `status`

## `services` (solicitud y ciclo de vida del servicio)

Campos:
- `clientId` (id `users`)
- `driverId` (optional id `drivers`)
- `origin` (object):
  - `address` (string)
  - `lat` (number)
  - `lng` (number)
  - `department` (optional string, para promociones regionales)
  - `province` (optional string)
  - `district` (optional string)
- `destination` (object):
  - `address` (string)
  - `lat` (number)
  - `lng` (number)
- `basePrice` (number, tarifa efectiva que paga el cliente; minimo S/80 sin promo)
- `catalogBasePrice` (optional number, tarifa de lista antes de descuento festivo)
- `discountRate` (optional number, 0-0.25)
- `promotionId` (optional id `promotions`)
- `promotionName` (optional string)
- `offeredPrice` (optional number, tarifa ofertada y aceptada)
- `securityCode` (optional string, codigo compartido cliente/chofer para iniciar viaje)
- `totalPrice` (number, tarifa acordada; mientras esta pendiente inicia en basePrice)
- `driverCommission` (number, ganancia Hercom; con promo = clientPrice - driverNet)
- `advanceAmount` (optional number, anticipo del 25% sobre `offeredPrice`; se calcula al asignar chofer)
- `advanceConfirmedAt` (optional number, timestamp cuando el chofer confirma que recibio el anticipo)
- `serviceType` (optional `"app" | "premium"`; legacy sin valor se trata como app)
- `requestChannel` (optional `"mobile_app" | "web_comercial" | "phone"`)
- `status` (`"pending" | "assigned" | "heading_to_pickup" | "arrived_pickup" | "in_progress" | "arrived_destination" | "en_route" (legacy) | "finished" | "cancelled"`)
- `notes` (optional string)
- `requestedAt` (number)
- `assignedAt` (optional number)
- `headingToPickupAt` (optional number)
- `arrivedPickupAt` (optional number)
- `departedWithClientAt` (optional number)
- `arrivedDestinationAt` (optional number)
- `finishedAt` (optional number)
- `cancelledAt` (optional number)

Indices:
- `by_client` sobre `clientId`
- `by_driver` sobre `driverId`
- `by_status` sobre `status`
- `by_driver_status` sobre `driverId, status`

## `promotions` (descuentos festivos por region)

Campos:
- `name` (string)
- `festivityLabel` (optional string, ej. Fiestas Patrias)
- `department` (string)
- `province` (optional string; vacio = todo el departamento)
- `district` (optional string; vacio = toda la provincia)
- `discountRate` (number, max 0.25)
- `startsAt` (number, inicio de vigencia)
- `endsAt` (number, fin de vigencia)
- `active` (boolean)
- `createdAt` (number)
- `createdBy` (id `users`)

Indices:
- `by_active` sobre `active`
- `by_department` sobre `department`

## `serviceOffers` (ofertas de choferes por servicio pendiente)

Campos:
- `serviceId` (id `services`)
- `driverId` (id `drivers`)
- `offeredPrice` (number)
- `status` (`"pending" | "accepted" | "rejected"`)
- `createdAt` (number)
- `respondedAt` (optional number)

Indices:
- `by_service` sobre `serviceId`
- `by_driver` sobre `driverId`
- `by_service_status` sobre `serviceId, status`
- `by_service_driver` sobre `serviceId, driverId`

## `driverWallets` (saldo prepago del chofer para demo)

Campos:
- `driverId` (id `drivers`)
- `balance` (number)
- `updatedAt` (number)

Observacion:
- El chofer recarga su propio saldo desde la app (flujo actual sin pasarela).
- Límite mínimo de saldo permitido: S/-10.

Indices:
- `by_driver` sobre `driverId`

## `walletTransactions` (movimientos del saldo del chofer)

Campos:
- `driverId` (id `drivers`)
- `type` (`"top_up" | "commission_debit"`)
- `amount` (number, siempre positivo)
- `balanceAfter` (number)
- `serviceId` (optional id `services`)
- `createdByUserId` (optional id `users`)
- `note` (optional string)
- `createdAt` (number)

Indices:
- `by_driver` sobre `driverId`
- `by_driver_created` sobre `driverId, createdAt`
- `by_type_created` sobre `type, createdAt`
- `by_service` sobre `serviceId`

## `notifications` (avisos in-app para cliente/chofer)

Campos:
- `userId` (id `users`, destinatario)
- `type` (`"offer_received" | "trip_confirmed_driver" | "trip_confirmed_client" | "driver_heading_pickup" | "driver_arrived_pickup" | "advance_confirmed"`)
- `title` (string)
- `message` (string)
- `serviceId` (optional id `services`)
- `readAt` (optional number)
- `createdAt` (number)

Indices:
- `by_user` sobre `userId`
- `by_user_created` sobre `userId, createdAt`

## `serviceVehicleChecklists` (checklist de recojo antes de iniciar viaje)

Campos:
- `serviceId` (id `services`)
- `driverId` (id `drivers`)
- `phase` (`"pickup"`)
- `hasVehicleDamage` (boolean)
- `damageNotes` (optional string)
- `hasPropertyCard` (boolean)
- `hasSoat` (boolean)
- `checkedAt` (number)
- `updatedAt` (number)

Indices:
- `by_service` sobre `serviceId`
- `by_driver` sobre `driverId`

## `payments` (pago del cliente por servicio)

Campos:
- `serviceId` (id `services`)
- `clientId` (id `users`)
- `amount` (number)
- `method` (optional string)
- `status` (`"pending" | "paid"`)
- `paidAt` (optional number)

Indices:
- `by_service` sobre `serviceId`
- `by_client` sobre `clientId`
- `by_status` sobre `status`

## `payouts` (liquidacion legacy/manual de comisiones al chofer)

Campos:
- `driverId` (id `drivers`)
- `accumulatedAmount` (number)
- `paidAmount` (number)
- `status` (`"pending" | "paid"`)
- `periodStart` (optional number)
- `periodEnd` (optional number)
- `paidAt` (optional number)

Indices:
- `by_driver` sobre `driverId`
- `by_status` sobre `status`
- `by_driver_status` sobre `driverId, status`

# 3) Reglas para builds EAS (pasos obligatorios)

El paquete `@proyecto/backend` exporta tipos y API desde `convex/_generated`.
Antes de generar build movil, esos archivos deben estar sincronizados.

Si cambiaste el schema o funciones en `packages/backend/convex/`, ejecuta:

```powershell
cd packages/backend
npx convex codegen
```

Luego corre el build:

```powershell
cd apps/mobile
npx eas-cli build --platform android --profile preview
```
