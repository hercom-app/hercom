# Resumen simple

Guía rápida del viaje en Hercom. Solo pasos, sin detalle técnico.

---

## Cliente

1. Entra a la app e inicia sesión.
2. Pide un chofer: indica **origen** (la app puede detectar ubicación y región por GPS), **destino principal** y, si hace falta, **destinos adicionales**.
3. Propone una **tarifa base** (mínimo S/80 = 2 horas a S/40/h). Si hay promoción en su zona, ve el descuento antes de enviar.
4. Envía la solicitud y espera **ofertas de choferes**.
5. Revisa placa, rating y precio de cada oferta y **elige un chofer**.
6. Recibe un **código de seguridad** y el monto del **anticipo (25%)** de la tarifa acordada.
7. Entrega ese anticipo en efectivo al chofer cuando corresponda.
8. Sigue el avance del viaje por notificaciones (chofer en camino, chofer llegó, etc.).
9. Al iniciar el viaje, comparte el **código de seguridad** con el chofer.
10. Al terminar el viaje, paga al chofer el **saldo restante** (75% de la tarifa, fuera de la app por ahora).

---

## Chofer

1. Entra a la app, completa su registro y **recarga saldo** en la billetera (necesita saldo para poder ofertar).
2. Se pone **disponible** y ve solicitudes cercanas a su operación.
3. Envía una **oferta** con su tarifa (no puede ser menor que la base del cliente).
4. Si el cliente lo elige, el servicio queda asignado a él.
5. Espera el **anticipo del 25%**, lo recibe del cliente y lo **confirma en la app**.
6. Pulsa **Salir a recoger** — se abre **Waze** hacia el punto de origen.
7. Al llegar, avisa que **llegó al punto de partida**.
8. Completa el **checklist** (estado del vehículo, tarjeta de propiedad, SOAT).
9. Pide el **código de seguridad** al cliente, lo ingresa y **desliza para iniciar el viaje** — se abre **Waze** hacia el destino (o la primera parada).
10. Conduce al cliente. Si hay **varias paradas**, marca cada llegada; la app abre Waze a la siguiente hasta la última.
11. En la **última parada**, confirma que **llegó al destino final**.
12. **Finaliza el viaje** en la app. El sistema descuenta la comisión y queda registrado el cobro pendiente del cliente.

---

## Web admin (operaciones)

Acceso solo para cuentas con rol **administrador**. Es el panel interno de Hercom para supervisar y cerrar la operación del día.

**Cuenta demo (local):** `admin@demo.com` / `demo1234`  
Si no entra, crear o reparar cuentas demo:

```powershell
cd packages/backend
npx convex run seed:seedDemo
```

**Levantar el panel:** terminal 1 → `pnpm --filter @proyecto/backend dev`; terminal 2 → `pnpm web:admin`; abrir http://localhost:5174

**Producción:** https://admin.hercom.pe (ver `docs/6 DEPLOY ADMIN VERCEL.md`).

Ver filtros y secciones en `docs/5 WEB ADMIN PANEL.md`.

### Entrada

1. Entra a la **web admin** e inicia sesión con cuenta autorizada.
2. Si la cuenta no es admin, no puede usar el panel.

### Usuarios

3. Revisa la lista de **cuentas registradas** (nombre, correo, teléfono, fecha de registro).
4. Cambia el **rol** de una persona si hace falta: cliente, chofer o administrador.

### Promociones festivas

5. Crea promociones por **región** (departamento, provincia o distrito) y **fechas**.
6. Define el **descuento** (tope 25%). El descuento lo absorbe Hercom; el chofer mantiene su parte sobre la tarifa de lista.
7. **Activa o desactiva** promociones según la campaña.
8. **Elimina** promociones que ya no aplican.

### Viajes premium (teléfono / gestión manual)

9. Registra solicitudes que **no vienen de la app móvil**: llamadas telefónicas o casos gestionados a mano.
10. Elige al **cliente**, la **región del recojo**, origen, destino, tarifa base y canal (teléfono o web comercial).
11. La solicitud queda marcada como **premium** y sigue el mismo flujo de chofer y cliente desde ahí.

### Tablero de servicios

12. Ve **todos los viajes** en curso e históricos.
13. Filtra por tipo: **todos**, **app** (autoservicio móvil) o **premium** (teléfono / web comercial).
14. Supervisa en cada fila: ruta, precio, promoción, comisión, anticipo, si el chofer confirmó el anticipo, estado del viaje, código de inicio y chofer asignado.
15. Usa este tablero para **monitorear** el avance (salida a recoger, en viaje, llegada, finalizado, cancelado).

### Recargas del día

16. Consulta cuánto han **recargado los choferes hoy** en su billetera (total del día y detalle por chofer).

### Cierre de dinero

17. Revisa **pagos pendientes del cliente** (saldo restante después del anticipo del 25%).
18. Cuando el cliente pagó en la vida real, **marca el pago como pagado**.
19. Revisa **comisiones acumuladas de choferes** pendientes de liquidar con Hercom.
20. Cuando se liquidó la comisión, **marca la comisión como liquidada**.

---

## En una frase

El **cliente** pide, elige chofer, paga anticipo y saldo; el **chofer** oferta, recoge, valida con código, navega con Waze y cierra el servicio; **operaciones (web admin)** configura promociones, registra viajes premium, monitorea servicios y cierra pagos y comisiones.

Para más detalle operativo o técnico, ver `docs/4 RESUMEN FLUJO ATENCION.md` y `docs/3 FLUJO TECNICO LOGIN VIAJE CIERRE.md`.
