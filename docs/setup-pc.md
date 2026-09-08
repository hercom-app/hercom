# Setup en una PC provisional (Windows)

Guía para levantar Hercom en una máquina nueva o prestada — incluye lo que
**realmente** falló en la PC con usuario `Gustavo Miguel` (sep. 2025) y cómo
evitar perder horas.

---

## Por qué tardó tanto (post-mortem honesto)

No fue un solo bug. Se encadenaron **varios problemas distintos** y cada uno
parecía el mismo síntoma: **“Something went wrong”** en Expo Go.

| # | Problema | Síntoma | Qué NO era |
| --- | --- | --- | --- |
| 1 | **Node no estaba en el PATH** del sistema | Nada arrancaba | No era el código del repo |
| 2 | **QR / URL de LAN** (`192.168.x.x`) con celular en **otra red** | Something went wrong | No era Convex ni la app |
| 3 | **`pnpm mobile:tunnel` con `--clear`** + puerto 8081 ocupado | `ngrok tunnel took too long` | No era “ngrok roto” en general |
| 4 | **Plan B ngrok manual** sin `EXPO_PACKAGER_PROXY_URL` | Manifiesto apuntaba a `:8081` local | No bastaba “tener ngrok” |
| 5 | **Metro en background** (sin terminal interactiva) + proyecto con **EAS/owner** | Metro pedía login Expo → error 500 en manifiesto | **No era el espacio en “Gustavo Miguel”** |
| 6 | Se probó **`EXPO_OFFLINE=1`** para el login | Rompió el túnel clásico | Empeoró el diagnóstico |

**Fix definitivo:** `apps/mobile/app.config.js` quita `owner` y `eas.projectId` en
desarrollo local (EAS Build sigue igual). Túnel clásico `--tunnel` **sin** `--clear`,
puerto 8081 libre, URL `exp://….exp.direct`.

---

## Esta PC en concreto

| Detalle | Valor |
| --- | --- |
| Repositorio Git | https://github.com/hercom-app/hercom |
| Ruta del repo | `C:\Users\Gustavo Miguel\Documents\hercom` |
| Node portable | `.tools\nodejs\` (no depende del PATH del sistema) |
| pnpm | `pnpm.cmd` si PowerShell bloquea `pnpm.ps1` |
| DNS | Yandex Family (`77.88.8.7`) — a veces inestable con túneles; el túnel **clásico de Expo** sí funcionó |

**Siempre** usar rutas entre comillas por el espacio en el nombre de usuario.

---

## Arranque rápido (copiar y pegar)

Abrir **2 terminales** en Cursor o PowerShell.

### En cada terminal (primero)

```powershell
$env:Path = "C:\Users\Gustavo Miguel\Documents\hercom\.tools\nodejs;" + $env:Path
cd "C:\Users\Gustavo Miguel\Documents\hercom"
```

Comprobar: `node -v` → debe mostrar v22.x.

### Terminal 1 — Convex (opcional si solo probás la app)

La app móvil ya apunta al deployment en la nube (`EXPO_PUBLIC_CONVEX_URL` en
`apps/mobile/.env`). Solo necesitás esta terminal si **editás** funciones en
`packages/backend/convex`:

```powershell
pnpm.cmd backend:dev
```

Esperar: `Convex functions ready!`

### Terminal 2 — Expo Go con túnel (celular en otra red)

**Forma recomendada** (libera 8081 y arranca túnel):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-mobile-tunnel.ps1
```

**Alternativa manual:**

```powershell
pnpm.cmd mobile:tunnel
```

**No uses** `mobile:tunnel:clean` salvo que Metro esté corrupto — `--clear` suele
hacer fallar el túnel (timeout 10 s).

Esperar en la terminal:

```text
Tunnel connected.
Tunnel ready.
```

Aparece un QR y una línea tipo:

```text
exp://XXXX-anonymous-8081.exp.direct
```

(`XXXX` cambia por proyecto; copiá la que muestre **tu** terminal.)

---

## Entrar con Expo Go

1. Abrir **Expo Go** (SDK 54).
2. **Enter URL manually** / Introducir URL.
3. Pegar la URL **completa**, con `exp://`:

```text
exp://XXXX-anonymous-8081.exp.direct
```

- **Sí** incluir `exp://`
- **No** usar `https://`
- **No** añadir `:80` (con túnel clásico no hace falta)
- **No** escanear un QR que diga `192.168…` si el celular no está en la misma Wi‑Fi

---

## Checklist “¿listo para trabajar?”

1. [ ] Terminal Expo: `Tunnel ready` + URL `exp://….exp.direct`
2. [ ] Expo Go abre la app (login / pantalla principal)
3. [ ] (Opcional) Terminal Convex: `Convex functions ready!` — solo si tocás backend

---

## Si vuelve “Something went wrong”

| Revisar | Acción |
| --- | --- |
| URL incorrecta | Debe ser `exp://….exp.direct`, no LAN ni ngrok manual |
| Puerto 8081 ocupado | Cerrar Metro viejos o usar `scripts/start-mobile-tunnel.ps1` |
| Usaste `--clear` | Reiniciar con `pnpm.cmd mobile:tunnel` (sin clean) |
| Terminal Expo cerrada | Volver a levantar túnel; la URL puede cambiar |
| Querés firma EAS en local | Una vez: `npx expo login` (cuenta `hercom-worker`) en terminal **interactiva** |

En la terminal de Expo deberían verse líneas cuando el celular conecta (bundle,
errores en rojo). Si no aparece nada, el celular no está llegando al túnel.

---

## Variables de entorno

| Archivo | Variable | Uso |
| --- | --- | --- |
| `apps/mobile/.env` | `EXPO_PUBLIC_CONVEX_URL` | Backend Convex en la nube |
| `packages/backend/.env.local` | (auto) | Solo `pnpm backend:dev` |

---

## Comandos útiles

```powershell
# PATH + carpeta (cada terminal nueva)
$env:Path = "C:\Users\Gustavo Miguel\Documents\hercom\.tools\nodejs;" + $env:Path
cd "C:\Users\Gustavo Miguel\Documents\hercom"

# Backend
pnpm.cmd backend:dev

# Mobile — túnel clásico (recomendado)
pnpm.cmd mobile:tunnel
# o
powershell -ExecutionPolicy Bypass -File .\scripts\start-mobile-tunnel.ps1

# Mobile — misma Wi‑Fi solamente (sin túnel)
pnpm.cmd mobile

# Admin web (opcional)
pnpm.cmd web:admin
```

---

## Git (Windows sin instalar Git en el sistema)

| | |
| --- | --- |
| Remoto | https://github.com/hercom-app/hercom |
| Clonar | `git clone https://github.com/hercom-app/hercom.git` |
| Git portable | `.\scripts\git.ps1` (usa `.tools\PortableGit`) |

```powershell
cd "C:\Users\Gustavo Miguel\Documents\hercom"
.\scripts\git.ps1 status
.\scripts\git.ps1 pull origin main
.\scripts\git.ps1 push origin main
```

---

## Qué tenés instalado en el repo (no repetir)

- Node 22 portable en `.tools/nodejs/` (en `.gitignore`)
- Git portable en `.tools/PortableGit/` (en `.gitignore`)
- `@expo/ngrok` en dependencias del mobile
- `apps/mobile/app.config.js` — fix Expo Go local (no tocar salvo que sepas EAS)

---

## No hace falta para empezar

- `convex dev` si solo probás la app contra la nube
- ngrok manual / Cloudflare (Plan B; ver `docs/demo-expo.md`)
- Instalar Node o Git en todo el sistema (portables en `.tools`)

---

## Referencias

- Demo cliente / QR: `docs/demo-expo.md`
- Conectar Convex: `docs/conectar-convex-expo.md`
