# Choferes de Reemplazo

Monorepo (pnpm + Turborepo) para una plataforma de "choferes de reemplazo" con un backend único de Convex compartido por tres aplicaciones.

## Estructura

```
proyecto/
├─ packages/
│  └─ backend/            # Backend Convex (schema, auth y funciones) — fuente de verdad
└─ apps/
   ├─ web-comercial/      # Vite + React + Tailwind (clientes solicitan chofer)
   ├─ web-admin/          # Vite + React + Tailwind (pagos y comisiones)
   └─ mobile/             # Expo + NativeWind (choferes, tiempo real)
```

## Requisitos

- Node.js >= 18
- pnpm 9 (`npm install -g pnpm`)
- Cuenta de [Convex](https://convex.dev)

## Puesta en marcha

```bash
# 1. Instalar dependencias en todo el monorepo
pnpm install

# 2. Inicializar el backend de Convex (genera convex/_generated y crea el deployment)
pnpm --filter @proyecto/backend dev

# 3. Copiar la URL del deployment a cada app (.env / .env.local)
#    Web:    VITE_CONVEX_URL=...
#    Mobile: EXPO_PUBLIC_CONVEX_URL=...

# 4. Levantar todo (o cada app por separado)
pnpm dev
```

Guías detalladas:

- Conexión completa con Convex y Expo (paso a paso, incluye seed):
  [`docs/conectar-convex-expo.md`](docs/conectar-convex-expo.md).
- Mostrar la app móvil en un celular real (QR + Expo Go):
  [`docs/demo-expo.md`](docs/demo-expo.md).

Scripts útiles desde la raíz:

| Script | Descripción |
| --- | --- |
| `pnpm backend:dev` | Arranca `convex dev` |
| `pnpm web:comercial` | Web de clientes |
| `pnpm web:admin` | Panel administrativo |
| `pnpm mobile` | App Expo de choferes |

## Modelo de datos (Convex)

`users`, `drivers`, `services`, `payments`, `payouts`. Ver
[`packages/backend/convex/schema.ts`](packages/backend/convex/schema.ts).

## Reglas del proyecto

- TypeScript estricto en todo el monorepo (`tsconfig.base.json`).
- Convex: `query` para leer, `mutation` para escribir.
- App móvil: solo componentes de `react-native` (`View`, `Text`, `TouchableOpacity`...), nunca etiquetas HTML; estilos con NativeWind.
