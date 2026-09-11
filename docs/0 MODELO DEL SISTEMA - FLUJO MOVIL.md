# Flujo móvil Hercom (cómo funciona hoy)

Hay **3 flujos UI**. Detalle y archivos: [3-flujos-ui.md](./3-flujos-ui.md).

## 1. Inscripción del chofer

| Momento | Chofer (app) | Web interna |
| --- | --- | --- |
| **Inscripción** | Alta conductor<br>`DriverRegisterScreen.tsx` | Lista + expediente<br>`DriversView.tsx` + `DriverDossierPanel.tsx` |
| **Revisión** | Expediente enviado<br>`DriverApplicationPendingScreen.tsx` | Aprobar / Rechazar<br>`DriverDossierPanel.tsx` |

## 2. Recarga de saldo del chofer

| Momento | Chofer (app) | Web interna |
| --- | --- | --- |
| **Recarga** | Recargar saldo<br>`DriverDashboard.tsx` | Recargas de billetera<br>`TopUpsView.tsx` |

## 3. Flujo de servicio

| Momento | Cliente | Chofer | Web interna |
| --- | --- | --- | --- |
| **Pedir viaje** | Pedir servicio<br>`ClientDashboard.tsx` | — | Tablero · Pendiente<br>`ServicesView.tsx` + `ServicesBoard.tsx` |
| **Entregar oferta** | Ofertas recibidas<br>`ClientDashboard.tsx` | Solicitudes abiertas<br>`DriverDashboard.tsx` | Tablero · Pendiente<br>`ServicesBoard.tsx` |
| **Aceptar oferta** | Aceptar chofer<br>`DriverOfferModal.tsx` | Espera asignación<br>`DriverDashboard.tsx` | Tablero · Asignado<br>`ServicesBoard.tsx` |
| **Adelanto** | Transferir 25%<br>`AdvancePayoutModal.tsx` | Confirmar anticipo<br>`ServiceCard.tsx` | Columna Anticipo<br>`ServicesBoard.tsx` |
| **Salida del chofer** | Chofer en camino<br>`ClientDashboard.tsx` | Voy a recoger<br>`ServiceCard.tsx` | Yendo a recoger + mapa<br>`ServicesBoard.tsx` + `ServiceLivePanel.tsx` |
| **Llegada del chofer** | Chofer en el punto<br>`ClientDashboard.tsx` | Llegué al recojo<br>`ServiceCard.tsx` | Llegó al punto<br>`ServicesBoard.tsx` |
| **Checklist** | — | Checklist de recojo<br>`ChecklistRecojoScreen.tsx` | — |
| **Inicio de viaje** | Viaje en vivo<br>`LiveTripMapModal.tsx` | Código e iniciar<br>`ServiceCard.tsx` | En viaje + mapa<br>`ServicesBoard.tsx` + `ServiceLivePanel.tsx` |
| **Fin de viaje** | Calificar<br>`RateServiceStars.tsx` | Finalizar viaje<br>`ServiceCard.tsx` | Finalizado + pagos<br>`ServicesBoard.tsx` + `PaymentsPanel.tsx` + `PayoutsPanel.tsx` |

Inventario de documentos del chofer: [flujo-ui-chofer-admin.md](./flujo-ui-chofer-admin.md)

> Cómo ver los diagramas de más abajo: clic derecho → **Open Preview**.
> Detalle de estados Convex: sigue en las secciones 2–5.

---

## Vista general — dos modos, misma cuenta

```mermaid
flowchart LR
  subgraph Celular
    A[Login] --> B[Home]
    B --> C{Modo UI}
    C -->|pasajero| D[ClientDashboard]
    C -->|chofer| E[DriverDashboard]
  end

  D -.->|menú ☰| C
  E -.->|menú ☰| C
```

- Una cuenta = puede ser pasajero **y** chofer.
- El modo se guarda en el celular; el perfil chofer vive en Convex (`drivers`).
- Demo/QA: se puede ofertar en una solicitud propia (un solo equipo).

---

## 1. Arranque de la app

```mermaid
flowchart TD
  Start([Abrir app]) --> Sesion{¿Hay sesión?}
  Sesion -->|No| Login[SignIn / Registro]
  Login --> Sesion
  Sesion -->|Sí| Home[HomeScreen]
  Home --> Modo{Modo guardado}
  Modo -->|pasajero| Pasajero[Panel pasajero]
  Modo -->|chofer con perfil| Chofer[Panel chofer]
  Modo -->|quiere chofer sin perfil| Reg[Registro chofer]
  Reg --> Chofer
```

---

## 2. Viaje completo — pasajero y chofer **en paralelo**

Lee de arriba a abajo: la columna izquierda es el cliente; la derecha, el chofer.
Las flechas horizontales son el momento en que uno espera al otro.

```mermaid
sequenceDiagram
  actor P as Pasajero
  actor C as Chofer
  participant App as Convex

  Note over P,C: Misma persona en demo / o dos celulares en prod

  rect rgb(240,248,255)
    Note over P: Crea el viaje
    P->>App: Origen + destino + tarifa
    App-->>P: Servicio pending
  end

  rect rgb(255,248,240)
    Note over C: Oferta
    C->>App: Ofertar precio
    App-->>P: Lista de ofertas
  end

  rect rgb(240,255,240)
    Note over P: Elige chofer
    P->>App: Aceptar oferta
    App-->>P: assigned + código + anticipo 25%
    App-->>C: assigned + busy
  end

  rect rgb(255,245,238)
    Note over C: Ejecuta el viaje
    C->>App: Confirmar anticipo
    C->>C: Waze → origen
    C->>App: Llegué al recojo
    P-->>C: Dice el código
    C->>App: Checklist + código → inicia viaje
    C->>C: Waze → destino / paradas
    C->>App: Finalizar
    App-->>C: Comisión en wallet
  end
```

---

## 3. Solo pasajero — pedir viaje

```mermaid
flowchart TD
  A[Mapa + bottom sheet] --> B[Origen: Places o GPS]
  B --> C[Destino + paradas]
  C --> D[Tarifa base / oferta]
  D --> E[Solicitar]
  E --> F[(pending)]
  F --> G{¿Hay ofertas?}
  G -->|Espera| F
  G -->|Sí| H[Elegir chofer]
  H --> I[(assigned)]
  I --> J[Ve anticipo 25% y código]
  J --> K{¿Cancelar?}
  K -->|Sí| X[(cancelled)]
  K -->|No| L[Espera que el chofer avance el viaje]
```

---

## 4. Solo chofer — ofertar y conducir

```mermaid
flowchart TD
  A[Toggle disponible] --> B[Ve solicitudes pending]
  B --> C[Ofertar ≥ tarifa lista]
  C --> D{Cliente acepta?}
  D -->|No| B
  D -->|Sí| E[(assigned)]
  E --> F[Confirmar anticipo 25%]
  F --> G[Voy a recoger + Waze]
  G --> H[Llegué al recojo]
  H --> I[Checklist + código del cliente]
  I --> J[Iniciar viaje + Waze destino]
  J --> K[Paradas / destino]
  K --> L[Finalizar]
  L --> M[Comisión wallet]
```

---

## 5. Estados del servicio (máquina simple)

```mermaid
stateDiagram-v2
  [*] --> pending: Cliente solicita
  pending --> assigned: Acepta oferta
  pending --> cancelled: Cancela
  assigned --> heading_to_pickup: Anticipo OK
  heading_to_pickup --> arrived_pickup: Llegó
  arrived_pickup --> in_progress: Código OK
  in_progress --> arrived_destination: Llegó destino
  arrived_destination --> finished: Cierra viaje
  assigned --> cancelled: Cancela
  heading_to_pickup --> cancelled: Cancela
  arrived_pickup --> cancelled: Cancela
  in_progress --> cancelled: Cancela
  finished --> [*]
  cancelled --> [*]
```

`cancelled` y `finished` **no se borran**: quedan en historial / auditoría.

---

## 6. Mapas y navegación (quién hace qué)

```mermaid
flowchart LR
  subgraph En la app
    Places[Places: sugerencias]
    Geo[Geocoding: GPS → texto]
    Map[Mapa de fondo]
    Hosp[Hospitales cerca]
  end

  subgraph Fuera
    Waze[Waze: ir a origen / destino]
  end

  Places --> Key1[.env API key]
  Geo --> Key1
  Map --> Key2[app.json SDK key]
  Hosp --> Key1
  Waze --> Deep[waze:// sin key Google]
```

Detalle: [google-maps-y-waze.md](./google-maps-y-waze.md).

---

## 7. Qué NO está pulido aún (brechas)

| Tema | Hoy |
| --- | --- |
| Aprobación chofer | Se crea activo al instante (demo) |
| Código de seguridad | También lo ve el chofer en UI |
| Soporte | Número placeholder |
| Menú lateral | Varios ítems aún stub |
| Oferta propia | Permitida para QA con 1 equipo |

---

## Cómo usarlo

1. Mira el diagrama **§2** (paralelo): es el modelo mental del viaje.
2. Si algo no coincide con lo que quieres, anótalo como brecha.
3. Cuando §2 y §5 coincidan con producto, congela antes del build.
