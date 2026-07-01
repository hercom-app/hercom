# EAS Build — Setup y troubleshooting

Guía completa para generar el APK de la app móvil con Expo EAS Build.
Documenta todo lo que se configuró y los errores que se corrigieron.

---

## Arquitectura de hosting

```
┌─────────────────────────────────────────────────────┐
│  CONVEX CLOUD  (backend, BD, auth, storage)          │
│  → npx convex dev → URL: https://hip-mink-145.convex.cloud │
└─────────────────────────────────────────────────────┘
        ▲                  ▲                  ▲
        │                  │                  │ EXPO_PUBLIC_CONVEX_URL
        │                  │                  │
┌───────────────┐  ┌───────────────┐  ┌──────────────────┐
│ web-comercial │  │  web-admin    │  │   mobile (Expo)  │
│   (pendiente) │  │  (pendiente)  │  │   EAS BUILD      │
│               │  │               │  │  (APK / stores)  │
└───────────────┘  └───────────────┘  └──────────────────┘
```

La app móvil NO necesita que ninguna terminal esté corriendo en tu laptop.
El backend vive en la nube de Convex y el APK se genera en los servidores de Expo.

---

## Requisitos previos (instalados una sola vez)

### 1. pnpm
El proyecto usa pnpm como gestor de paquetes. Se instala con:

```powershell
npm install -g pnpm
```

### 2. Política de ejecución de scripts en PowerShell
Por defecto Windows bloquea los scripts `.ps1` (lo que usa `npx`, `eas`, etc.).
Se habilitó para el usuario actual con:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```

Solo se necesita hacer una vez por máquina.

---

## Paso 1 — Instalar dependencias del monorepo

Desde la raíz del proyecto:

```powershell
pnpm install
```

---

## Paso 2 — Conectar y configurar el backend Convex

Desde `packages/backend`:

```powershell
cd packages/backend
npx convex dev
```

Al ejecutarlo por primera vez:
- Te pide login (abre el navegador en `auth.convex.dev`)
- Elige **"choose an existing project"** → selecciona **hercom**
- Crea un deployment de desarrollo y guarda las URLs en `.env.local`

**URL del deployment activo:** `https://hip-mink-145.convex.cloud`

> Este deployment vive en la nube de Convex. Aunque cierres la terminal o apagues
> la laptop, el backend sigue activo. `convex dev` solo es necesario para subir
> cambios de código en vivo durante el desarrollo.

### Cargar cuentas demo

Con la terminal de `convex dev` abierta (o después de detenerla, da igual):

```powershell
npx convex run seed:seedDemo
```

Crea los usuarios demo en el deployment:
- `admin@demo.com` / `demo1234`
- `chofer@demo.com` / `demo1234`
- `cliente@demo.com` / `demo1234`

### Generar archivos del backend (_generated)

**Este paso es crítico para EAS Build.** Convex genera archivos de TypeScript
en `convex/_generated/` (`api.js`, `api.d.ts`, `dataModel.d.ts`, etc.) que
la app móvil necesita para resolver `@proyecto/backend`.

```powershell
# Desde packages/backend
npx convex codegen
```

> **IMPORTANTE:** Cada vez que modifiques el schema (`schema.ts`) o las
> funciones del backend en `packages/backend/convex/`, debes volver a correr
> `npx convex codegen` antes del siguiente build de EAS. De lo contrario el
> bundle fallará porque los archivos `_generated/` estarán desactualizados.

---

## Paso 3 — Configurar EAS Build (una sola vez)

### Login en Expo

```powershell
cd apps/mobile
npx eas-cli login
```

Abre el navegador en `expo.dev`. Se usó la cuenta de GitHub vinculada a Convex.

### Vincular el proyecto

```powershell
npx eas-cli build:configure
```

- Creó el proyecto `@gipow/choferes-reemplazo-driver` en EAS
- Vinculó el proyecto local al ID `d08dad4f-69fd-49e7-8e1f-156f4c7ae1d6`
- Escribió el `projectId` en `apps/mobile/app.json`
- Plataforma configurada: **Android**

---

## Paso 4 — Generar el APK

```powershell
# Desde apps/mobile
npx eas-cli build --platform android --profile preview
```

- Perfil **`preview`**: genera un APK instalable directamente (sin tiendas)
- La primera vez pregunta **"Generate a new Android Keystore?"** → responder **Yes**
- El build corre en la nube de Expo (tarda varios minutos)
- Al terminar da un link de descarga del `.apk`
- También queda disponible en: https://expo.dev/accounts/gipow/projects/choferes-reemplazo-driver

### Lectura del resultado (ejemplo real)

Build ejecutado:

```text
https://expo.dev/accounts/gipow/projects/choferes-reemplazo-driver/builds/c051f53f-edd1-4e93-bd75-7ef292f23181
```

Interpretación de las líneas clave del log:

- `✔ Uploaded to EAS` -> el código se subió correctamente a Expo.
- `✔ Computed project fingerprint` -> Expo validó el contenido del proyecto.
- `✔ Build finished` -> la compilación en la nube terminó bien (APK generado).
- `Open this link...` + QR -> ese link ya sirve para instalar en dispositivo real.
- `Install and run ... on an emulator? ... yes` -> aquí la CLI intenta instalar localmente en emulador.
- `adb executable doesn't seem to work` + `spawn adb ENOENT` -> no hay `adb` local (Android Studio/SDK), falla solo la instalación en emulador local, NO la build en la nube.

Conclusión: el APK del build `c051f53f-edd1-4e93-bd75-7ef292f23181` es válido y descargable desde Expo.

### Resultado del build exitoso

Al terminar correctamente, la CLI muestra:
- `✔ Build finished`
- Un **código QR** en la terminal
- El mensaje: `Open this link on your Android devices (or scan the QR code) to install the app:`

**Link de descarga del APK (primer build exitoso):**
```
https://expo.dev/accounts/gipow/projects/choferes-reemplazo-driver/builds/1046b801-a0c5-4eb9-a5ae-d697950027f7
```

Los builds futuros tendrán su propio link, siempre disponibles en:
https://expo.dev/accounts/gipow/projects/choferes-reemplazo-driver

### Instalar el APK en Android

**Opción A — Desde el celular directamente (más fácil):**
1. Escanea el QR con la cámara del celular Android
   o abre el link del build desde el navegador del celular
2. Toca **"Install"** en la página de Expo
3. Si aparece una advertencia de seguridad:
   Ajustes → Seguridad → **Instalar apps de orígenes desconocidos** → activar para el navegador
4. Instala y abre la app
5. Inicia sesión con `chofer@demo.com` / `demo1234`

**Opción B — Desde la PC:**
1. Abre el link en el navegador del PC
2. Toca **"Download"** para bajar el `.apk`
3. Pasa el archivo al celular (WhatsApp, cable USB, Google Drive, etc.)
4. Abre el `.apk` en el celular e instala

### Error "adb executable doesn't seem to work" — no es un problema

Al terminar el build, la CLI pregunta:
```
√ Install and run the Android build on an emulator?
```
Si se responde **Yes**, intenta instalar el APK en un emulador local usando
`adb` (Android Debug Bridge), que requiere tener Android Studio instalado.

```
adb executable doesn't seem to work. Please make sure Android Studio is
installed on your device and ANDROID_HOME or ANDROID_SDK_ROOT env variables are set.
spawn adb ENOENT
```

**Este error no afecta el APK.** El build ya terminó correctamente antes de
este mensaje. Solo significa que no hay emulador local disponible, lo cual es
normal si no tienes Android Studio. Para instalar la app usar el QR o el link
de descarga directamente en el celular.

Recomendación práctica:

- Si no usarás emulador local, responde **No** cuando pregunte por instalar en emulator.
- Así evitas ver el mensaje final `Error: build command failed` causado por `adb` local.
- La build remota sigue estando bien siempre que antes aparezca `✔ Build finished`.

---

## Archivos creados/modificados durante el setup

| Archivo | Cambio |
|---|---|
| `apps/mobile/eas.json` | Creado. Perfiles: `development`, `preview` (APK), `production` (AAB) con `EXPO_PUBLIC_CONVEX_URL` |
| `.npmrc` | Creado. `node-linker=hoisted` para compatibilidad de monorepo pnpm con EAS |
| `apps/mobile/metro.config.js` | `watchFolders` ahora extiende los defaults de Expo en lugar de reemplazarlos |
| `.gitignore` | La línea `**/convex/_generated/` fue comentada para que EAS reciba esos archivos |
| `apps/mobile/package.json` | `expo-document-picker` actualizado a `^14.0.8`, `expo-image-picker` a `^17.0.11` (requeridos por SDK 54) |

---

## Errores encontrados y sus causas

### Error 1: `pnpm no se reconoce`
**Causa:** pnpm no estaba instalado en la máquina.
**Solución:** `npm install -g pnpm`

### Error 2: `npx no se puede cargar` (PSSecurityException)
**Causa:** PowerShell bloquea scripts `.ps1` por política de seguridad por defecto.
**Solución:** `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

### Error 3: Build falla en "Read app config" (fallo instantáneo ~20s)
**Causa:** Había un `package-lock.json` en la raíz junto al `pnpm-lock.yaml`.
EAS infiere el gestor de paquetes por el lockfile. Al encontrar ambos, usaba
**npm** en lugar de pnpm, instalaba mal el monorepo, y al leer la config de
Expo ésta fallaba porque el entorno estaba roto.
**Solución:** Eliminar `package-lock.json` de la raíz.

### Error 4: Versiones incompatibles con Expo SDK 54
**Causa:** `expo-image-picker@16.0.6` y `expo-document-picker@13.0.3` eran
versiones anteriores a las que requiere SDK 54.
**Detectado con:** `npx expo-doctor`
**Solución:** `npx expo install --fix` desde `apps/mobile`

### Error 5: `metro.config.js` sobreescribía watchFolders
**Causa:** La config del monorepo asignaba `config.watchFolders = [workspaceRoot]`
eliminando los defaults de Expo en lugar de agregarlos.
**Detectado con:** `npx expo-doctor`
**Solución:**
```js
// Antes
config.watchFolders = [workspaceRoot];
// Después
config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot];
```

### Error 6: Build falla en "Bundle JavaScript"
**Causa:** Los archivos `convex/_generated/` (`api.js`, `api.d.ts`, etc.)
estaban excluidos del upload a EAS porque estaban en `.gitignore`.
La app importa `@proyecto/backend` cuyo `package.json` apunta a esos archivos:
```json
".": { "default": "./convex/_generated/api.js" }
```
En el servidor de EAS ese archivo no existía → Metro no podía resolver el
módulo → bundle fallaba.
**Solución:**
1. Comentar `**/convex/_generated/` en `.gitignore`
2. Generar los archivos con `npx convex codegen` (desde `packages/backend`)

---

## Flujo completo para builds futuros

```powershell
# 1. Si cambiaste el backend (schema o funciones):
cd packages/backend
npx convex codegen

# 2. Generar el APK
cd ..\..\apps\mobile
npx eas-cli build --platform android --profile preview
```

Atajo de ruta cuando estás en `packages/backend`:

```powershell
cd ..\..\apps\mobile
```

Si escribes `cd apps/mobile` desde `packages/backend`, fallará porque intentará:
`packages/backend/apps/mobile` (esa ruta no existe).

---

## Variables de entorno por plataforma

| Plataforma | Variable | Valor |
|---|---|---|
| Mobile (eas.json) | `EXPO_PUBLIC_CONVEX_URL` | `https://hip-mink-145.convex.cloud` |
| Web comercial (Vercel) | `VITE_CONVEX_URL` | `https://hip-mink-145.convex.cloud` |
| Web admin (Vercel) | `VITE_CONVEX_URL` | `https://hip-mink-145.convex.cloud` |

---

## Dónde ver logs de errores

### 1) Logs de build (EAS)

- Se muestran en la terminal y en el link `See logs: ...` que imprime EAS.
- También puedes ver historial:

```powershell
cd apps/mobile
npx eas-cli build:list --platform android --limit 10
```

### 2) Logs de backend (Convex)

- Para ver errores de funciones (`query`, `mutation`, `action`):

```powershell
cd packages/backend
npx convex logs --history 200
```

- Si quieres stream en vivo:

```powershell
npx convex logs
```

### 3) Logs de crash en Android (app ya instalada)

- Si tienes Android SDK / adb:

```powershell
adb logcat
```

- Filtrado útil (PowerShell):

```powershell
adb logcat | findstr /I "AndroidRuntime ReactNativeJS FATAL EXCEPTION"
```

Nota: si no tienes `adb`, el crash local no se ve desde EAS; en ese caso usa
Convex logs + prueba en modo desarrollo para capturar el error de JavaScript.

---

## Perfiles de build EAS

| Perfil | Tipo | Uso |
|---|---|---|
| `preview` | APK (Android) | Demos, pruebas internas — instalación directa sin tienda |
| `production` | AAB (Android) | Publicar en Google Play Store |
| `development` | Dev client | Desarrollo con hot reload nativo |

---

## Notas

- El login con **Google OAuth** necesita configuración extra para producción
  (redirect URIs en Google Cloud Console). Para demos usar **email/contraseña**.
- El deployment actual (`hip-mink-145`) es de **desarrollo**. Para producción
  estable crear un deployment de producción con `npx convex deploy`.
- Para iOS se necesita cuenta de Apple Developer (99 USD/año).
- Para publicar en Google Play se necesita cuenta de desarrollador (25 USD, una vez).
