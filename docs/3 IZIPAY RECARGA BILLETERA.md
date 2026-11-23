# Izipay (Lyra / Mi Cuenta Web) — recarga de billetera del chofer

Resumen para Hercom. Plataforma: [secure.micuentaweb.pe](https://secure.micuentaweb.pe) · tienda **HERCOM CHOFERES** · id **50595278**.

## Qué hace el chofer

1. En la app: **Dinero → Recargar** (hoy: paquetes S/30, S/50, S/100; luego monto libre con tope).
2. **Pagar con Izipay** → Convex crea el cobro y abre un checkout en el navegador.
3. Paga con tarjeta (sandbox: [tarjetas de prueba](https://secure.micuentaweb.pe/doc/es-PE/rest/V4.0/api/kb/test_cards.html), ej. Visa aceptada `4970100000000055`).
4. Vuelve a la app y pulsa **Confirmar pago** → Convex consulta Izipay y, si está pagado, suma soles a `driverWallets`.

El chofer **no** puede acreditarse saldo sin pago real: el servidor no confía en el móvil.

## Dos tipos de claves (no mezclar)

| Origen en Back Office | Para qué | ¿Usar en Hercom? |
| --- | --- | --- |
| **Claves** → clave de test (formulario V1/V2, corta) | Formularios redirección legacy, firma HMAC del retorno | No para la API REST actual |
| **Claves de API REST** | `Charge/CreatePayment`, `Order/Get`, SDK móvil | **Sí** — solo en Convex |

En Convex (variables de entorno, **nunca en git**):

| Variable | Contenido |
| --- | --- |
| `LYRA_REST_USER` | Usuario REST (ej. `50595278`) |
| `LYRA_REST_PASSWORD` | Contraseña **de test** de la pestaña API REST |
| `LYRA_PUBLIC_KEY` | Clave pública de test (`50595278:testpublickey_…`) |
| `LYRA_API_BASE` | `https://api.micuentaweb.pe` (opcional) |
| `LYRA_HMAC_KEY` | HMAC SHA-256 de test (próximo: IPN) |

`CONVEX_SITE_URL` ya lo define Convex; sirve para la URL del checkout embebido.

## Flujo técnico (implementado)

```
App (chofer, sesión)
  → action walletTopUps:beginTopUp { amountPen }
      → POST Charge/CreatePayment (Basic auth, monto en céntimos PEN)
      → insert walletTopUpOrders (pending)
      → devuelve checkoutUrl (.convex.site/lyra/checkout?order=…)
  → Navegador: formulario Krypton + formToken
  → App: walletTopUps:fulfillTopUp { orderDocId }
      → POST Order/Get (mismo orderId)
      → si pagado: credita driverWallets + walletTransactions (top_up)
```

Archivos: `packages/backend/convex/walletTopUps.ts`, `walletTopUpOrders.ts`, `lib/lyra.ts`, `lyraCheckoutHttp.ts`, ruta HTTP `/lyra/checkout` en `http.ts`. App: `DriverWalletTopUpView.tsx`.

## Tablas Convex

- **`walletTopUpOrders`**: intento de cobro (monto, `lyraOrderId`, `formToken`, `status`: pending | paid | failed | expired).
- **`driverWallets`** / **`walletTransactions`**: saldo y movimiento `top_up` **después** de confirmar pago.

## Seguimiento en sandbox

Back Office → **Gestión → Transacciones de TEST**. Ahí ves ref. pedido (`orderId` = nuestro `lyraOrderId`, prefijo `hercom-…`), importe, estado y UUID.

Mientras no haya **URL de notificación** configurada (Reglas de notificaciones), Hercom confirma con `fulfillTopUp` o, después, con IPN.

## Monto libre vs paquete

Izipay acepta **cualquier monto** en `CreatePayment` (en céntimos). Los paquetes fijos son decisión de producto; el backend ya valida rango **S/10–S/500** (`WALLET_TOP_UP_MIN_PEN` / `MAX`). El siguiente paso de producto es input de monto en la app enviando solo `amountPen` validado en servidor.

## Próximos pasos

1. **IPN / URL de notificación** en Back Office apuntando a Convex → acreditar sin «Confirmar pago».
2. **SDK nativo** `@lyracom/react-native-sdk-payment-module` (dev build; no Expo Go) con el mismo `formToken`.
3. Claves **PRODUCTION** y `ctx_mode` producción cuando cierren pruebas del checklist de la tienda.
4. Comisión de pasarela en UI (`izipayTopUpFees.ts`) vs monto acreditado al chofer (hoy se acredita el paquete completo).

## Referencias

- [Claves API REST](https://secure.micuentaweb.pe/doc/es-PE/rest/V4.0/api/get_my_keys.html)
- [CreatePayment](https://secure.micuentaweb.pe/doc/es-PE/rest/V4.0/api/playground/Charge/CreatePayment)
- [Order/Get](https://secure.micuentaweb.pe/doc/es-PE/rest/V4.0/api/playground/Order/Get)
- [Integración React Native](https://secure.micuentaweb.pe/doc/es-PE/mobp/integration_guide/react_native/index.html)
- [Tarjetas de prueba](https://secure.micuentaweb.pe/doc/es-PE/rest/V4.0/api/kb/test_cards.html)

## Probar hoy

```powershell
cd packages/backend
npx convex deploy --yes
# Variables LYRA_* en dashboard Convex (test)
```

App con build reciente → recarga test → ver transacción en **Transacciones de TEST**.