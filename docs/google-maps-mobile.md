# GPS y geocodificación inversa (Google Maps) — app móvil

La app cliente usa **expo-location** para leer coordenadas GPS y la **Geocoding API**
de Google Maps para obtener dirección y clasificar **departamento / provincia / distrito**
del punto de recojo (promociones y operación).

## 1. Crear y restringir la API key

1. Entra a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea o selecciona un proyecto.
3. Habilita **Geocoding API** (Maps Platform → APIs & Services → Library).
4. Crea una **API key** en Credentials.
5. Restringe la key:
   - **Application restrictions**: en desarrollo puedes dejarla sin restricción de app;
     en producción usa restricción por bundle (`com.proyecto.choferes`) en iOS/Android.
   - **API restrictions**: solo **Geocoding API**.

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

1. El cliente pulsa **Usar mi ubicación GPS** en `ClientDashboard`.
2. `detectPickupLocation()` (`apps/mobile/src/lib/pickupLocation.ts`):
   - pide permiso de ubicación en primer plano;
   - lee `latitude` / `longitude`;
   - llama a `reverseGeocodeWithGoogle()` (`apps/mobile/src/lib/googleGeocoding.ts`).
3. Google devuelve `address_components`; se mapean al catálogo Perú con
   `resolvePeruRegionFromGoogleComponents()` (`@proyecto/backend/peruLocations`).
4. Se autocompletan dirección de origen, región y coordenadas del servicio.
5. El usuario puede corregir región manualmente en `RegionPicker`.

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
