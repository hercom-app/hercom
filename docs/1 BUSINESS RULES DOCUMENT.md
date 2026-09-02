# BUSINESS RULES DOCUMENT (BRD)

## 1. Objetivo y alcance

Este documento formaliza las reglas de negocio vigentes del sistema Hercom
(Convex + web comercial + web admin + app movil), usando el enfoque SBVR:

- Reglas estructurales (definicionales): describen el modelo del negocio.
- Reglas operativas (directivas): gobiernan el comportamiento en ejecucion.

El objetivo es:

- Estandarizar reglas con IDs unicos trazables.
- Evitar ambiguedad en implementacion y pruebas.
- Servir como base para QA, auditoria y evolucion del producto.

---

## 2. Convenciones de este catalogo

### 2.1 Formato de identificador

- Prefijo unico: `RN-XXX`
- Ejemplo: `RN-001`, `RN-024`

### 2.2 Tipos de regla (SBVR)

- `Estructural (Definicional)`
- `Operativa (Directiva)`

### 2.3 Categorias

- `Validacion`
- `Autorizacion`
- `Calculo / Derivacion`
- `Flujo de trabajo`
- `Integracion externa`

### 2.4 Estabilidad

- `Fija`: dificil que cambie (seguridad, integridad, cumplimiento).
- `Dinamica`: puede cambiar por decision de negocio u operacion.

### 2.5 Estados

- `Activa`
- `En revision`
- `Retirada`

---

## 3. Vocabulario de negocio (SBVR)

Terminos nucleares:

- `Usuario`: identidad autenticada en el sistema.
- `Cliente`: usuario con rol `client`.
- `Chofer`: usuario con rol `driver` y perfil en `drivers`.
- `Administrador`: usuario con rol `admin`.
- `Servicio`: solicitud de chofer creada por cliente.
- `Saldo de chofer`: balance prepago usado para cubrir la comision de app.
- `Movimiento de saldo`: recarga o descuento de comision.
- `Notificacion`: aviso in-app para cliente o chofer sobre eventos del servicio.
- `Codigo de seguridad`: codigo compartido cliente/chofer para iniciar viaje.
- `Pago`: deuda del cliente por servicio finalizado.
- `Payout`: modulo legacy para liquidaciones manuales (no automaticas en modo saldo prepago).
- `Solicitud de chofer`: registro documental para alta de chofer.

Hechos de negocio (fact types):

- Un `Cliente` crea `Servicios`.
- Un `Servicio` puede tener cero o un `Chofer` asignado.
- Un `Chofer` puede ofertar tarifa para servicios pendientes.
- Un `Cliente` elige una oferta para asignar chofer.
- Un `Chofer` ejecuta transiciones de estado del `Servicio`.
- Un `Chofer` debe tener saldo suficiente para tomar un servicio.
- Un `Chofer` puede recargar su propio saldo desde la app (modo demo).
- Un `Servicio` asignado genera un `Codigo de seguridad` para iniciar viaje.
- Un `Servicio` emite `Notificaciones` segun hitos del flujo operativo.
- Un `Servicio` finalizado descuenta comision de app del saldo del chofer.
- Un `Servicio` finalizado genera `Pago` pendiente.
- Un `Administrador` liquida pagos/comisiones y opera panel interno.

---

## 4. Catalogo de reglas de negocio (BR Catalog)

| ID | Nombre de la regla | Descripcion / Logica (lenguaje natural estructurado) | Tipo SBVR | Categoria | Estabilidad | Fuente / Stakeholder | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RN-001 | Roles validos de usuario | Un `Usuario` DEBE tener rol dentro de {`client`,`driver`,`admin`}. | Estructural | Validacion | Fija | Producto + Seguridad | Activa |
| RN-002 | Estados validos de servicio | Un `Servicio` DEBE tener estado dentro de {`pending`,`assigned`,`heading_to_pickup`,`arrived_pickup`,`in_progress`,`arrived_destination`,`en_route`,`finished`,`cancelled`}. | Estructural | Flujo de trabajo | Fija | Operaciones | Activa |
| RN-003 | Estados validos de chofer | Un `Chofer` DEBE tener estado dentro de {`available`,`busy`,`offline`}. | Estructural | Flujo de trabajo | Fija | Operaciones | Activa |
| RN-004 | Estados validos de pago | Un `Pago` DEBE tener estado dentro de {`pending`,`paid`}. | Estructural | Flujo de trabajo | Fija | Finanzas | Activa |
| RN-005 | Estados validos de payout | Un `Payout` DEBE tener estado dentro de {`pending`,`paid`}. | Estructural | Flujo de trabajo | Fija | Finanzas | Activa |
| RN-006 | Relacion cliente-servicio | Todo `Servicio` DEBE estar asociado a un `Cliente` (`clientId`). | Estructural | Validacion | Fija | Producto | Activa |
| RN-007 | Relacion chofer-servicio opcional | Un `Servicio` PUEDE no tener chofer al crearse (`driverId` opcional), y luego quedar asignado. | Estructural | Flujo de trabajo | Fija | Operaciones | Activa |
| RN-008 | Un pago por servicio | Un `Servicio` NO DEBE generar mas de un `Pago` (creacion idempotente por `serviceId`). | Estructural | Validacion | Fija | Finanzas + Backend | Activa |
| RN-009 | Comision de plataforma | La comision de plataforma DEBE derivarse de `offeredPrice * 0.25`, redondeada a 2 decimales. | Estructural | Calculo / Derivacion | Dinamica | Direccion + Finanzas | Activa |
| RN-010 | Acceso autenticado | Para ejecutar operaciones de negocio, el usuario DEBE estar autenticado. | Operativa | Autorizacion | Fija | Seguridad | Activa |
| RN-011 | Tarifa minima de contratacion | SI un cliente crea un servicio, ENTONCES `basePrice` DEBE ser >= S/80 (S/40/hora x 2 horas minimas de contratacion). | Operativa | Validacion | Fija | Operaciones | Activa |
| RN-012 | Estado inicial del servicio | SI un servicio se crea correctamente, ENTONCES su estado DEBE ser `pending` y registrar `requestedAt`. | Operativa | Flujo de trabajo | Fija | Operaciones | Activa |
| RN-013 | Oferta de chofer | Un chofer disponible PUEDE ofertar tarifa para un servicio en `pending`, siempre que la oferta sea >= tarifa base (minimo S/80 = 2h x S/40/h). | Operativa | Flujo de trabajo | Fija | Operaciones | Activa |
| RN-014 | Seleccion de oferta por cliente | Solo el cliente dueño del servicio PUEDE aceptar una oferta de su servicio pendiente. | Operativa | Autorizacion | Fija | Operaciones | Activa |
| RN-015 | Restriccion para aceptar oferta | SI el cliente acepta una oferta, ENTONCES el servicio DEBE estar en `pending`, el chofer en `available` y con saldo suficiente según límite S/-10. | Operativa | Validacion | Fija | Operaciones | Activa |
| RN-016 | Efecto de aceptacion de oferta | SI una oferta es aceptada, ENTONCES el servicio pasa a `assigned`, se genera `securityCode`, el chofer pasa a `busy`, la oferta queda `accepted` y el resto de ofertas `rejected`. | Operativa | Flujo de trabajo | Fija | Operaciones | Activa |
| RN-017 | Transiciones del chofer | Un chofer solo PUEDE cambiar estados: `assigned -> heading_to_pickup/cancelled`, `heading_to_pickup -> arrived_pickup/cancelled`, `arrived_pickup -> in_progress/cancelled` (validando codigo), `in_progress -> arrived_destination/cancelled`, `arrived_destination -> finished`. | Operativa | Flujo de trabajo | Fija | Operaciones | Activa |
| RN-018 | Propiedad del servicio para chofer | Un chofer NO DEBE actualizar un servicio que no este asignado a su `driverId`. | Operativa | Autorizacion | Fija | Seguridad + Operaciones | Activa |
| RN-019 | Finalizacion de servicio | SI un chofer finaliza servicio, ENTONCES el servicio pasa a `finished`, registra `finishedAt`, el chofer vuelve a `available` e incrementa `totalTrips`. | Operativa | Flujo de trabajo | Fija | Operaciones | Activa |
| RN-020 | Descuento de comision desde saldo | SI un servicio pasa a `finished`, ENTONCES el sistema DEBE descontar la comision de plataforma del saldo del chofer. | Operativa | Calculo / Derivacion | Fija | Finanzas | Activa |
| RN-021 | Limite de saldo negativo | El saldo del chofer puede llegar como máximo a S/-10. Por debajo de ese límite NO se permite ofertar/asignar servicio. | Operativa | Validacion | Fija | Finanzas + Operaciones | Activa |
| RN-022 | Movimiento de saldo por comision | Todo descuento por comision DEBE registrar un movimiento en `walletTransactions` con tipo `commission_debit`. | Operativa | Flujo de trabajo | Fija | Finanzas + Backend | Activa |
| RN-023 | Recarga de saldo por chofer | El chofer autenticado PUEDE recargar su propio saldo y debe registrarse movimiento `top_up`. | Operativa | Flujo de trabajo | Dinamica | Operaciones + Finanzas | Activa |
| RN-024 | Botones rápidos de recarga | La app de chofer DEBE ofrecer montos rápidos de recarga: S/10, S/20 y S/50. | Operativa | Flujo de trabajo | Dinamica | Producto | Activa |
| RN-025 | Generacion automatica de pago | SI un servicio pasa a `finished`, ENTONCES el sistema DEBE crear `Pago` pendiente por `totalPrice` si aun no existe. | Operativa | Calculo / Derivacion | Fija | Finanzas | Activa |
| RN-026 | Modelo sin payout automatico | SI un servicio pasa a `finished`, ENTONCES NO se genera payout automatico para chofer en el modelo de saldo prepago. | Operativa | Flujo de trabajo | Dinamica | Finanzas + Producto | Activa |
| RN-027 | Cancelacion por owner/admin | Solo el cliente dueño del servicio o un admin PUEDE cancelar el servicio. | Operativa | Autorizacion | Fija | Operaciones | Activa |
| RN-028 | Restriccion de cancelacion final | Un servicio en `finished` o `cancelled` NO DEBE volver a cancelarse. | Operativa | Validacion | Fija | Operaciones | Activa |
| RN-029 | Efecto de cancelacion | SI un servicio asignado se cancela, ENTONCES el chofer asociado DEBE volver a `available`. | Operativa | Flujo de trabajo | Fija | Operaciones | Activa |
| RN-030 | Pago marcado por admin | Solo admin PUEDE marcar un pago como `paid`; al hacerlo se registra `paidAt` y opcionalmente `method`. | Operativa | Autorizacion | Fija | Finanzas | Activa |
| RN-031 | Payout liquidado por admin | Solo admin PUEDE liquidar payout pendiente; al hacerlo `status=paid`, `paidAmount=accumulatedAmount`, `paidAt` y `periodEnd`. | Operativa | Autorizacion | Fija | Finanzas | Activa |
| RN-032 | Solicitud de alta de chofer unica por usuario | Un usuario NO DEBE registrar solicitud pendiente si ya tiene perfil de chofer activo o solicitud pendiente previa. | Operativa | Validacion | Fija | Operaciones | Activa |
| RN-033 | Validaciones documentales de alta | La solicitud de chofer DEBE tener DNI de 8 digitos, al menos una foto de brevete, PDF del CUL (Certificado Unico Laboral) y PDF del record de conductor MTC. | Operativa | Validacion | Fija | Cumplimiento + Operaciones | Activa |
| RN-034 | Unicidad de DNI en solicitudes activas | Un DNI NO DEBE existir en solicitudes de otro usuario con estado `pending` o `approved`. | Operativa | Validacion | Fija | Cumplimiento | Activa |
| RN-035 | Politica actual de aprobacion de chofer | SI una solicitud valida es enviada, ENTONCES hoy se aprueba automaticamente, se crea perfil `drivers` en `offline` y se cambia rol de usuario a `driver`. | Operativa | Flujo de trabajo | Dinamica | Operaciones + Producto | Activa |
| RN-036 | Validacion RENIEC | SI se consulta RENIEC, ENTONCES el DNI DEBE tener 8 digitos y DECOLECTA_API_KEY DEBE estar configurada. | Operativa | Integracion externa | Fija | Cumplimiento + Backend | Activa |
| RN-037 | Rol por defecto en registro | SI un usuario se registra por Password u OAuth Google, ENTONCES su rol inicial DEBE ser `client`. | Operativa | Flujo de trabajo | Fija | Producto | Activa |
| RN-038 | Politica de redirect OAuth | `redirectTo` en OAuth SOLO DEBE aceptar esquemas/hosts permitidos (`localhost`, `choferes://`, `exp://`, `exp+choferes://`). | Operativa | Autorizacion | Fija | Seguridad | Activa |
| RN-039 | Modelo de intermediacion | La plataforma actua como intermediaria del servicio; el cobro de comision de app no implica asuncion de responsabilidad operativa del traslado. | Estructural | Flujo de trabajo | Dinamica | Legal + Direccion | Activa |
| RN-040 | Recarga sin pasarela (flujo actual) | Mientras no exista pasarela integrada, la recarga es manual desde la app del chofer. | Operativa | Flujo de trabajo | Dinamica | Operaciones + Producto | Activa |
| RN-041 | Notificacion por oferta recibida | SI un chofer crea/actualiza oferta para un servicio pendiente, ENTONCES el cliente dueño DEBE recibir notificacion in-app. | Operativa | Flujo de trabajo | Dinamica | Producto | Activa |
| RN-042 | Notificacion de viaje confirmado al chofer | SI un servicio queda asignado por aceptacion de oferta o asignacion interna, ENTONCES el chofer DEBE recibir notificacion in-app de confirmacion. | Operativa | Flujo de trabajo | Dinamica | Operaciones | Activa |
| RN-043 | Notificacion de chofer confirmado al cliente | SI un servicio queda asignado, ENTONCES el cliente DEBE recibir notificacion in-app con confirmacion y codigo de inicio. | Operativa | Flujo de trabajo | Dinamica | Operaciones | Activa |
| RN-044 | Notificacion chofer en camino al punto | SI el chofer actualiza estado a `heading_to_pickup`, ENTONCES el cliente DEBE ser notificado. | Operativa | Flujo de trabajo | Dinamica | Operaciones | Activa |
| RN-045 | Notificacion chofer llego al punto | SI el chofer actualiza estado a `arrived_pickup`, ENTONCES el cliente DEBE ser notificado para compartir codigo de seguridad. | Operativa | Flujo de trabajo | Dinamica | Operaciones | Activa |
| RN-046 | Codigo obligatorio para iniciar viaje | SI el estado es `arrived_pickup`, ENTONCES el cambio a `in_progress` SOLO DEBE ocurrir validando `securityCode` compartido cliente/chofer. | Operativa | Validacion | Fija | Seguridad + Operaciones | Activa |
| RN-047 | Visibilidad interna de hitos en ruta | Los estados `in_progress` (sale con cliente) y `arrived_destination` (llega al destino) DEBEN verse en web interna para monitoreo operativo. | Operativa | Flujo de trabajo | Dinamica | Operaciones | Activa |
| RN-048 | Solicitud con punto de recojo y destino | Todo servicio DEBE registrar `origin` (punto de recojo) y `destination` (punto de destino). | Estructural | Validacion | Fija | Operaciones + Producto | Activa |
| RN-049 | Navegacion Waze hacia recojo | SI el chofer marca `heading_to_pickup`, ENTONCES la app de chofer DEBE abrir Waze con ruta al `origin` del servicio. | Operativa | Integracion externa | Dinamica | Operaciones | Activa |
| RN-050 | Inicio de viaje con control deslizante | El cambio de `arrived_pickup` a `in_progress` DEBE ejecutarse con control de confirmacion tipo slide y NO con boton de toque simple. | Operativa | Validacion | Fija | Seguridad + Producto | Activa |
| RN-051 | Navegacion Waze hacia destino al iniciar | SI el viaje pasa a `in_progress`, ENTONCES la app de chofer DEBE abrir Waze con ruta al `destination` del servicio. | Operativa | Integracion externa | Dinamica | Operaciones | Activa |
| RN-052 | Checklist pre-viaje obligatorio | Antes de iniciar viaje (`arrived_pickup` -> `in_progress`), el chofer DEBE completar checklist de estado vehicular y documentos. | Operativa | Validacion | Fija | Operaciones + Cumplimiento | Activa |
| RN-053 | Datos minimos de checklist | El checklist DEBE registrar como minimo: observaciones de abolladuras/estado, verificacion de `Tarjeta de Propiedad` y verificacion de `SOAT`. | Estructural | Validacion | Fija | Operaciones + Cumplimiento | Activa |
| RN-054 | Adelanto del 25% antes de salir | SI un servicio queda `assigned`, ENTONCES el cliente DEBE entregar al chofer un anticipo del 25% sobre `offeredPrice` antes de que el chofer pueda pasar a `heading_to_pickup`. | Operativa | Flujo de trabajo | Fija | Operaciones + Finanzas | Activa |
| RN-055 | Confirmacion de anticipo por chofer | SI el chofer recibe el anticipo, ENTONCES DEBE confirmarlo en la app (`confirmAdvanceReceived`) registrando `advanceConfirmedAt`. Sin esa confirmacion NO puede salir a recoger. | Operativa | Validacion | Fija | Operaciones | Activa |
| RN-056 | Saldo pendiente al finalizar | SI el servicio finaliza, ENTONCES el registro en `payments` DEBE ser por el saldo restante (`totalPrice - advanceAmount`), no por el total completo. | Operativa | Calculo / Derivacion | Fija | Finanzas | Activa |
| RN-057 | Tipo de viaje app | SI un cliente crea servicio desde la app movil, ENTONCES `serviceType=app` y `requestChannel=mobile_app`. | Operativa | Flujo de trabajo | Fija | Operaciones + Producto | Activa |
| RN-058 | Tipo de viaje premium web | SI un cliente crea servicio desde la web comercial, ENTONCES `serviceType=premium` y `requestChannel=web_comercial`. | Operativa | Flujo de trabajo | Fija | Operaciones + Producto | Activa |
| RN-059 | Tipo de viaje premium telefono | SI operaciones registra una solicitud telefonica, ENTONCES un admin DEBE crearla con `serviceType=premium` y `requestChannel=phone`. | Operativa | Flujo de trabajo | Fija | Operaciones | Activa |
| RN-060 | Visibilidad de tipo en tablero | El tablero admin DEBE distinguir visualmente viajes app vs premium e indicar el canal de solicitud. | Operativa | Flujo de trabajo | Dinamica | Operaciones | Activa |
| RN-061 | Promociones por region y fechas | Hercom DEBE poder activar promociones festivas segmentadas por departamento, provincia (opcional) y distrito (opcional), con rango de fechas. | Operativa | Flujo de trabajo | Dinamica | Operaciones + Marketing | Activa |
| RN-062 | Descuento absorbido por Hercom | SI aplica promocion, ENTONCES el descuento reduce lo que paga el cliente pero el chofer DEBE mantener su neto del 75% sobre la tarifa de lista ofertada. | Operativa | Calculo / Derivacion | Fija | Finanzas + Operaciones | Activa |
| RN-063 | Tope de descuento promocional | El descuento maximo DEBE ser 25% sobre la tarifa de lista; a ese tope la ganancia de Hercom es S/0 (ejemplo lista S/80). | Operativa | Validacion | Fija | Finanzas | Activa |
| RN-064 | Aplicacion automatica al crear servicio | SI existe promocion activa para la region del recojo y la fecha, ENTONCES el servicio DEBE registrar `catalogBasePrice`, `discountRate`, `promotionId` y `basePrice` con descuento. | Operativa | Flujo de trabajo | Fija | Backend + Operaciones | Activa |
| RN-065 | GPS y region en app movil | Al solicitar servicio desde la app movil, el cliente PUEDE usar GPS + geocodificacion inversa (Google Maps) para autocompletar direccion de origen, coordenadas y departamento/provincia/distrito; puede corregir la region manualmente. | Operativa | Flujo de trabajo | Dinamica | App movil + Operaciones | Activa |

---

## 5. Reglas estructurales (SBVR) detalladas

### 5.1 Reglas definicionales base

- Un `Usuario` es una entidad autenticada del sistema.
- Un `Chofer` es un `Usuario` con perfil en la tabla `drivers`.
- Un `Administrador` es un `Usuario` con `role = admin`.
- Un `Servicio` representa una solicitud de traslado.
- Un `Pago` representa la obligacion del cliente por un servicio finalizado.
- Un `Payout` representa el acumulado/liquidacion de comisiones del chofer.

### 5.2 Regla de derivacion financiera

- Tarifa horaria de referencia: S/40/hora.
- Contratacion minima del servicio: 2 horas.
- Tarifa base minima (`basePrice`): S/80 (= S/40 x 2).
- `advanceAmount = round(offeredPrice * 0.25, 2 decimales)` (anticipo cliente → chofer)
- `driverCommission = round(offeredPrice * 0.25, 2 decimales)` (comision de app)
- `totalPrice = offeredPrice` (tarifa acordada del servicio)
- Saldo pendiente al cierre: `totalPrice - advanceAmount`
- Promocion festiva (si aplica):
  - `clientPrice = listPrice * (1 - discountRate)`
  - `driverNet = listPrice * 0.75` (sin cambio para el chofer)
  - `platformCommission = max(clientPrice - driverNet, 0)`
  - `discountRate` maximo: 25%

---

## 6. Reglas operativas (SI/ENTONCES y DEBE/NO DEBE)

### 6.1 Flujo principal servicio -> ofertas -> saldo chofer -> pago

1. SI cliente crea servicio con tarifa base valida (>= S/80, equivalente a 2h x S/40/h), ENTONCES estado inicial es `pending`.
2. SI chofer disponible oferta tarifa (>= base), ENTONCES se registra oferta en `serviceOffers` y se notifica al cliente.
3. SI cliente acepta una oferta valida, ENTONCES servicio `assigned`, chofer `busy`, se genera `securityCode` y `advanceAmount` (25% de `offeredPrice`).
4. SI chofer confirma anticipo recibido, ENTONCES se registra `advanceConfirmedAt` y el chofer puede pasar a `heading_to_pickup`.
5. SI chofer sale a recoger, ENTONCES servicio `heading_to_pickup` y se notifica al cliente.
6. SI chofer llega al punto de partida, ENTONCES servicio `arrived_pickup` y se notifica al cliente.
7. SI chofer valida el `securityCode`, ENTONCES servicio `in_progress` (sale con cliente).
8. SI chofer llega al punto final, ENTONCES servicio `arrived_destination`.
9. SI chofer finaliza viaje, ENTONCES:
   - servicio `finished`
   - chofer `available`
   - `totalTrips + 1`
   - descontar comision de app del saldo del chofer
   - registrar movimiento `commission_debit`
   - crear pago pendiente (si no existia)
9. SI chofer recarga saldo desde la app, ENTONCES se registra movimiento `top_up`.

### 6.2 Restricciones clave

- Un usuario NO DEBE operar recursos sin autenticacion.
- Un chofer NO DEBE actualizar servicios ajenos.
- Un chofer NO DEBE ser asignado si su saldo no cubre la comision del servicio.
- Un servicio NO DEBE cancelarse si ya esta `finished` o `cancelled`.
- Un DNI NO DEBE repetirse en solicitudes activas de distintos usuarios.

### 6.3 Flujo del servicio (explicacion simple de negocio)

1. El cliente solicita un servicio indicando punto de recojo (`origin`), punto de destino (`destination`) y tarifa base (minimo S/80 = S/40/h x 2h).
2. Los choferes disponibles envian ofertas de tarifa (>= tarifa base indicada por el cliente).
3. El cliente elige una oferta y se confirma el chofer.
4. El cliente entrega al chofer el anticipo del 25% sobre la tarifa acordada.
5. El chofer confirma en la app que recibió el anticipo.
6. El chofer sale a recoger al cliente.
7. El chofer llega al punto de recojo y coordina con el cliente.
8. Se valida el inicio del viaje (codigo de seguridad y, en flujo extendido, checklist + slide).
9. El chofer traslada al cliente al destino.
10. El chofer confirma llegada y finaliza servicio.
11. El sistema descuenta comision, registra pago del saldo restante y actualiza estados/notificaciones.

### 6.4 Flujo operativo extendido implementado (Waze + slide + checklist)

1. Al pasar a `heading_to_pickup`, la app del chofer abre Waze hacia `origin`.
2. Al llegar al cliente (`arrived_pickup`), el chofer completa checklist pre-viaje:
   - estado del vehiculo (abolladuras u observaciones),
   - verificacion de Tarjeta de Propiedad,
   - verificacion de SOAT.
3. Para iniciar viaje, el chofer usa un control deslizante (slide) para evitar toque accidental.
4. Al iniciar (`in_progress`), la app abre Waze hacia `destination`.
5. Estas reglas se encuentran implementadas en backend y app movil de chofer.

---

## 7. Escenarios BDD (Gherkin) para reglas criticas

```gherkin
Caracteristica: Oferta y seleccion de chofer
  Escenario: Cliente acepta oferta de chofer para servicio pendiente
    Dado que existe un servicio en estado "pending"
    Y existe al menos una oferta de chofer disponible
    Y el chofer ofertante tiene saldo suficiente para cubrir la comision
    Cuando el cliente acepta una oferta
    Entonces el servicio cambia a "assigned"
    Y el chofer cambia a "busy"
```

```gherkin
Caracteristica: Finalizacion de servicio
  Escenario: Chofer finaliza servicio asignado
    Dado que el chofer tiene un servicio en estado "arrived_destination"
    Cuando el chofer actualiza el estado a "finished"
    Entonces el servicio queda en "finished"
    Y se descuenta la comision de app del saldo del chofer
    Y se registra un movimiento de tipo "commission_debit"
    Y se crea un pago pendiente para el cliente
```

```gherkin
Caracteristica: Alta de chofer
  Escenario: Solicitud valida de registro de chofer
    Dado que el usuario no tiene perfil de chofer activo
    Y no tiene solicitud pendiente
    Y el DNI tiene 8 digitos
    Y adjunta al menos una foto de brevete
    Cuando envia la solicitud
    Entonces la solicitud se registra
    Y se aprueba automaticamente (politica actual)
    Y el usuario pasa al rol "driver"
```

```gherkin
Caracteristica: Codigo de seguridad para iniciar viaje
  Escenario: Inicio de viaje con codigo valido
    Dado que el servicio esta en estado "arrived_pickup"
    Y existe un codigo de seguridad generado para el servicio
    Cuando el chofer valida el codigo correcto
    Entonces el servicio cambia a "in_progress"
```

```gherkin
Caracteristica: Notificaciones operativas
  Escenario: Cliente recibe notificacion cuando chofer sale a recogerlo
    Dado que el servicio esta en estado "assigned"
    Cuando el chofer actualiza el estado a "heading_to_pickup"
    Entonces el cliente recibe una notificacion de "chofer en camino"
```

```gherkin
Caracteristica: Navegacion asistida con Waze
  Escenario: Waze se abre al salir hacia recojo
    Dado que el chofer tiene un servicio en estado "assigned"
    Cuando el chofer marca estado "heading_to_pickup"
    Entonces la app abre Waze usando las coordenadas de "origin"
```

```gherkin
Caracteristica: Inicio de viaje seguro
  Escenario: Chofer inicia viaje con slide
    Dado que el servicio esta en estado "arrived_pickup"
    Y el chofer completo el checklist pre-viaje
    Cuando el chofer confirma el control deslizante de inicio
    Entonces el servicio cambia a "in_progress"
    Y la app abre Waze hacia "destination"
```

```gherkin
Caracteristica: Checklist vehicular en recojo
  Escenario: Registro obligatorio antes de iniciar viaje
    Dado que el chofer llego al punto de recojo
    Cuando intenta iniciar el viaje
    Entonces debe registrar observacion de estado vehicular
    Y confirmar Tarjeta de Propiedad
    Y confirmar SOAT
```

```gherkin
Caracteristica: Recarga de saldo
  Escenario: Chofer recarga su propio saldo
    Dado que el chofer esta autenticado
    Cuando el chofer recarga S/100 desde su app
    Entonces el saldo del chofer aumenta en S/100
    Y se registra un movimiento de tipo "top_up"
```

```gherkin
Caracteristica: Limite de saldo negativo
  Escenario: Chofer no puede pasar de S/-10
    Dado que el chofer tiene saldo en S/-10
    Cuando intenta ofertar un nuevo servicio
    Entonces el sistema rechaza la operacion y solicita recargar
```

```gherkin
Caracteristica: Regla de tarifa minima
  Escenario: Cliente intenta crear un servicio por debajo del minimo
    Dado que el cliente esta autenticado
    Cuando intenta crear un servicio con basePrice de S/50
    Entonces el sistema rechaza la solicitud por tarifa base minima (S/80)
```

```gherkin
Caracteristica: Anticipo del 25% antes de salir
  Escenario: Chofer no puede salir sin confirmar anticipo
    Dado que el servicio esta en estado assigned
    Y el chofer no ha confirmado el anticipo
    Cuando intenta pasar a heading_to_pickup
    Entonces el sistema rechaza la transicion
```

```gherkin
Caracteristica: Seguridad de acceso
  Escenario: Cliente ajeno intenta aceptar oferta de otro servicio
    Dado que existe un servicio pendiente
    Y ese servicio pertenece a otro cliente
    Cuando intenta aceptar una oferta de ese servicio
    Entonces la operacion es rechazada por autorizacion
```

---

## 8. Trazabilidad reglas -> implementacion

| ID Regla | Implementacion principal |
| --- | --- |
| RN-061, RN-062, RN-063, RN-064 | `packages/backend/convex/promotions.ts`, `packages/backend/convex/lib/pricing.ts`, `packages/backend/convex/lib/promotions.ts` |
| RN-009, RN-011, RN-015, RN-017 a RN-029, RN-046, RN-047, RN-054, RN-055, RN-056, RN-057, RN-058, RN-059 | `packages/backend/convex/services.ts` |
| RN-013, RN-014, RN-016, RN-041 a RN-043 | `packages/backend/convex/serviceOffers.ts` |
| RN-020 a RN-024 | `packages/backend/convex/driverWallets.ts` + `apps/mobile/src/screens/DriverDashboard.tsx` |
| RN-041 a RN-045 | `packages/backend/convex/notifications.ts` + paneles de cliente/chofer |
| RN-048 | `packages/backend/convex/schema.ts` (`services.origin`, `services.destination`) + `packages/backend/convex/services.ts` (`createService`) |
| RN-049, RN-051 | `apps/mobile/src/components/ServiceCard.tsx` (`openWazeNavigation`) |
| RN-050 | `apps/mobile/src/components/ServiceCard.tsx` + `apps/mobile/src/components/SlideToConfirm.tsx` |
| RN-052, RN-053 | `packages/backend/convex/schema.ts` (`serviceVehicleChecklists`), `packages/backend/convex/serviceChecklists.ts`, `packages/backend/convex/services.ts` (`startTripWithCode`) |
| RN-030 | `packages/backend/convex/payments.ts` -> `markPaid` |
| RN-031 | `packages/backend/convex/payouts.ts` -> `markPaid` |
| RN-032 a RN-035 | `packages/backend/convex/driverApplications.ts` -> `submit` |
| RN-036 | `packages/backend/convex/reniec.ts` -> `lookupDni` |
| RN-037, RN-038 | `packages/backend/convex/auth.ts` |
| RN-010, RN-018, RN-027 | `packages/backend/convex/lib/auth.ts` |
| RN-039, RN-040 | Regla de negocio documental (sin enforcement tecnico automatico) |

---

## 9. Vinculo con diccionario de datos

Recomendacion de mantenimiento:

- En `docs/2 DICCIONARIO DATOS.md`, agregar en cada campo sensible una nota con ID de regla.
- Ejemplos:
  - `services.totalPrice` -> RN-011, RN-009
  - `services.status` -> RN-002, RN-012, RN-017
  - `services.basePrice` -> RN-011
  - `services.offeredPrice` -> RN-009, RN-013
  - `services.securityCode` -> RN-016, RN-046
  - `services.driverCommission` -> RN-009, RN-020
  - `notifications.type` -> RN-041, RN-042, RN-043, RN-044, RN-045
  - `services.origin`, `services.destination` -> RN-048, RN-049, RN-051
  - `serviceVehicleChecklists.*` (tabla propuesta) -> RN-052, RN-053
  - `serviceOffers.offeredPrice` -> RN-013, RN-015
  - `driverWallets.balance` -> RN-021, RN-023
  - `walletTransactions.type` -> RN-022, RN-023, RN-024
  - `payments.status` -> RN-004, RN-025, RN-030
  - `payouts.accumulatedAmount` -> RN-031 (uso legacy/manual)
  - `driverApplications.dni` -> RN-033, RN-034, RN-036

---

## 10. Mapa tecnico (tablas/campos y archivos involucrados)

### 10.1 Tablas y campos actuales del flujo de servicio

- `services`:
  - identidad/relaciones: `clientId`, `driverId`
  - ruta: `origin.address`, `origin.lat`, `origin.lng`, `destination.address`, `destination.lat`, `destination.lng`
  - negocio precio: `basePrice` (min. S/80), `offeredPrice`, `advanceAmount`, `advanceConfirmedAt`, `totalPrice`, `driverCommission`
  - clasificacion: `serviceType`, `requestChannel`
  - promocion: `catalogBasePrice`, `discountRate`, `promotionId`, `promotionName`
  - seguridad/estado: `securityCode`, `status`
  - tiempos: `requestedAt`, `assignedAt`, `headingToPickupAt`, `arrivedPickupAt`, `departedWithClientAt`, `arrivedDestinationAt`, `finishedAt`, `cancelledAt`
- `serviceOffers`: `serviceId`, `driverId`, `offeredPrice`, `status`, `createdAt`, `respondedAt`
- `notifications`: `userId`, `type`, `title`, `message`, `serviceId`, `readAt`, `createdAt`
- `drivers`: `status`, `vehicle.plate`, `totalTrips`
- `driverWallets` y `walletTransactions`: saldo, recargas y descuentos de comision
- `payments`: `serviceId`, `clientId`, `amount`, `status`, `paidAt`

### 10.2 Funciones y archivos actuales que participan

- Backend Convex:
  - `packages/backend/convex/services.ts`
    - `createService()`: crea solicitud (app o premium segun canal)
    - `createPremiumServiceAsAdmin()`: registro premium por admin (telefono/web manual)
    - `confirmAdvanceReceived()`: chofer confirma anticipo del 25%
    - `updateStatus()`: transiciones operativas del chofer (exige anticipo confirmado para salir)
    - `startTripWithCode()`: inicio con codigo de seguridad
    - `cancelService()`: cancelacion por cliente/admin
  - `packages/backend/convex/serviceOffers.ts`
    - `submitMyOffer()`, `acceptOffer()`, `listForServiceAsClient()`, `listMine()`
  - `packages/backend/convex/notifications.ts`
    - `createNotification()` (helper), `listMine()`, `markAsRead()`, `markAllAsRead()`
  - `packages/backend/convex/schema.ts`: contratos de tablas/validadores
  - `packages/backend/convex/promotions.ts`: CRUD promociones + catalogo Peru
  - `packages/backend/convex/lib/pricing.ts`: reparto cliente/chofer/Hercom con descuento
- Mobile:
  - `apps/mobile/src/components/ServiceCard.tsx`: confirmacion de anticipo y acciones operativas del chofer por estado
  - `apps/mobile/src/screens/DriverDashboard.tsx`: viajes activos y panel operativo chofer
  - `apps/mobile/src/screens/ClientDashboard.tsx`: solicitud y seguimiento del servicio
- Web:
  - `apps/web-admin/src/components/ServicesBoard.tsx`: monitoreo interno de estados, anticipo y tipo de viaje
  - `apps/web-admin/src/components/PromotionsPanel.tsx`: promociones festivas por region
  - `apps/web-comercial/src/components/MyServices.tsx`: seguimiento cliente
  - `apps/web-comercial/src/components/NotificationsPanel.tsx`: notificaciones cliente

### 10.3 Campos/artefactos del flujo extendido implementado

- Tabla implementada: `serviceVehicleChecklists`
  - `serviceId`, `driverId`
  - `phase` (`pickup`)
  - `hasVehicleDamage` + `damageNotes` (abolladuras/observaciones)
  - `hasPropertyCard` (boolean)
  - `hasSoat` (boolean)
  - `checkedAt`, `updatedAt`
- UI objetivo:
  - control deslizante para iniciar viaje (reemplaza boton de toque)
  - deep links a Waze para recojo y destino

### 10.4 Documento tecnico complementario

- Para el detalle end-to-end de implementacion (archivos frontend, metodos backend, tablas y flujo completo desde login hasta cierre), ver:
  - `docs/3 FLUJO TECNICO LOGIN VIAJE CIERRE.md`

## 11. Gobernanza y cambio

- Owner funcional sugerido: Operaciones + Administracion.
- Owner tecnico sugerido: Backend/Convex.
- Frecuencia de revision: por release o cambio de flujo.
- Todo cambio de regla DEBE:
  1. actualizar este BRD,
  2. actualizar casos de prueba (BDD o unitarios),
  3. mantener trazabilidad con IDs RN.
