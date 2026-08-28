# Resumen del flujo de atención

Este documento describe el recorrido completo de un servicio en Hercom: desde que alguien pide un chofer hasta que el viaje queda cerrado y registrado el pago. Para detalle de archivos y métodos, ver `docs/3 FLUJO TECNICO LOGIN VIAJE CIERRE.md`.

---

## Antes del viaje

El chofer entra a la app, se registra con DNI y documentos, y queda con perfil en `drivers` y wallet en `driverWallets`. Recarga saldo solo (botones S/10, S/20, S/50 o monto libre). Sin saldo suficiente no puede ofertar: la comisión de la app es 25% del precio ofertado y el piso de saldo es S/-10.

El cliente inicia sesión y pide servicio con recojo, destino y tarifa base (mínimo S/80 = S/40/h × 2 h). El servicio nace en estado `pending` y queda etiquetado como **App** (`serviceType=app`, canal app móvil).

En la **web comercial** o por **teléfono** (registro admin), las solicitudes quedan como **Premium**.

Operaciones puede activar **promociones festivas** por departamento/provincia/distrito en el panel admin. El descuento lo absorbe Hercom (tope 25%); el chofer mantiene su neto del 75% sobre la tarifa de lista.

Choferes disponibles ven la solicitud y envían oferta (tarifa ≥ base). El cliente recibe notificación. Cuando elige una oferta, el servicio pasa a `assigned`, el chofer queda `busy`, se calcula el anticipo del 25% sobre la tarifa ofertada y se genera un código de seguridad de 4 dígitos.

Antes de salir, el cliente entrega el anticipo al chofer y el chofer lo confirma en la app (`confirmAdvanceReceived`). Solo entonces puede pulsar **Salir a recoger**.

---

## Atención en ruta

El chofer marca que sale a recoger (`heading_to_pickup`). La app abre Waze al punto de recojo y el cliente recibe aviso.

Al llegar (`arrived_pickup`), el cliente recibe otro aviso. El chofer completa checklist: observaciones del vehículo, Tarjeta de Propiedad y SOAT. Luego ingresa el código que le da el cliente y confirma con slide (no es un botón simple, para evitar toques accidentales). Si el código y el checklist están bien, el viaje pasa a `in_progress` y Waze abre ruta al destino.

En camino, el chofer marca llegada a cada parada con `arriveAtCurrentStop` (origen → paradas extra → destino). Al último punto queda en `arrived_destination` y después finaliza (`finished`). Esos dos últimos pasos no disparan notificación al cliente; el admin los ve en el tablero interno.

Desde que el chofer sale a recoger (`heading_to_pickup`) hasta que termina, la app publica **GPS en vivo** (`serviceTracking`). El cliente (o el chofer) puede **compartir el viaje** con un link. Hoy el link es `choferes://live/{token}` (solo con app instalada). El objetivo acordado es publicarlo también en la **web comercial** como `https://www.hercom.pe/live/{token}` usando la query pública `getByShareToken`.

---

## Dinero al cerrar

Al finalizar, la app descuenta del wallet del chofer la comisión (25% sobre la tarifa ofertada). Queda un movimiento `commission_debit` y el chofer vuelve a `available`.

En paralelo se crea un registro de pago del cliente en `payments` con estado `pending` por el **saldo restante** (`totalPrice - advanceAmount`), ya que el 25% se pagó en efectivo al chofer al inicio. Hoy no hay pasarela: el cobro del saldo y el marcado como pagado lo hace admin en web. La recarga del chofer también es manual/demo por ahora.

---

## Valoración del chofer (cliente)

Cuando el servicio está en `finished`:

1. En la app del cliente aparece el bloque **“Valorar viaje”** (estrellas 1–5 y comentario opcional).
2. El cliente envía la valoración una sola vez (`serviceRatings.rateService`).
3. El sistema guarda la calificación y **recalcula el promedio** (`drivers.rating`) del chofer.
4. Si ya valoró, solo ve el mensaje “Valoraste este viaje con X★”.

Reglas clave: solo el cliente dueño del servicio; solo viajes finalizados; una valoración por servicio.

---

## Notificaciones (cliente / chofer)

| Momento | Quién recibe |
| --- | --- |
| Llega o se actualiza una oferta | Cliente |
| Cliente confirma chofer | Chofer y cliente (incluye código y monto de anticipo) |
| Chofer confirma anticipo recibido | Cliente |
| Chofer sale a recoger | Cliente |
| Chofer llega al punto de recojo | Cliente |

---

## Estados del servicio (orden habitual)

`pending` → `assigned` → *(anticipo confirmado)* → `heading_to_pickup` → `arrived_pickup` → `in_progress` → `arrived_destination` → `finished`

También existe `cancelled` si cliente o admin cancelan antes de terminar.

---

## Dónde ocurre cada cosa

Cliente: app móvil o web comercial (`ClientDashboard`, `MyServices`). Chofer: app móvil (`DriverDashboard`, `ServiceCard` — botón de confirmación de anticipo). Operación interna: web admin (`ServicesBoard` con tipo/canal/anticipo, `PremiumServiceForm` para teléfono). Backend: Convex (`services.confirmAdvanceReceived`, `services.createPremiumServiceAsAdmin`, `services`, `serviceOffers`, `driverWallets`, `notifications`, `serviceChecklists`, `payments`).
