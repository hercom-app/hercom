# GPS y geocodificación inversa (Google Maps) — app móvil

La app cliente usa **expo-location** para leer coordenadas GPS y la **Geocoding API**
de Google Maps para obtener dirección y clasificar **departamento / provincia / distrito**
del punto de recojo (promociones y operación).

**Autocompletado al tipear** (origen, destino, paradas): ver
[google-places-autocomplete.md](./google-places-autocomplete.md).

**Mapa visual, keys en `.env` vs `app.json`, Waze y botón de ayuda:** ver
[google-maps-y-waze.md](./google-maps-y-waze.md).

## 1. Crear y restringir la API key

1. Entra a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea o selecciona un proyecto.
3. Habilita estas APIs (Maps Platform → APIs & Services → Library):
   - **Geocoding API** (GPS → dirección)
   - **Places API (New)** (autocompletado al escribir)
   - **Maps SDK for Android** (mapa visual en pantalla, Android)
   - **Maps SDK for iOS** (mapa visual en pantalla, iOS)
4. Crea una **API key** en Credentials.
5. Restringe la key:
   - **Application restrictions**: en desarrollo puedes dejarla sin restricción de app;
     en producción usa restricción por bundle (`com.proyecto.choferes`) en iOS/Android.
   - **API restrictions**: **Geocoding API** + **Places API (New)** + **Maps SDK for Android** + **Maps SDK for iOS**.

## Key en dos sitios (no es lo mismo)

| Uso | Dónde va la key | Qué hace |
| --- | --- | --- |
| Sugerencias + GPS reverse | `apps/mobile/.env` → `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | HTTP REST (Places / Geocoding). **Ya lo tenías funcionando.** |
| Mapa dibujado en pantalla | `apps/mobile/app.json` → `ios.config.googleMapsApiKey` y `android.config.googleMaps.apiKey` | SDK nativo de `react-native-maps`. |

Suele ser **la misma key de Google Cloud**, pero hay que:

1. Habilitar **Maps SDK for Android/iOS** (además de Places/Geocoding).
2. Ponerla también en `app.json` (el mapa nativo no lee el `.env` solo).
3. Reiniciar Expo con `--clear` tras cambiar `app.json`.

Documentación oficial: [Reverse Geocoding](https://developers.google.com/maps/documentation/geocoding/requests-reverse-geocoding).

## 2. Variable de entorno

En `apps/mobile/.env` (copia desde `.env.example`):

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

Reinicia Expo (`pnpm --filter @proyecto/mobile start`) después de cambiar `.env`.

Para builds EAS, agrega la misma variable en cada perfil de `apps/mobile/eas.json`
o como secret en el dashboard de Expo.

## 3. Permisos nativos

`apps/mobile/app.json` incluye el plugin `expo-location` y los textos de permiso en iOS/Android.
Tras cambiar plugins, genera un build nativo nuevo (EAS o `expo prebuild`); Expo Go puede
probar ubicación, pero conviene validar en dispositivo real.

## 4. Flujo en la app

### GPS (origen)

1. El cliente pulsa **Usar mi ubicación GPS** en `ClientDashboard` (o se detecta al abrir).
2. `detectPickupLocation()` (`apps/mobile/src/lib/pickupLocation.ts`):
   - pide permiso de ubicación en primer plano;
   - lee `latitude` / `longitude`;
   - llama a `reverseGeocodeWithGoogle()` (`apps/mobile/src/lib/googleGeocoding.ts`).
3. Google devuelve `address_components`; se mapean al catálogo Perú con
   `resolvePeruRegionFromGoogleComponents()` (`@proyecto/backend/peruLocations`).
4. Se autocompletan dirección de origen, región y coordenadas del servicio.
5. El usuario puede corregir región manualmente en `RegionPicker`.

### Autocompletado al escribir (origen, destino, paradas)

Ver guía completa: [google-places-autocomplete.md](./google-places-autocomplete.md).

## 5. Costos y límites

Geocoding API tiene cuota gratuita mensual y cobro por solicitud extra. Para pruebas
internas suele ser suficiente; monitoriza uso en Google Cloud Billing.

## 6. Solución de problemas

| Síntoma | Causa probable |
|--------|----------------|
| "Falta EXPO_PUBLIC_GOOGLE_MAPS_API_KEY" | No hay `.env` o falta reiniciar Metro |
| `REQUEST_DENIED` | Key inválida o Geocoding API no habilitada |
| Región no reconocida | Google devolvió nombres fuera del catálogo; el usuario puede elegir región manualmente |
| GPS desactivado | El usuario debe activar ubicación del dispositivo |
