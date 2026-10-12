# Web admin — panel interno

Panel de operaciones Hercom (`apps/web-admin`). Acceso solo rol **admin**.

## Cómo levantarlo

```powershell
# Apps apuntan a Convex producción (un solo ambiente por ahora)
pnpm web:admin
```

Abrir http://localhost:5174 · cuenta demo: `admin@demo.com` / `demo1234`

## Producción (Vercel + Convex)

| | |
| --- | --- |
| URL panel | https://hercom-web-admin-opal.vercel.app/ (dominio: `admin.hercom.pe` cuando esté) |
| Convex | `https://lovable-kudu-343.convex.cloud` (**único ambiente** hasta Play Store) |
| Demo | `admin@demo.com` / `demo1234` |

> No hay ambiente de prueba activo. Preview Vercel / Convex de prueba = después de Play Store.

Guía paso a paso: [`docs/6 DEPLOY ADMIN VERCEL.md`](6%20DEPLOY%20ADMIN%20VERCEL.md)

---

## Navegación

Menú superior con cinco secciones (una vista por pestaña):

| Sección | Contenido |
| --- | --- |
| **Cuentas** | Usuarios registrados y cambio de rol |
| **Recargas** | Recargas de billetera de choferes |
| **Servicios** | Tablero de viajes, mapa en vivo y cierre de pagos |
| **Ingresos** | Totales por fecha (Lima) y estado del servicio |
| **Promociones** | Alta y listado de campañas festivas |
| **Viajes premium** | Registro manual (teléfono/web) + listado premium |

Archivos principales:

- `apps/web-admin/src/App.tsx` — layout y routing por pestaña
- `apps/web-admin/src/components/AdminNav.tsx` — menú
- `apps/web-admin/src/components/AdminRegionFilters.tsx` — filtros dept/prov/distrito
- `apps/web-admin/src/views/*.tsx` — cada sección

---

## Filtros por vista

En todas las vistas hay bloque **Filtros de región**: departamento, provincia (opcional), distrito (opcional). Sin departamento = todo el Perú.

### Cuentas

| Filtro | Uso |
| --- | --- |
| Región | Clientes y choferes con servicios en esa zona |
| Rol | Cliente, chofer o admin |
| Expediente | Estado del registro chofer: pendiente / aprobado / rechazado |
| Búsqueda | Nombre, correo o teléfono |

**Choferes:** *Ver registro* abre el expediente: DNI, brevete, fotos, PDF del CUL ([gob.pe](https://www.gob.pe/47089-obtener-tu-certificado-unico-laboral-cul)) y PDF del récord de conductor ([MTC](https://recordconductor.mtc.gob.pe/)).

### Recargas

| Filtro | Uso |
| --- | --- |
| Región | Choferes con servicios en esa zona |
| Periodo | Hoy, 7 días, 30 días o todo |
| Estado chofer | Disponible, ocupado, offline |
| Búsqueda | Nombre, correo o placa |

### Servicios

| Filtro | Uso |
| --- | --- |
| Región | Origen del recojo |
| Estado | pending → finished; cierres: **No atendido** o **Cancelado** (ver abajo) |
| Tipo | App o premium |
| Canal | App móvil, web comercial, teléfono |

Incluye **pagos pendientes** y **comisiones pendientes**.

#### Columnas del listado (tabla Convex `services`)

Todos los datos vienen de la query `services.listAllForAdmin` (documentos en la tabla **`services`**).

| Columna en pantalla | Campo(s) en BD | Significado |
| --- | --- | --- |
| **Fecha y hora** | `requestedAt` (fallback `_creationTime`) | Cuándo el cliente (o admin) creó la solicitud (hora Lima). |
| **Producto** (badge) | `serviceType` | **Tipo comercial** — cómo se opera el viaje. Solo **2** valores: `app` (autoservicio, cliente en móvil) y `premium` (gestionado por operaciones). Default si falta: `app`. |
| **Canal:** (debajo del badge) | `requestChannel` | **Por dónde se registró** la solicitud. **3** valores: `mobile_app`, `web_comercial`, `phone`. Default: `mobile_app`. |
| **Región recojo** | `origin.department`, `origin.province`, `origin.district` | Zona administrativa del **punto de recojo**, no del destino. |
| **Origen (De)** | `origin.address` | Dirección textual del recojo (+ lat/lng en mapa). |
| **Destino (A)** | `destination.address` | Dirección textual del destino. |
| **Promo** | `promotionName` | Campaña festiva aplicada al precio, si hubo. |
| **Total** | `totalPrice` | Lo que paga el cliente (con promo si aplica). |
| **Comisión** | `driverCommission` | Comisión de plataforma descontada al chofer. |
| **Anticipo** | `advanceAmount`, `advanceConfirmedAt` | 25% sobre oferta; ✓ si el cliente confirmó pago. |
| **Estado** | `status`, `closureReason` | Ciclo del viaje. **`unattended`** = No atendido en BD; **`cancelled`** = cancelado por persona. |
| **Cód. inicio** | `securityCode` | PIN de **4 dígitos** generado al asignar chofer o aceptar oferta; cliente y chofer lo usan en la app para **arrancar el viaje**. Vacío (`—`) mientras el servicio está `pending` sin confirmación. Clic en origen/destino abre modal con direcciones completas. |

**Tipo vs canal (resumen):**

- **Tipo (`serviceType`)** = categoría de negocio: viaje normal de app vs viaje **premium** (teléfono/web, a menudo cargado por admin).
- **Canal (`requestChannel`)** = dispositivo o medio del **registro**: app móvil del cliente, formulario web comercial, o llamada telefónica (admin).

Combinaciones habituales:

| Tipo | Canal | Quién lo crea |
| --- | --- | --- |
| `app` | `mobile_app` | Cliente en APK |
| `premium` | `phone` | Admin en panel (premium) |
| `premium` | `web_comercial` | Web comercial / admin |

Etiquetas en UI: `apps/web-admin/src/lib/serviceLabels.ts`. Esquema: `packages/backend/convex/schema.ts` (`serviceTypeValidator`, `serviceRequestChannelValidator`).

#### No atendido vs Cancelado (métrica gerencial)

| Etiqueta en panel | `status` en BD | Cuándo |
| --- | --- | --- |
| **No atendido** | `unattended` | Cron `expireStalePending`: `pending` superó **2 h** sin chofer. |
| **Cancelado** | `cancelled` | Cliente (`cancelService`) o staff (`updateStatus` / admin). Detalle opcional en `closureReason`: `cancelled_by_client` / `cancelled_by_staff`. |

Registros legacy `cancelled` sin chofer: migrar con `internal/services:backfillUnattendedStatus`.

Filtros **Servicios** / **Ingresos**: estado `unattended` o `cancelled`. Ingresos: tarjetas `unattendedTrips` y `cancelledTrips`.

Lógica compartida: `packages/backend/convex/lib/serviceClosure.ts` (export `@proyecto/backend/serviceClosure`).

### Promociones

| Filtro | Uso |
| --- | --- |
| Región | Ámbito de la promoción |
| Estado | Activas / inactivas |
| Búsqueda | Nombre o festividad |

### Viajes premium

| Filtro | Uso |
| --- | --- |
| Región | Recojo del viaje |
| Canal | Teléfono o web comercial |
| Estado | Estado del servicio |

---

## Backend

| Query | Filtros |
| --- | --- |
| `users.listAll` | `role` |
| `driverApplications.listForAdmin` | `status` (expediente: brevete, CUL, récord MTC) |
| `services.listAllForAdmin` | estado, tipo, canal, región |
| `driverWallets.listTopUpsForAdmin` | periodo |

Helper: `packages/backend/convex/lib/regionFilters.ts`
