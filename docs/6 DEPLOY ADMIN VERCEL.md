# Cómo publicar el panel admin en admin.hercom.pe

Guía en lenguaje simple. No hace falta ser programador para seguirla.

---

## ¿Qué estamos haciendo?

Tienes **dos cosas distintas** en internet:

| Qué | Dónde vive hoy | Para qué sirve |
| --- | --- | --- |
| **Landing** (página pública) | `www.hercom.pe` | Marketing, info de Hercom |
| **Panel admin** (uso interno) | Solo en tu PC por ahora | Operaciones: cuentas, viajes, recargas… |

Queremos que el panel admin quede en:

**https://admin.hercom.pe**

No se “sube una carpeta” a mano como en un FTP. Lo que haces es:

1. Conectar tu proyecto de GitHub con **Vercel** (servicio que publica webs).
2. Decirle a Vercel: “de este repo, publica solo la carpeta `apps/web-admin`”.
3. Poner el dominio `admin.hercom.pe` apuntando a ese sitio.

La landing (`www.hercom.pe`) **no se toca**.

---

## Antes de empezar — checklist

- [ ] El código está en **GitHub** (o GitLab).
- [ ] Tienes cuenta en [vercel.com](https://vercel.com) (puedes entrar con GitHub).
- [ ] Puedes entrar al panel donde administras el dominio **hercom.pe** (donde compraste o configuras el DNS).
- [ ] Tienes la URL de tu backend Convex (algo como `https://hip-mink-145.convex.cloud`).

---

## Paso 1 — Subir el backend a producción (Convex)

El panel admin necesita hablar con la base de datos. Eso no va en Vercel; va en **Convex**.

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
cd packages/backend
npx convex deploy
```

Cuando termine, anota la URL que te muestra (ejemplo: `https://hip-mink-145.convex.cloud`). La usarás en el paso 3.

> Si solo has usado `convex dev` en local, los usuarios admin de demo pueden no existir en producción. Necesitas una cuenta admin real ahí.

---

## Paso 2 — Crear el sitio en Vercel

### 2.1 Entrar y crear proyecto

1. Ve a [vercel.com](https://vercel.com) e inicia sesión.
2. Clic en **Add New… → Project**.
3. Elige el repositorio de este proyecto (Hercom / app-choferes-hercom).
4. Antes de darle Deploy, busca **Root Directory** (Directorio raíz):
   - Clic en **Edit**
   - Escribe o selecciona: **`apps/web-admin`**
   - Confirma

Eso le dice a Vercel: “no publiques todo el monorepo; solo la web del admin”.

### 2.2 Variable de entorno (obligatoria)

En la misma pantalla, busca **Environment Variables**:

| Nombre | Valor |
| --- | --- |
| `VITE_CONVEX_URL` | La URL de Convex del paso 1 |

Ejemplo: `https://hip-mink-145.convex.cloud`

Marca **Production** (y Preview si quieres).

### 2.3 Publicar

Clic en **Deploy** y espera unos minutos.

Si todo sale bien, Vercel te da una URL temporal, algo como:

`https://algo-random.vercel.app`

Ábrela en el navegador. Deberías ver la pantalla de login del admin Hercom.

Prueba entrar con tu usuario admin de **producción**.

---

## Paso 3 — Conectar admin.hercom.pe

Ahora el panel ya está en internet, pero con una URL fea de Vercel. Le ponemos tu dominio.

### 3.1 En Vercel

1. Entra al proyecto que acabas de crear.
2. **Settings → Domains**.
3. Escribe: **`admin.hercom.pe`**
4. Clic en **Add**.

Vercel te mostrará qué registro DNS debes crear. Suele ser un **CNAME**.

### 3.2 En tu proveedor de dominio (donde está hercom.pe)

Entra al panel DNS de `hercom.pe` y agrega un registro nuevo:

| Campo | Qué poner |
| --- | --- |
| **Tipo** | CNAME |
| **Nombre / Host** | `admin` |
| **Valor / Apunta a** | Lo que dice Vercel (normalmente `cname.vercel-dns.com`) |

Guarda. La propagación puede tardar desde 5 minutos hasta 1 hora.

### 3.3 Comprobar

Cuando Vercel marque el dominio como **Valid**, abre:

**https://admin.hercom.pe**

Deberías ver el mismo login que en la URL temporal de Vercel.

---

## ¿Qué pasa cuando cambias código?

1. Haces cambios en `apps/web-admin`.
2. Subes a GitHub (`git push`).
3. Vercel **vuelve a publicar solo** automáticamente.

No tienes que “subir la carpeta” otra vez a mano.

---

## Problemas frecuentes (en criollo)

### “Falta VITE_CONVEX_URL” o pantalla en blanco

Olvidaste la variable del paso 2.2. Agrégala en Vercel → Settings → Environment Variables y dale **Redeploy**.

### Entro pero dice “no tiene permisos de administrador”

Tu usuario existe en Convex pero **no tiene rol admin**. Hay que asignárselo en la base de datos de producción.

### Login funciona en local pero no en admin.hercom.pe

Casi seguro estás apuntando a otro Convex (dev vs producción). Revisa que `VITE_CONVEX_URL` sea la URL de **`convex deploy`**, no la de desarrollo local.

### El build falla en Vercel

Revisa que **Root Directory** sea exactamente `apps/web-admin` y que el repo tenga `pnpm-lock.yaml` en la raíz.

### No aparece el logo

Falta el archivo `hercom-logo.png` en `apps/web-admin/public/`. Agrégalo, sube a GitHub y espera el redeploy.

---

## Resumen en una frase

**Conectas GitHub con Vercel, le dices que publique `apps/web-admin`, pones la URL de Convex, y en DNS creas `admin` → Vercel.**

La landing en `www.hercom.pe` sigue igual; solo agregas un subdominio nuevo para el equipo interno.
