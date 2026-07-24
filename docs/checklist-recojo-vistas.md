# Checklist de recojo — vistas

El checklist **no** se llena en la tarjeta de Servicios.  
En estado **Llegó al punto**, solo un botón abre una pantalla dedicada.

---

## Flujo de pantallas

```
Servicios (ServiceCard)
  └─ [Abrir checklist]  →  ChecklistRecojoScreen
                              ├─ 1. Documentos
                              ├─ 2. Datos del vehículo
                              ├─ 3. Daños (canvas por vista)
                              ├─ 4. Observaciones
                              └─ 5. Seguro (opcional)
                         → [Guardar] → vuelve a Servicios
                         → código + deslizar para iniciar viaje
```

---

## Vista A — Servicios (`arrived_pickup`)

En la tarjeta del servicio:

- Estado: **Llegó al punto**
- Botón primario: **Abrir checklist** → abre `ChecklistRecojoScreen`
- Si el checklist ya está completo: badge “Checklist listo” + código / slide
- **No** mostrar toggles de SOAT / abolladuras / etc. aquí

Implementado en código: `ServiceCard` + `ChecklistRecojoScreen` + `CarDamageCanvas`.

---

## Vista B — Checklist (pantalla completa)

Una sola pantalla con secciones (scroll). Al final: **Guardar checklist**.

### 1. Documentos (obligatorios para iniciar viaje)

| Campo | UI |
| --- | --- |
| Tarjeta de propiedad | Sí / No (verificada) |
| SOAT | Sí / No (verificado) |
| Revisión técnica | Sí / No (verificada) |

### 2. Datos del vehículo

| Campo | UI |
| --- | --- |
| Marca | texto |
| Modelo | texto |
| Año | número |

### 3. Daños — canvas por vista

Tres pestañas o pasos: **Anterior** | **Posterior** | **Lateral**.

Cada una:

- Fondo: **silueta / forma de carro** (vista correspondiente)
- El chofer **toca o marca** zonas con abolladura / daño sobre el canvas
- Las marcas se guardan como puntos/zonas por vista

### 4. Observaciones

- Campo de texto **aparte** (no mezclado con el canvas)
- Libre: detalle de daños, estado general, etc.

### 5. Seguro (opcional)

- Toggle: ¿Tiene seguro vigente?
- Si sí: póliza / nota corta (opcional)

---

## Reglas

- No se puede **iniciar viaje** sin: tarjeta de propiedad, SOAT y revisión técnica en sí.
- Canvas y observaciones: recomendados si hay daño; observaciones obligatorias si hay al menos una marca en el canvas.
- Seguro: nunca bloquea el inicio del viaje.

---

## Qué reemplaza

Hoy el checklist está **inline** en `ServiceCard` (toggles SOAT / tarjeta / abolladuras).  
Eso se saca de la tarjeta y pasa a **ChecklistRecojoScreen** según este documento.
