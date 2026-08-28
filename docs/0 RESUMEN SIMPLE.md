# Resumen simple — de solicitud a valoración

Solo el viaje. Sin detalle técnico.  
Para detalle operativo y financiero ver [`4 RESUMEN FLUJO ATENCION.md`](./4%20RESUMEN%20FLUJO%20ATENCION.md).

---

## En una frase

El **cliente pide** un chofer con origen y destino → los **choferes ofertan** → el cliente **elige** → paga **25% de anticipo** → el chofer **recoge, checklist, código de seguridad y traslada** → **finaliza** → Hercom **cobra comisión** y queda **saldo pendiente** → el cliente **valora** al chofer.

---

## Paso a paso

### 1. Solicitud (cliente)
- Indica **origen**, **destino** (y paradas extra si las hay).
- Propone **tarifa base** (mínimo **S/80** = S/40/h × 2 h).
- El servicio queda **pendiente** y visible para choferes.
- Si hay **promoción festiva** en la zona, el descuento lo absorbe Hercom.

### 2. Ofertas (choferes)
- Choferes **disponibles** ven la solicitud.
- Necesitan **saldo en billetera** (comisión Hercom = 25% de lo que oferten; piso S/-10).
- Cada chofer envía **una oferta** (tarifa ≥ tarifa base).
- El cliente recibe **notificación** por cada oferta.

### 3. Elección (cliente)
- Cliente compara **precio, placa, rating, viajes**.
- **Acepta una oferta** → queda chofer asignado.
- Se genera **código de seguridad** (4 dígitos) y el **anticipo del 25%**.

### 4. Anticipo (cliente ↔ chofer)
- Cliente entrega **25% en efectivo** al chofer (sobre la tarifa acordada).
- Chofer **confirma en la app** que lo recibió.
- Sin esa confirmación **no puede salir** a recoger.

### 5. Camino al recojo (chofer)
- Chofer marca **“Salir a recoger”**.
- App abre **Waze** al origen.
- Cliente recibe aviso y puede **ver ubicación en vivo** y **compartir el viaje** (`https://hercom-landing.vercel.app/live/{token}`; en prod: `www.hercom.pe/live/{token}`).

### 6. Llegada al recojo (chofer)
- Chofer marca **“Llegué al punto”**.
- Cliente recibe aviso para dar el **código de seguridad**.

### 7. Checklist y inicio (chofer)
- Chofer abre **checklist** (pantalla aparte): documentos, datos del auto, daños en canvas.
- Guarda checklist → vuelve al servicio.
- Ingresa **código de seguridad** del cliente + **deslizar** para confirmar.
- Viaje pasa a **en curso**; Waze abre ruta al destino.

### 8. Traslado (chofer)
- Si hay **paradas intermedias**, confirma llegada a cada una.
- Al llegar al destino final → **“Llegué al destino”** → **“Finalizar viaje”**.

### 9. Cierre y dinero (sistema + admin)
- Hercom **descuenta 25%** (comisión) del **saldo del chofer**.
- Chofer vuelve **disponible**.
- Queda registro de **pago pendiente del cliente** por el **75% restante** (el 25% ya se pagó al chofer al inicio).
- Admin en web interna puede **marcar el pago como cobrado**.

### 10. Valoración (cliente)
- Con el viaje **finalizado**, el cliente ve **estrellas 1–5** (y comentario opcional).
- Solo puede valorar **una vez** por viaje.
- El **promedio de estrellas** del chofer se actualiza.

---

## Estados del servicio (orden normal)

```
pendiente → asignado → [anticipo confirmado] → saliendo a recoger
→ llegó al recojo → en curso → llegó al destino → finalizado
```

También puede **cancelarse** (cliente o admin) antes de terminar.

---

## Quién hace qué

| Rol | App / canal |
|-----|-------------|
| Cliente | App móvil (solicitar, elegir oferta, código, valorar, compartir) |
| Chofer | App móvil (ofertar, estados, checklist, GPS en vivo) |
| Familiar | Web comercial `/live/{token}` |
| Operaciones | Web admin (servicios, pagos, recargas, promociones) |

---

## Documentos relacionados

- Checklist de recojo: [`checklist-recojo-vistas.md`](./checklist-recojo-vistas.md)
- Flujo operativo detallado: [`4 RESUMEN FLUJO ATENCION.md`](./4%20RESUMEN%20FLUJO%20ATENCION.md)
- Reglas formales (BRD): [`1 BUSINESS RULES DOCUMENT.md`](./1%20BUSINESS%20RULES%20DOCUMENT.md)
