# Tablero Dribbble — Hercom

## Cuántas pantallas tiene Hercom

| Superficie | Cantidad | Qué es |
| --- | ---: | --- |
| **Tablero Dribbble (estas filas)** | **24** | Las que se capturan para inversionistas |
| App móvil (archivos `screens/`) | 11 | Login, home, paneles, registro, checklist, etc. |
| App móvil (estados / menú / modales) | +13 | Pedido, ofertas, anticipo, emergencia, saldo… |
| Web admin (login + 8 secciones) | 9 | Evaluación de choferes y operación |
| Landing (`hercom.pe`) | 6 | Marketing + viaje en vivo `/live` |

**Para el shot tipo Dribbble (filas de 3, 4 y 5): 24 pantallas.**  
Si sumás landing y el resto del admin: **~33 superficies**.

Las ilustraciones Storyset (AVIF/PNG) de esta carpeta **no son pantallas**: van de decoración al lado del mockup.

---

## Cómo se organiza el tablero

Un post Dribbble = **una fila**. Mismo iPhone en móvil; MacBook solo en admin.

Subí los PNG a `imagenes/capturas/` con el nombre de la columna **Archivo**.

### Fila de 3 — Onboarding

| # | Vista | Dónde | Archivo |
| --- | --- | --- | --- |
| 1 | Login Google (logo Hercom) | App · sin sesión | `01-login.png` |
| 2 | Identidad cliente (DNI) | App · primer uso | `02-identidad-cliente.png` |
| 3 | Registro chofer (DNI, brevete, CUL) | App · ☰ Modo conductor | `03-registro-chofer.png` |

### Fila de 4 — Pedido de servicio

| # | Vista | Dónde | Archivo |
| --- | --- | --- | --- |
| 4 | Mapa + “¿Dónde necesitas un chofer…?” | App · modo cliente | `04-pedir-servicio.png` |
| 5 | Ofertas de choferes | App · servicio pending | `05-ofertas.png` |
| 6 | Anticipo 25% + código | App · modal anticipo | `06-anticipo.png` |
| 7 | Viaje en vivo / compartir | App · mapa en vivo | `07-viaje-vivo.png` |

### Fila de 5 — Chofer en la calle

| # | Vista | Dónde | Archivo |
| --- | --- | --- | --- |
| 8 | Solicitud en revisión | App · post-registro | `08-solicitud-revision.png` |
| 9 | Servicios del chofer | App · modo conductor | `09-servicios-chofer.png` |
| 10 | Solicitudes abiertas (ofertar) | App · menú Ofertas | `10-solicitudes-abiertas.png` |
| 11 | Checklist del vehículo | App · Llegó al punto → Abrir checklist | `11-checklist.png` |
| 12 | Ganancias / saldo | App · menú Ganancias o Recargar saldo | `12-ganancias.png` |

### Fila de 3 — Emergencia (sí o sí)

| # | Vista | Dónde | Archivo |
| --- | --- | --- | --- |
| 13 | Home con FAB rojo **AYUDA** | App · mapa (sin abrir el menú) | `13-fab-ayuda.png` |
| 14 | Sheet **Emergencia** (105) | App · tap AYUDA | `14-emergencia.png` |
| 15 | Hospital / clínica cercana | App · Ir a hospital o clínica | `15-salud-cercana.png` |

### Fila de 4 — Cuenta y confianza

| # | Vista | Dónde | Archivo |
| --- | --- | --- | --- |
| 16 | Drawer cliente (☰) | App · menú lateral | `16-menu-cliente.png` |
| 17 | Mis servicios | App · historial | `17-mis-servicios.png` |
| 18 | Seguridad | App · menú Seguridad | `18-seguridad.png` |
| 19 | Chat de ayuda | App · menú Ayuda | `19-chat-ayuda.png` |

### Fila de 5 — Web interna

| # | Vista | Dónde | Archivo |
| --- | --- | --- | --- |
| 20 | Login admin | http://localhost:5174 | `20-admin-login.png` |
| 21 | **Choferes** + dossier (aprobar / rechazar) | Admin · evaluación | `21-admin-choferes.png` |
| 22 | Servicios (operación en vivo) | Admin | `22-admin-servicios.png` |
| 23 | Recargas (billetera chofer) | Admin | `23-admin-recargas.png` |
| 24 | Soporte | Admin | `24-admin-soporte.png` |

---

## ¿Captura manual o las recreo desde Cursor?

**Las 24 de la app móvil: captura en el celular.**  
Desde acá no puedo renderizar Expo Go (mapa, NativeWind, cámara, Waze) como se ve en el dispositivo. Generar las pantallas con IA se nota: no es Hercom, y un inversionista lo ve.

**Admin (20–24):** si el panel está en `localhost:5174`, se pueden sacar del navegador (vos o con el browser del IDE). Sigue siendo la UI real, no un redibujo.

**Qué sí hice acá:** este tablero + la carpeta `capturas/` con la lista de archivos. Vos llenás los PNG.

Flujo de captura: Expo Go con túnel (`pnpm.cmd mobile:tunnel`) → recorré cada fila → screenshot → pegá en `imagenes/capturas/` con el nombre de la tabla.
