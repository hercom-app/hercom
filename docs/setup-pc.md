# Setup en una PC provisional (Windows)

Guía práctica con lo que suele fallar en una máquina nueva o prestada.
Incluye **varias terminales** (así es como se trabaja el monorepo).

---

## Qué tenés que tener instalado

| Herramienta | Para qué |
| --- | --- |
| **Git** | Clonar el repo (`git clone …`) |
| **Cursor** (o VS Code) | Editar código y abrir terminales integradas |
| **Node.js LTS** (≥ 18) | Corre `node` / `npm`; trae el runtime de JS |
| **pnpm** | Gestor de paquetes del monorepo (se instala con npm) |
| **Cuenta Convex** | Backend en la nube del equipo Hercom |
| **Expo Go** (celular, SDK 54) | Abrir la app móvil vía QR |

No hace falta instalar Convex a mano: viene en el repo y se usa con `pnpm backend:dev`.

---

## Permisos y PATH (PowerShell)

### PATH no ve Node / pnpm

Una terminal abierta **antes** de instalar Node (o una terminal nueva sin refrescar) no encuentra `node` / `npm` / `pnpm`.

Al inicio de **cada** terminal nueva, si falla:

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
node -v
```

Mejor a largo plazo: cerrar y reabrir Cursor para que herede el PATH del sistema.

### Execution Policy (scripts bloqueados)

Error típico: *no se puede cargar npm.ps1 / ejecución de scripts deshabilitada*.

Una sola vez por usuario de Windows:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Eso permite scripts locales firmados (npm/pnpm). No es un permiso de admin del PC entero; es solo para tu usuario.

---

## Variables de entorno (por qué hay varios `.env`)

Cada proceso lee **su** carpeta. El backend no le pasa la URL a Expo ni al admin automáticamente.

| Archivo | Quién lo usa | Variable | Quién lo crea |
| --- | --- | --- | --- |
| `packages/backend/.env.local` | `convex dev` | `CONVEX_URL`, `CONVEX_DEPLOYMENT`, … | Automático al correr `pnpm backend:dev` — **no editar a mano** |
| `apps/mobile/.env` | Expo / Metro | `EXPO_PUBLIC_CONVEX_URL` | Vos (o ya viene en el repo del equipo) |
| `apps/web-admin/.env.local` | Vite (panel admin) | `VITE_CONVEX_URL` | Vos, si levantás el admin |

La URL es la que imprime Convex, por ejemplo:

`https://perceptive-setter-262.convex.cloud`

Misma URL en mobile y admin; distinto **nombre** de variable porque Expo usa prefijo `EXPO_PUBLIC_` y Vite usa `VITE_`.

---

## Flujo en 2–3 terminales

Cloná el repo, abrí el proyecto en Cursor y trabajá así:

### Terminal A — una sola vez: deps

```powershell
cd C:\Users\…\hercom

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

node -v
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
npm install -g pnpm
pnpm install
```

### Terminal A (o la misma) — backend Convex — **dejar abierta**

```powershell
pnpm backend:dev
```

- Login en el navegador si lo pide.
- Elegí el proyecto existente **hercom**.
- Cuando diga `Convex functions ready!`, está bien.
- **No la cierres** mientras desarrollás.

### Terminal B — Expo Go con túnel (celular)

Terminal **nueva**. Si `pnpm` no se reconoce, refrescar PATH otra vez:

```powershell
cd C:\Users\…\hercom

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

pnpm --filter @proyecto/mobile start -- --tunnel --clear
```

- Escaneá el QR con **Expo Go**.
- El túnel sirve cuando el celular no está en la misma Wi‑Fi que la PC.
- Si pregunta por el puerto (8081 ocupado), podés decir que sí a otro (ej. 8082).

### Terminal C (opcional) — panel admin web

Solo si necesitás el admin. Creá antes `apps/web-admin/.env.local`:

```
VITE_CONVEX_URL=https://TU-DEPLOYMENT.convex.cloud
```

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
pnpm web:admin
```

→ http://localhost:5174

---

## Checklist “¿ya puedo codear?”

1. Terminal backend: `Convex functions ready!`
2. Terminal mobile: `Tunnel ready` + QR
3. App abre en Expo Go (login / pantalla de la app)

Si eso está, **sí**: podés mejorar código. Los cambios en `packages/backend/convex` se sincronizan solos con `convex dev` abierto; en mobile, Metro recarga al guardar.

---

## Comandos que usamos en la práctica (resumen)

```powershell
# Por terminal nueva, si hace falta:
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

node -v
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
npm install -g pnpm
pnpm install

# Terminal 1 (dejar abierta):
pnpm backend:dev

# Terminal 2 — Expo + túnel:
pnpm --filter @proyecto/mobile start -- --tunnel --clear
```

---

## No hace falta

- Cerrar Convex para abrir Expo (son terminales distintas).
- Crear `.env` del admin si solo usás mobile.
- Actualizar npm a la última major solo por el aviso.
- Instalar “Convex AI files” ni actualizar Convex en el momento de setup.
