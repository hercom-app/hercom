# Setup en una PC (Windows) — arranque rápido

Para la guía **completa desde cero** (instalar Node/Git, conectar GitHub, Convex, Expo, Vercel y Cursor), usá:

→ **[0 SETUP DESDE CERO.md](./0%20SETUP%20DESDE%20CERO.md)**

Resumen de cambios sep 2026 (prod único + registro chofer):

→ **[0 CAMBIOS PROD Y REGISTRO CHOFER.md](./0%20CAMBIOS%20PROD%20Y%20REGISTRO%20CHOFER.md)**

---

## Política de ambientes (actual)

Hasta Play Store: **un solo Convex** — producción.

| Pieza | Valor |
| --- | --- |
| Convex | `https://lovable-kudu-343.convex.cloud` |
| Mobile / EAS | Misma URL en `.env` y `eas.json` |
| Web admin | `VITE_CONVEX_URL` = misma URL |
| Admin en internet | https://hercom-web-admin-opal.vercel.app/ |

---

## Arranque rápido (repo ya clonado)

```powershell
cd "C:\Users\Gustavo Miguel\Documents\hercom"

# Una vez: Node + Git + pnpm en PATH de usuario
powershell -ExecutionPolicy Bypass -File .\scripts\install-dev-tools.ps1
# Cerrar y abrir Cursor

pnpm install
powershell -ExecutionPolicy Bypass -File .\scripts\verify-convex.ps1

pnpm web:admin
powershell -ExecutionPolicy Bypass -File .\scripts\start-mobile-tunnel.ps1
```

Comandos útiles:

```powershell
cd packages\backend
npx convex deploy --yes

cd ..\..\apps\mobile
$env:EAS_BUILD = "true"
npx eas-cli build --platform android --profile preview --non-interactive --no-wait
```
