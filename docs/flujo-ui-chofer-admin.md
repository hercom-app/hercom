# Flujo UI chofer ↔ web interna

App móvil del chofer vs panel admin (`apps/web-admin`).
Archivos: móvil en `apps/mobile/src/`, admin en `apps/web-admin/src/`.

## Tabla de interacción

| Chofer (app) | Momento | Web interna |
| --- | --- | --- |
| Alta conductor<br>`screens/DriverRegisterScreen.tsx` | **Inscripción** | Lista de choferes + expediente<br>`views/DriversView.tsx`<br>`components/DriverDossierPanel.tsx` |
| Expediente enviado<br>`screens/DriverApplicationPendingScreen.tsx` | **Revisión** | Aprobar / Rechazar<br>`components/DriverDossierPanel.tsx` |
| Recargar saldo<br>`screens/DriverDashboard.tsx` | **Recarga** | Recargas de billetera<br>`views/TopUpsView.tsx` |
| Solicitudes abiertas<br>`screens/DriverDashboard.tsx` | **Entregar oferta** | Tablero de servicios<br>`views/ServicesView.tsx`<br>`components/ServicesBoard.tsx` |
| Confirmar anticipo<br>`components/ServiceCard.tsx` | **Adelanto** | Columna anticipo en el tablero<br>`components/ServicesBoard.tsx` |
| Viaje en vivo<br>`components/LiveTripMapModal.tsx` | **Viaje** | Mapa en vivo<br>`components/ServiceLivePanel.tsx` |
| Checklist de recojo<br>`screens/ChecklistRecojoScreen.tsx` | **Checklist recojo** | — (no hay vista en admin) |
| Chat de ayuda<br>`screens/SupportChatScreen.tsx` | **Ayuda** | Soporte<br>`views/SupportView.tsx` |

`DriverApplicationPendingScreen.tsx` está diseñada; al enviar el alta hoy la app vuelve a Home y no la abre.

---

## Inventario — qué debe entregar el chofer al alta

Lo revisa Hercom en **Choferes → expediente** (`DriverDossierPanel.tsx`).
Todo es obligatorio para enviar `DriverRegisterScreen.tsx`.

### Datos

- [ ] DNI (8 dígitos) validado con RENIEC
- [ ] Sexo (M / F)
- [ ] Zona: país, departamento, provincia, distrito
- [ ] Número de brevete
- [ ] Categoría de brevete (clase A)
- [ ] Tipo de vehículo: auto o camioneta

### Brevete — una de las dos vías

**Físico (tarjeta)**

- [ ] Foto anverso
- [ ] Foto reverso
- [ ] Selfie sosteniendo el brevete

**Digital**

- [ ] PDF o imagen del brevete digital (MTC)
- [ ] Selfie con el brevete impreso a tamaño real

### PDFs (siempre)

- [ ] Récord de conductor (MTC) — PDF
- [ ] CUL · Certificado Único Laboral (MTPE) — PDF

---

## Inventario — recojo (por cada viaje)

No es alta. El chofer lo marca en `ChecklistRecojoScreen.tsx` **antes de iniciar**.
La web interna hoy **no** muestra este checklist.

### Documentos del vehículo (obligatorio)

- [ ] Tarjeta de propiedad verificada
- [ ] SOAT verificado
- [ ] Revisión técnica verificada

### Datos del vehículo

- [ ] Marca
- [ ] Modelo
- [ ] Año

### Daños

- [ ] Marcas en el diagrama (`CarDamageCanvas.tsx`)
- [ ] Observaciones (obligatorio si hay marcas)

### Seguro

- [ ] Seguro vigente (si aplica)
- [ ] Nota / póliza (si marcó seguro)
