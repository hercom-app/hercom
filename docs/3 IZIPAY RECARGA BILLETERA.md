# Izipay (Lyra / Mi Cuenta Web) — recarga de billetera del chofer

Resumen para Hercom. Plataforma: [secure.micuentaweb.pe](https://secure.micuentaweb.pe) · tienda **HERCOM CHOFERES** · id **50595278**.

Documentación de modos: [Crear un pago — incrustado, redirección, inApp](https://secure.micuentaweb.pe/doc/es-PE/overview/immediate-payment.html).

## Qué hace el chofer (objetivo tipo Yango Pro)

1. En la app: **Dinero → Recargar** → monto libre (**S/10 – S/500**).
2. **Pagar con Izipay** → el servidor crea el cobro y la app abre el **enlace oficial de Izipay** (`https://secure.micuentaweb.pe/...`).
3. Paga en la pantalla de Izipay (tarjeta, Yape, etc., según la tienda).
4. Al volver a la app se **confirma solo** el pago con el servidor; si Izipay aún no responde, queda **Confirmar pago** como respaldo.

El chofer **no** puede acreditarse saldo sin pago real: el servidor no confía en el móvil.

## ¿Qué tiene que ver Convex?

**Convex es solo el backend de Hercom**, no la “tienda web” ni la marca del pago:

| Pieza | Dónde vive | Para qué |
| --- | --- | --- |
| Claves REST Izipay (secretas) | Convex (env) | `CreatePayment` / `CreatePaymentOrder`, `Order/Get`, futuro IPN |
| Órdenes pendientes y saldo | Convex (BD) | `walletTopUpOrders`, `driverWallets` |
| Pantalla de pago del chofer | **Izipay** (`secure.micuentaweb.pe`) en modo **redirección** | Tarjeta, Yape, etc. |

La ruta `*.convex.site/lyra/checkout` era un **atajo del modo incrustado** (widget Krypton en una HTML mínima) porque aún no había SDK móvil. **No es el flujo deseado.** Por defecto usamos **`LYRA_CHECKOUT_MODE=redirect`** (enlace de pago de Izipay). La página Convex solo queda como respaldo si alguien fuerza `embedded`.

## Los 3 modos Izipay (y cuál usamos)

| Modo (doc Izipay) | Experiencia | Hercom |
| --- | --- | --- |
| **Incrustado** | Formulario en *tu* web | Respaldo: HTML en Convex + Krypton (`embedded`) |
| **Redirección** | Link a la plataforma Izipay | **Activo (default):** `Charge/CreatePaymentOrder` → `paymentURL` |
| **inApp** | SDK en la app, sin salir | **Próximo ideal:** `@lyracom/react-native-sdk-payment-module` + mismo `formToken` / confirmación servidor |

Referencia enlace de pago: [Generar un enlace de pago](https://secure.micuentaweb.pe/doc/es-PE/rest/V4.0/api/kb/url_payment_order.html).

SDK React Native: [Guía de integración React Native](https://secure.micuentaweb.pe/doc/es-PE/mobp/integration_guide/react_native/index.html).

## Claves en Convex (nunca en git)

| Variable | Contenido |
| --- | --- |
| `LYRA_REST_USER` | Usuario REST (ej. `50595278`) |
| `LYRA_REST_PASSWORD` | Contraseña API REST (test o prod) |
| `LYRA_PUBLIC_KEY` | Clave pública (para SDK / embedded) |
| `LYRA_API_BASE` | `https://api.micuentaweb.pe` (opcional) |
| `LYRA_HMAC_KEY` | HMAC test/prod (IPN) |
| `LYRA_CHECKOUT_MODE` | `redirect` (default) o `embedded` |

## Flujo técnico (redirect, default)

```
App (chofer)
  → walletTopUps:beginTopUp { amountPen }
      → POST Charge/CreatePaymentOrder (channelType URL)
      → insert walletTopUpOrders (pending)
      → checkoutUrl = answer.paymentURL (secure.micuentaweb.pe)
  → Navegador: pantalla de pago Izipay
  → Al cerrar navegador: fulfillTopUp { orderDocId }
      → POST Order/Get
      → si pagado: driverWallets + walletTransactions (top_up)
```

Archivos: `lib/lyra.ts`, `walletTopUps.ts`, `walletTopUpOrders.ts`, `DriverWalletTopUpView.tsx`.

## Próximos pasos (más rápido / menos fricción)

1. **IPN** en Back Office → Convex: acreditar sin esperar al cierre del navegador.
2. **SDK inApp** (dev build EAS): pago dentro de la app como apps tipo Yango.
3. Claves **PRODUCTION** cuando cierren pruebas en la tienda.

## Referencias

- [CreatePayment](https://secure.micuentaweb.pe/doc/es-PE/rest/V4.0/api/playground/Charge/CreatePayment)
- [CreatePaymentOrder](https://secure.micuentaweb.pe/doc/es-PE/rest/V4.0/api/playground/Charge/CreatePaymentOrder)
- [Order/Get](https://secure.micuentaweb.pe/doc/es-PE/rest/V4.0/api/playground/Order/Get)
- [Tarjetas de prueba](https://secure.micuentaweb.pe/doc/es-PE/rest/V4.0/api/kb/test_cards.html)