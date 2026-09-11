# Tres flujos UI

1. Inscripción del chofer — app chofer ↔ web interna  
2. Recarga de saldo — app chofer ↔ web interna  
3. Servicio — momento · cliente · chofer · web interna  

Móvil: `apps/mobile/src/` · Admin: `apps/web-admin/src/`

---

## 1. Inscripción del chofer

| Momento | Chofer (app) | Web interna |
| --- | --- | --- |
| **Inscripción** | Alta conductor<br>`DriverRegisterScreen.tsx` | Lista + expediente<br>`DriversView.tsx`<br>`DriverDossierPanel.tsx` |
| **Revisión** | Expediente enviado<br>`DriverApplicationPendingScreen.tsx` | Aprobar / Rechazar<br>`DriverDossierPanel.tsx` |

`DriverApplicationPendingScreen.tsx` existe; al enviar el alta hoy la app vuelve a Home y no la abre.

---

## 2. Recarga de saldo del chofer

| Momento | Chofer (app) | Web interna |
| --- | --- | --- |
| **Recarga** | Recargar saldo<br>`DriverDashboard.tsx` | Recargas de billetera<br>`TopUpsView.tsx` |

---

## 3. Flujo de servicio

| Momento | Cliente | Chofer | Web interna |
| --- | --- | --- | --- |
| **Pedir viaje** | Pedir servicio<br>`ClientDashboard.tsx` | — | Tablero · Pendiente<br>`ServicesView.tsx`<br>`ServicesBoard.tsx` |
| **Entregar oferta** | Ofertas recibidas<br>`ClientDashboard.tsx` | Solicitudes abiertas<br>`DriverDashboard.tsx` | Tablero · Pendiente<br>`ServicesBoard.tsx` |
| **Aceptar oferta** | Aceptar chofer<br>`DriverOfferModal.tsx` | Espera asignación<br>`DriverDashboard.tsx` | Tablero · Asignado<br>`ServicesBoard.tsx` |
| **Adelanto** | Transferir 25%<br>`AdvancePayoutModal.tsx` | Confirmar anticipo<br>`ServiceCard.tsx` | Columna Anticipo<br>`ServicesBoard.tsx` |
| **Salida del chofer** | Chofer en camino<br>`ClientDashboard.tsx` | Voy a recoger<br>`ServiceCard.tsx` | Tablero · Yendo a recoger + mapa<br>`ServicesBoard.tsx`<br>`ServiceLivePanel.tsx` |
| **Llegada del chofer** | Chofer en el punto<br>`ClientDashboard.tsx` | Llegué al recojo<br>`ServiceCard.tsx` | Tablero · Llegó al punto<br>`ServicesBoard.tsx` |
| **Checklist** | — | Checklist de recojo<br>`ChecklistRecojoScreen.tsx` | — |
| **Inicio de viaje** | Viaje en vivo<br>`LiveTripMapModal.tsx` | Código e iniciar<br>`ServiceCard.tsx` | Tablero · En viaje + mapa<br>`ServicesBoard.tsx`<br>`ServiceLivePanel.tsx` |
| **Fin de viaje** | Calificar<br>`RateServiceStars.tsx` | Finalizar viaje<br>`ServiceCard.tsx` | Tablero · Finalizado<br>`ServicesBoard.tsx`<br>`PaymentsPanel.tsx`<br>`PayoutsPanel.tsx` |
| **Compartir viaje** | Viaje en vivo · Compartir<br>`LiveTripMapModal.tsx` | Viaje en vivo · Compartir<br>`LiveTripMapModal.tsx` | Mapa admin + `/live/{token}`<br>`ServiceLivePanel.tsx`<br>Landing `app/live/[token]/page.tsx` |
| **Emergencia** | FAB AYUDA<br>`HelpFab.tsx` | FAB AYUDA<br>`HelpFab.tsx` | — (105 / hospital; no llega al panel) |
| **Ayuda (chat)** | Chat<br>`SupportChatScreen.tsx` | Chat<br>`SupportChatScreen.tsx` | Soporte<br>`SupportView.tsx` |

`ServiceCard.tsx` se ve dentro de `DriverDashboard.tsx`.  
El checklist de recojo no tiene vista en la web interna.
