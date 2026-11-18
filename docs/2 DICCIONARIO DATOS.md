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
- `role` (`"client" | "driver" | "admin" | "superadmin" | "hr"`): rol de negocio.
- `firstTripsDiscountLimit` (optional number): tope de viajes con descuento de este cliente. Si falta, se escribe 3. Vive en el usuario, no como constante suelta.
- `firstTripsDiscountUsed` (optional number): servicios de este cliente que ocupan cupo ahora. Sube al crear un viaje y baja al cancelarlo o dejarlo no atendido.
- `firstTripsDiscountRate` (optional number): porcentaje de los primeros viajes. `0.15` = 15%. Si falta, se escribe 0.15. No se suma a una campaña.

Indices:
- `email` sobre `email`
- `phone` sobre `phone`

## `savedPlaces` (casa y favoritos del cliente)

Tabla aparte de `users`. Una casa y hasta 4 favoritos por usuario.

Campos:
- `userId` (id `users`)
- `kind` (`"home" | "favorite"`)
- `label` (string): «Casa» o el nombre del favorito
- `address` (string)
- `lat` (number)
- `lng` (number)
- `updatedAt` (number)

Indice:
- `by_user` sobre `userId`

Funciones: `savedPlaces.listMine`, `setHome`, `saveFavorite`, `remove`.

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
- `basePrice` (number, lo que paga el cliente sobre la lista; con descuento es menor que la lista)
- `catalogBasePrice` (optional number, tarifa de lista, sin descuento)
- `discountRate` (optional number, 0-0.25). El único porcentaje de este viaje. `0.15` = 15%, `0.10` = 10%. Si falta, no hay descuento. No es la suma de dos descuentos.
- `discountKind` (optional `"first_trips" | "campaign"`). Cuál descuento quedó. `first_trips` usa `users.firstTripsDiscountRate`. `campaign` usa `promotions.discountRate`.
- `promotionId` (optional id `promotions`, campaña que originó el descuento)
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
- `requestedAt` (number, momento en que el cliente pidió)
- `assignedAt` (optional number, momento en que el cliente eligió chofer o un admin asignó)
- `headingToPickupAt` (optional number, momento en que el chofer salió)
- `arrivedPickupAt` (optional number, momento en que el chofer llegó al recojo)
- `checklistStartedAt` (optional number, primera apertura del checklist de recojo)
- `departedWithClientAt` (optional number, inicio del viaje tras el código de seguridad)
- `arrivedDestinationAt` (optional number)
- `finishedAt` (optional number, fin del servicio)
- `cancelledAt` (optional number, cancelación)
- `extendedAt` (optional array of number, cada extensión de +1 h)

Indices:
- `by_client` sobre `clientId` (este índice es el que usa el cupo de primeros viajes)
- `by_driver` sobre `driverId`
- `by_status` sobre `status`
- `by_driver_status` sobre `driverId, status`

### Descuentos: no se acumulan

Un viaje tiene un solo `services.discountRate`. Nunca se suman el de primeros viajes y el de una campaña.

| Qué | Dónde |
| --- | --- |
| Porcentaje de los primeros viajes | `users.firstTripsDiscountRate` (0.15 = 15% si no se había escrito) |
| Tope de ese cliente | `users.firstTripsDiscountLimit` (3 si no se había escrito) |
| Cupos ya usados | `users.firstTripsDiscountUsed` |
| Porcentaje de la campaña de fechas | `promotions.discountRate` (ejemplo Navidad o Fiestas Patrias: 0.10) |
| Cuál de los dos quedó en el viaje | `services.discountKind`: `first_trips` o `campaign` |
| Porcentaje aplicado a este viaje | `services.discountRate` (uno solo) |
| Lista sin descuento | `services.catalogBasePrice` |
| Lo que el cliente paga | `services.basePrice` y, al aceptar la oferta, `services.totalPrice` |
| Comisión real del chofer | `services.driverCommission` |

Regla al crear el servicio:

1. Si `used < limit`, el viaje usa solo `firstTripsDiscountRate`. Aunque esas fechas tengan campaña, el 10% no se suma.
2. Si el cupo ya se gastó y hay una promoción activa para la región y la fecha, el viaje usa solo `promotions.discountRate`.
3. Si no queda cupo y no hay campaña, no hay descuento.
4. Después de insertar, `firstTripsDiscountUsed` sube 1. Al cancelar o dejar el viaje no atendido, baja 1.

Ejemplo en diciembre, campaña navideña 10%, lista S/80, comisión 25%, primeros viajes 15%:

- Viajes 1, 2 y 3 del cliente: paga S/68, comisión S/8, se queda S/60. `discountKind = first_trips`.
- Del viaje 4 en adelante, dentro de las fechas: paga S/72, comisión S/12, se queda S/60. `discountKind = campaign`.
- Fuera de las fechas, ya sin cupo: paga S/80, comisión S/20, se queda S/60.

Ejemplo con lista S/80, comisión 25% y promoción 15%:

- `catalogBasePrice` = 80
- `discountRate` = 0.15
- `basePrice` / `totalPrice` = 68 (lo que el cliente le paga al chofer)
- `driverCommission` = 8 (no 20)
- El chofer se queda 60

Al ofertar, el chofer puede subir la lista. `discountRate` no cambia. `totalPrice` y `driverCommission` se recalculan sobre `offeredPrice` con ese mismo porcentaje (`serviceOffers.ts` al aceptar, `services.ts` al asignar o revisar la tarifa).

## `promotions` (campaña de fechas por región; no se acumula con los primeros viajes)

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
- `createdAt` (number, momento en que el chofer ofertó)
- `respondedAt` (optional number, momento en que el cliente aceptó o rechazó)

Indices:
- `by_service` sobre `serviceId`
- `by_driver` sobre `driverId`
- `by_service_status` sobre `serviceId, status`
- `by_service_driver` sobre `serviceId, driverId`

## `driverWallets` (saldo en soles del chofer para la comisión)

Campos:
- `driverId` (id `drivers`)
- `balance` (number, soles; puede ser negativo)
- `tripCredits` (optional number, legacy de viajes prepagados; no se usa para cobrar)
- `updatedAt` (number)

Observacion:
- El chofer recarga soles desde la app (S/30, S/50 o S/100).
- Al cerrar un viaje se descuenta la comisión (25% por defecto, o la del distrito).
- Límite mínimo de saldo permitido: S/-15.

Indices:
- `by_driver` sobre `driverId`

## `walletTransactions` (movimientos del saldo del chofer)

Campos:
- `driverId` (id `drivers`)
- `type` (`"top_up" | "commission_debit" | "trip_debit"`)
- `amount` (number, siempre positivo; en soles, salvo `trip_debit` legacy)
- `balanceAfter` (optional number, saldo en soles después del movimiento)
- `pricePenPaid` (optional number, soles de la recarga)
- `tripsAfter` (optional number, legacy)
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
- `vehiclePhotos` (optional array): 6 tomas `{ slot, storageId }`. Slots: `front`, `rear`, `left`, `right`, `interior`, `odometer`
- `checkedAt` (number)
- `updatedAt` (number)

Indices:
- `by_service` sobre `serviceId`
- `by_driver` sobre `driverId`

## `serviceRouteArchives` (ruta GPS del servicio, 90 días)

Un archivo por servicio. Mientras corre está `recording`. Al finalizar pasa a `finalized`, se exporta GeoJSON a File Storage y `expiresAt` queda a 90 días. Un cron diario (`purgeExpired`, 09:00 UTC) borra los vencidos.

Campos:
- `serviceId` (id `services`)
- `status` (`"recording" | "finalized"`)
- `trail` (array de `{ lat, lng, t }`)
- `archivedAt` (optional number)
- `expiresAt` (optional number)
- `geoJsonStorageId` (optional id `_storage`)
- `createdAt` (number)

Indices:
- `by_service` sobre `serviceId`
- `by_expires_at` sobre `expiresAt`

Consulta de panel: `serviceRouteArchives.getForAdmin`.

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
