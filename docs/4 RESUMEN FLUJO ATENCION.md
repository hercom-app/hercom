# Resumen del flujo de atención — web interna

Revisión del panel `apps/web-admin` y cómo se conecta con la app.
Los **3 flujos UI** (inscripción, recarga, servicio) están en [`3-flujos-ui.md`](./3-flujos-ui.md).

Login: `SignInForm.tsx`. Sin rol `admin` / `superadmin` no entra.

| Rol | Qué ve |
| --- | --- |
| Superadmin | Todo el menú |
| Admin zonal | Solo Choferes, Servicios, Clientes, Soporte (filtrado por distrito) |

---

## Inventario del menú

| Sección | Archivo | Qué hace |
| --- | --- | --- |
| Choferes | `DriversView.tsx` + `DriverDossierPanel.tsx` | Solicitudes de alta, DNI/RENIEC, brevete, CUL, récord; **Aprobar / Rechazar** |
| Servicios | `ServicesView.tsx` | Tablero de viajes, **En ruta ahora**, mapa en vivo, anticipo, código, pagos |
| Recargas | `TopUpsView.tsx` | Recargas de wallet que el chofer hizo en la app |
| Promociones | `PromotionsView.tsx` | Campañas por región (descuento lo absorbe Hercom) |
| Moneda y tipo de cambio | `MarketsView.tsx` | Tarifa/hora, mínimo de horas, comisión, FX |
| Clientes | `AccountsView.tsx` (`audience=clients`) | Usuarios de la app |
| Cuentas de usuario | `AccountsView.tsx` (`audience=staff`) | Admins internos |
| Soporte | `SupportView.tsx` | Chat de **Ayuda** de la app (no es el FAB de emergencia) |

Código que **existe y no está en el menú**: `PremiumTripsView.tsx` (alta premium/teléfono) e `IncomeView.tsx`.

---

## 1. Inscripción del chofer

| Momento | Chofer (app) | Web interna |
| --- | --- | --- |
| **Inscripción** | `DriverRegisterScreen.tsx` | Choferes → fila + expediente `DriverDossierPanel.tsx` |
| **Revisión** | `DriverApplicationPendingScreen.tsx` | **Aprobar** (crea perfil `drivers`) o **Rechazar** |

Al enviar el alta hoy la app vuelve a Home; la pantalla de “expediente enviado” no se abre.

---

## 2. Recarga de saldo del chofer

| Momento | Chofer (app) | Web interna |
| --- | --- | --- |
| **Recarga** | `DriverDashboard.tsx` (menú Recargar saldo) | Recargas `TopUpsView.tsx` |

Sin saldo suficiente el chofer no oferta (comisión 25%, piso S/-10).

---

## 3. Flujo de servicio (momento · cliente · chofer · web interna)

| Momento | Cliente | Chofer | Web interna |
| --- | --- | --- | --- |
| **Pedir viaje** | `ClientDashboard.tsx` | — | Servicios · Pendiente `ServicesBoard.tsx` |
| **Entregar oferta** | `ClientDashboard.tsx` | `DriverDashboard.tsx` | Tablero · Pendiente |
| **Aceptar oferta** | `DriverOfferModal.tsx` | `DriverDashboard.tsx` | Tablero · Asignado + código 4 dígitos |
| **Adelanto** | `AdvancePayoutModal.tsx` | `ServiceCard.tsx` | Columna Anticipo (✓ al confirmar) |
| **Salida del chofer** | `ClientDashboard.tsx` | `ServiceCard.tsx` | Estado *Yendo a recoger* + **En ruta ahora** |
| **Llegada del chofer** | `ClientDashboard.tsx` | `ServiceCard.tsx` | Estado *Llegó al punto* |
| **Checklist** | — | `ChecklistRecojoScreen.tsx` | — (no hay vista) |
| **Inicio de viaje** | `LiveTripMapModal.tsx` | `ServiceCard.tsx` | *En viaje* + mapa `ServiceLivePanel.tsx` |
| **Fin de viaje** | `RateServiceStars.tsx` | `ServiceCard.tsx` | *Finalizado* + `PaymentsPanel.tsx` + `PayoutsPanel.tsx` |
| **Compartir viaje** | `LiveTripMapModal.tsx` (Compartir) | `LiveTripMapModal.tsx` | Mapa admin + token `/live/{token}` |
| **Emergencia** | `HelpFab.tsx` | `HelpFab.tsx` | — (no llega al panel) |
| **Ayuda (chat)** | `SupportChatScreen.tsx` | `SupportChatScreen.tsx` | Soporte `SupportView.tsx` |

Estados: `pending` → `assigned` → *(anticipo)* → `heading_to_pickup` → `arrived_pickup` → `in_progress` → `arrived_destination` → `finished`. También `cancelled`.

---

## Compartir viaje — tres superficies del mismo GPS

Desde `heading_to_pickup` la app publica `serviceTracking` (token `shareToken`).

| Quién | Dónde se abre | Archivo |
| --- | --- | --- |
| Cliente / chofer en la app | Modal **Viaje en vivo** + botón Compartir | `LiveTripMapModal.tsx` |
| Familiar / cualquiera con el link | Landing **pública** | `apps/landing-page/app/live/[token]/page.tsx` |
| Operaciones | Panel **Servicios** → En ruta ahora o **Ver mapa** | `ServiceLivePanel.tsx` |

URL que arma la app (`liveShareUrl.ts`):

- Web: `{EXPO_PUBLIC_LIVE_SHARE_BASE_URL}/live/{token}`  
  fallback: `https://hercom-landing.vercel.app/live/{token}`  
  prod objetivo: `https://www.hercom.pe/live/{token}`
- Deep link de app: `choferes://live/{token}` (`LiveShareLinkListener.tsx`)

El admin **no necesita el link** para ver el mapa: usa `serviceTracking.getForAdmin` sobre el `serviceId`. El panel muestra el path comercial `/live/{token}` para copiarlo.

---

## Emergencia vs soporte (no es lo mismo)

| | Emergencia (FAB AYUDA) | Ayuda del menú ☰ |
| --- | --- | --- |
| Archivo app | `HelpFab.tsx` | `SupportChatScreen.tsx` |
| Qué hace | Llama **105** (policía) o Waze a hospital/clínica cerca (Places) | Chat con operaciones |
| ¿Web interna? | **No.** No hay ticket ni vista admin | **Sí.** `SupportView.tsx` |

---

## Dinero al cerrar (lo que opera el panel)

Al `finished`: comisión 25% debitada del wallet del chofer; queda **saldo restante** del cliente (`totalPrice - advanceAmount`) en `payments` pendiente.

En **Servicios** (solo superadmin):

- `PaymentsPanel.tsx` — marcar pago del cliente
- `PayoutsPanel.tsx` — marcar comisión liquidada

No hay pasarela: el marcado es manual.

---

## Notificaciones (app; el admin no las envía a mano)

| Momento | Quién recibe |
| --- | --- |
| Oferta nueva o actualizada | Cliente |
| Cliente confirma chofer | Chofer y cliente (código + monto de anticipo) |
| Chofer confirma anticipo | Cliente |
| Chofer sale a recoger | Cliente |
| Chofer llega al recojo | Cliente |

`arrived_destination` y `finished` no disparan aviso al cliente; se ven en el tablero.

---

## Valoración

Solo en `finished`, una vez, dueño del servicio: `RateServiceStars.tsx` → `serviceRatings.rateService` → promedio en `drivers.rating`. La web interna no tiene pantalla de valoraciones.
