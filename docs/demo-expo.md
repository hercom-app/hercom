# Correr la app móvil en un celular (demo con Expo Go)

Guía para levantar la app de choferes (`apps/mobile`) y mostrarla en un teléfono
real mediante el código QR de Expo. Pensado para una demo rápida al cliente.

## ¿Necesito Git para esto?

**No.** Git es solo control de versiones del código; no interviene en levantar
Expo. Puedes correr la app sin inicializar un repositorio.

Git solo es recomendable (aparte) si quieres guardar historial, trabajar en
equipo o desplegar desde GitHub. Pero para la demo en el celular **no es
requisito**.

## ¿Qué se necesita realmente?

1. **Node.js 18+** instalado en la computadora.
2. **pnpm 9** (gestor de paquetes del monorepo).
3. **Dependencias instaladas** (`pnpm install`).
4. **Backend de Convex corriendo** (`convex dev`): genera los tipos
   (`convex/_generated`) y entrega la URL del deployment. La app móvil **no
   arranca sin esa URL**.
5. **Archivo `.env`** en `apps/mobile` con `EXPO_PUBLIC_CONVEX_URL`.
6. La app **Expo Go** en el teléfono del cliente:
   - iOS: App Store → "Expo Go".
   - Android: Play Store → "Expo Go".
7. Computadora y teléfono en la **misma red Wi-Fi** (o usar modo túnel, ver
   abajo).

> **Expo Go y versión del SDK:** La app móvil usa **Expo SDK 54**, igual que la
> versión actual de Expo Go en Play Store / App Store. Si ves el error
> *"Project is incompatible with this version of Expo Go"*, asegúrate de tener
> las dependencias al día (`pnpm install` en la raíz) y reinicia Expo con caché
> limpia: `pnpm --filter @proyecto/mobile start -- --clear`.

## Pasos (Windows / PowerShell)

```powershell
# 1. Instalar pnpm (una sola vez)
npm install -g pnpm

# 2. Desde la raíz del proyecto, instalar todo el monorepo
cd C:\Users\jorge\Documents\proyecto
pnpm install

# 3. Inicializar y dejar corriendo el backend de Convex.
#    La primera vez te pedirá iniciar sesión y crear el proyecto en Convex.
#    Genera convex/_generated y muestra la URL del deployment.
pnpm --filter @proyecto/backend dev
```

Deja esa terminal abierta. La URL que imprime se ve así:

```
https://nombre-del-proyecto-123.convex.cloud
```

### Configurar las variables de entorno de auth (una sola vez)

Convex Auth necesita sus llaves JWT. En **otra terminal**, dentro del backend:

```powershell
cd C:\Users\jorge\Documents\proyecto\packages\backend
npx @convex-dev/auth
```

Esto crea las claves necesarias en el dashboard de Convex automáticamente.

### Crear el `.env` de la app móvil

Crea el archivo `apps/mobile/.env` (puedes copiar `apps/mobile/.env.example`)
y pega la URL del paso anterior:

```
EXPO_PUBLIC_CONVEX_URL=https://nombre-del-proyecto-123.convex.cloud
```

### Levantar Expo y obtener el QR

En **otra terminal**:

```powershell
cd C:\Users\jorge\Documents\proyecto
pnpm mobile
```

Esto ejecuta `expo start` y muestra un **código QR** en la terminal.

- **Android**: abre la app **Expo Go** → "Scan QR code" → escanea.
- **iOS**: abre la **cámara** del iPhone, apunta al QR y toca la notificación
  (abre en Expo Go).

La app se descarga al teléfono en segundos y se recarga sola al guardar cambios
(hot reload).

## Si el QR no conecta (PC sin Wi‑Fi, redes distintas, datos del celular)

Necesitas **túnel**. Hay dos planes.

### Plan A — túnel de Expo (`@expo/ngrok`) · demos habituales

Expo usa ngrok por detrás. Si falta el paquete o el túnel compartido falla, verás
algo como:

`CommandError: TypeError: Cannot read properties of undefined (reading 'body')`

**1. Liberar el puerto 8081** (si quedó un Metro/Expo anterior):

```powershell
netstat -ano | findstr ":8081"
taskkill /PID <pid> /F
netstat -ano | findstr ":8081"
```

(El comando es `taskkill` con dos **l**. Si el segundo `netstat` no imprime nada, el puerto está libre.)

**2. Instalar el helper de ngrok de Expo** (una vez por máquina / si faltaba):

```powershell
pnpm --filter @proyecto/mobile exec npx expo install @expo/ngrok
```

**3. Arrancar con túnel:**

```powershell
pnpm --filter @proyecto/mobile start -- --tunnel --clear
```

Éxito = `Tunnel connected` / `Tunnel ready` + QR y URL tipo:

`exp://….exp.direct`

No cierres esa terminal mientras demuestras.

> Esto usa el **túnel compartido de Expo** (no tu cuenta ngrok). Puede fallar otro día por saturación del servicio; si pasa, usa Plan B.

### Plan B — tu propio ngrok · cuando el Plan A falla o es inestable

**1.** Cuenta gratis en https://dashboard.ngrok.com → copia el **authtoken**.

**2.** Instalar CLI (una vez):

```powershell
winget install ngrok.ngrok
```

**3.** Autenticar (una vez):

```powershell
ngrok config add-authtoken PEGA_TU_TOKEN_AQUI
```

**4.** Terminal 1 — Expo **sin** `--tunnel`:

```powershell
pnpm --filter @proyecto/mobile start -- --clear
```

**5.** Terminal 2 — túnel propio:

```powershell
ngrok http 8081
```

Copia el host `https://xxxx.ngrok-free.app`.

**6.** En Expo Go, abrir manualmente:

```text
exp://xxxx.ngrok-free.app:80
```

(sin `https://`; usa el host que te dio ngrok.)

## Resumen de terminales para la demo

| Terminal | Comando | Para qué |
| --- | --- | --- |
| 1 | `pnpm --filter @proyecto/backend dev` | Backend Convex (debe seguir abierto) |
| 2 | `pnpm mobile` (o con `--tunnel`) | Servidor de Expo + QR |

## Notas para la demo

- En **Expo Go** funcionan NativeWind (estilos) y `expo-secure-store` (login),
  así que el borrador se ve y se usa tal cual.
- Para que un chofer vea viajes en la demo necesita:
  1. Registrarse / iniciar sesión en la app.
  2. Tener un **perfil de chofer** (tabla `drivers`) — se crea con
     `upsertDriverProfile` o manualmente desde el dashboard de Convex.
  3. Que un **admin** (web-admin) le **asigne** un servicio creado por un
     cliente (web-comercial).
- Si solo quieres mostrar la UI sin flujo completo, basta con iniciar sesión:
  verás la pantalla de disponibilidad y el estado vacío de viajes.
- Para una versión instalable sin Expo Go (APK/IPA standalone) se usa EAS Build,
  pero eso ya es fase de distribución, no necesario para este borrador.

## Cómo obtener logs para compartir (correo, WhatsApp, etc.)

Expo Go **no envía logs por correo** de forma nativa. Lo más rápido:

### 1. Terminal de la PC (mejor opción)

Los errores 500 y de bundling aparecen en la terminal donde corre `pnpm mobile`.
Selecciona el texto → **Ctrl+C** → pégalo en correo o chat.

Guardar en archivo:

```powershell
pnpm --filter @proyecto/mobile start -- --clear 2>&1 | Tee-Object -FilePath expo-log.txt
```

Adjunta `expo-log.txt`.

### 2. Captura de pantalla del celular

La pantalla roja de error en Expo Go. Comparte la imagen por correo o WhatsApp.

### 3. Menú de desarrollo en Expo Go

Agita el teléfono → menú dev → Reload (reproduce el error mientras miras la PC).

### 4. Android con USB (logcat)

```powershell
adb logcat *:S ReactNative:V ReactNativeJS:V Expo:V
```

### 5. Atajo en Metro

Con Expo corriendo, pulsa **`j`** en la terminal para abrir el depurador en el navegador.

**Recomendación:** para errores de Metro (500, módulos faltantes), la **terminal de
la PC** tiene el log completo; el celular solo muestra un resumen.
