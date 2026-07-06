# Web admin — panel interno

Panel de operaciones Hercom (`apps/web-admin`). Acceso solo rol **admin**.

## Cómo levantarlo

```powershell
# Terminal 1
pnpm --filter @proyecto/backend dev

# Terminal 2
pnpm web:admin
```

Abrir http://localhost:5174 · cuenta demo: `admin@demo.com` / `demo1234`

## Producción (Vercel + Convex)

| | |
| --- | --- |
| URL panel | https://admin.hercom.pe (temporal: https://hercom-web-admin.vercel.app) |
| Convex prod | `https://wry-lapwing-809.convex.cloud` |
| Convex dev (local) | `https://hip-mink-145.convex.cloud` |
| Demo prod | `admin@demo.com` / `demo1234` (requiere `seed:seedDemo --prod` + `@convex-dev/auth --prod`) |

Guía paso a paso: [`docs/6 DEPLOY ADMIN VERCEL.md`](6%20DEPLOY%20ADMIN%20VERCEL.md)

---

## Navegación

Menú superior con cinco secciones (una vista por pestaña):

| Sección | Contenido |
| --- | --- |
| **Cuentas** | Usuarios registrados y cambio de rol |
| **Recargas** | Recargas de billetera de choferes |
| **Servicios** | Tablero de viajes + pagos y comisiones pendientes |
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

**Choferes:** botón *Ver brevete y CUL* abre el expediente con DNI (RENIEC), categoría y número de brevete, fotos del brevete y enlace al PDF del CUL para evaluación.

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
| Estado | pending → finished / cancelled |
| Tipo | App o premium |
| Canal | App móvil, web comercial, teléfono |

Incluye **pagos pendientes** y **comisiones pendientes**.

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
| `driverApplications.listForAdmin` | `status` (expediente chofer + URLs brevete/CUL) |
| `services.listAllForAdmin` | estado, tipo, canal, región |
| `driverWallets.listTopUpsForAdmin` | periodo |

Helper: `packages/backend/convex/lib/regionFilters.ts`
