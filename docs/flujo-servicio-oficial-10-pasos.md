# Flujo oficial de servicio — 10 pasos

Documento de referencia para QA, operaciones y producto. Sustituye recuentos anteriores de 12–14 pasos: **este es el flujo oficial (10 pasos)**.

**Apps:** cliente y chofer → `apps/mobile` · **Panel interno** → `apps/web-admin` ([producción](https://hercom-web-admin-opal.vercel.app))

**Estados técnicos** en Convex (`services.status`): ver columna *Estado BD*.

---

## Resumen en una tabla

| # | Paso (oficial) | Cliente | Chofer | Web interna | Estado BD (principal) |
| --- | --- | --- | --- | --- | --- |
| **1** | Solicitud de servicio | Confirma ruta, horas y tarifa base (`ClientDashboard` / `HomeRequestSheet`) | Ve solicitudes en **Lista** solo si cumple requisitos (abajo) | Tablero **Pendiente** (`ServicesView`) | `pending` |
| **2** | Oferta del chofer | — | Envía monto (`DriverRequestsTab` → `submitMyOffer`) | Ofertas implícitas en pendiente | `pending` + fila en `serviceOffers` |
| **3** | Cliente elige | Acepta una oferta (`DriverOfferModal`) | Espera asignación | **Asignado** | `assigned` |
| **4** | Cliente anticipa | Transfiere 25% (`AdvancePayoutModal`) | Confirma recepción (`ServiceCard`) | Columna **Anticipo** ✓ | `assigned` + `advanceConfirmedAt` |
| **5** | Chofer sale | Notificación “salió a recogerte” | **Voy a recoger** (`ServiceCard`) | **Yendo a recoger** + mapa | `heading_to_pickup` |
| **6** | Chofer llega **o** cliente cancela | Ve “en el punto” / puede **cancelar** mientras aplique | **Llegué al recojo** **o** flujo cancelado | Llegó al punto / Cancelado | `arrived_pickup` **o** `cancelled` |
| **7** | Código + checklist | Muestra **código** al chofer | **1.** Valida código **2.** Checklist recojo (`ChecklistRecojoScreen`) | Código visible en tablero | `arrived_pickup` → validación → checklist |
| **8** | Inicio del servicio | Viaje en curso, mapa, compartir (tras inicio) | Deslizar **Iniciar viaje** (`startTripWithCode`) | **En viaje** + GPS / mapa | `in_progress` |
| **9** | Cada extensión de servicio | Notificación de extensión | **Extender** horas (`extendService`) | Horas / `extendedAt` en detalle | `in_progress` (más horas) |
| **10** | Término del servicio | Valora chofer | Finaliza → **Ingresos** + valora cliente | **Finalizado** + ruta archivada (mapa / GeoJSON) | `finished` |

---

## Paso 1 — ¿Choferes “activos” para ver la lista?

**Sí, con matices.** En la app el chofer debe estar en estado **Disponible** (`drivers.status === "available"`):

| Requisito | Dónde se aplica |
| --- | --- |
| Estado **Disponible** (no `offline` ni `busy`) | App: no consulta la lista si no está `available` (`DriverDashboard.tsx`). Backend al **ofertar**: `submitMyOffer` exige `available`. |
| **Sin viaje activo** | App: `hasActiveService` → no carga `listOpenForOffers`. |
| **GPS** del chofer | App: pestaña Servicio/Lista con ubicación; sin coords la lista viene vacía (`listOpenForOffers`). |
| **Radio** de ofertas | Servicios `pending` dentro del radio configurado y TTL (~2 h). |
| **Créditos de viaje** prepagados | Sin saldo no puede ofertar (mensaje en UI). |
| **Yape o Plin** cargados | Obligatorio para ofertar y para asignación admin. |

**Nota:** La query `listOpenForOffers` no filtra por `available` en servidor; la app **no la llama** si el chofer no está disponible. Ofertar sí está bloqueado en backend.

**Cliente (paso 1):** solicitud queda `pending` hasta que un chofer gane con oferta + aceptación (pasos 2–3) o expire / cancele.

---

## Detalle por paso

### 1 — Solicitud de servicio
- Cliente autenticado, selfie/identidad según reglas de negocio.
- Default operativo habitual: **2 h · S/80** (mercado PE).
- Paradas extra opcionales en origen/destino.

### 2 — Oferta
- Una oferta **pending** por chofer y servicio.
- Precio dentro de límites (`offerLimits`).

### 3 — Cliente elige
- Al aceptar: se genera **código de seguridad**, precios finales, chofer pasa a `busy`.

### 4 — Anticipo 25%
- Chofer **no** puede “salir a recoger” (paso 5) sin `advanceConfirmedAt`.

### 5 — Chofer sale
- Se crea tracking (`serviceTracking`) para mapa admin; GPS público del chofer recién tras **inicio** (paso 8).

### 6 — Llegada o cancelación
- Camino feliz: `arrived_pickup`.
- Cancelación cliente/staff según reglas → `cancelled` (no confundir con `unattended` por TTL sin chofer).

### 7 — Código + checklist
- Orden en app: **código primero**, luego **checklist** de recojo, luego acción de iniciar.
- Mutación: `startTripWithCode` (requiere checklist completado según implementación en `ServiceCard`).

### 8 — Inicio del servicio
- Estado `in_progress`.
- GPS en vivo, compartir viaje, rastro en mapa admin.

### 9 — Extensiones
- Cada extensión: mutación `extendService` (horas + `extendedAt[]`).
- Puede repetirse **una vez por cada extensión** acordada en viaje.

### 10 — Término
- Chofer: `updateStatus` → `finished`; billetera (débito viaje), chofer `available`, pago cliente.
- Ruta GPS archivada 90 días (`serviceRouteArchives`) + reproducción en panel admin.
- Valoraciones mutuas (cliente / chofer).

---

## Fuera del flujo (no cuenta como paso)

| Tema | Comportamiento |
| --- | --- |
| FAB **Ayuda / emergencia** | Waze / teléfono; no cambia estado del servicio. |
| Chat **Soporte** | Hilo aparte (`supportThreads`). |
| Premium / teléfono | Alta desde panel (vistas no enlazadas al menú principal). |

---

## Documentos relacionados

- UI por pantalla: [`3-flujos-ui.md`](./3-flujos-ui.md)
- Solicitud cliente: [`flujo-solicitud-servicio-cliente.md`](./flujo-solicitud-servicio-cliente.md)
- Panel interno: [`4 RESUMEN FLUJO ATENCION.md`](./4%20RESUMEN%20FLUJO%20ATENCION.md)
- Checklist recojo: [`checklist-recojo-vistas.md`](./checklist-recojo-vistas.md)
