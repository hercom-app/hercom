import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { lyraKryptonScriptUrl, lyraPublicKey } from "./lib/lyra";

/** Página HTML con el formulario embebido de Lyra (pruebas en navegador). */
export const checkoutPage = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const lyraOrderId = url.searchParams.get("order")?.trim() ?? "";
  if (lyraOrderId === "") {
    return new Response("Falta el parámetro order.", { status: 400 });
  }
  const order = await ctx.runQuery(internal.walletTopUpOrders.getOrderForCheckout, {
    lyraOrderId,
  });
  if (order === null || order.status !== "pending") {
    return new Response("Orden no válida o expirada.", { status: 404 });
  }
  if (Date.now() - order.createdAt > 14 * 60 * 1000) {
    return new Response("El formToken expiró. Vuelve a la app e inicia otra recarga.", {
      status: 410,
    });
  }

  const publicKey = lyraPublicKey();
  const scriptUrl = lyraKryptonScriptUrl();
  const safeToken = order.formToken.replace(/"/g, "&quot;");
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Recarga Hercom (test)</title>
  <link rel="stylesheet" href="https://static.micuentaweb.pe/static/js/krypton-client/V4.0/stable/kr-payment-form.css" />
  <script
    src="${scriptUrl}"
    kr-public-key="${publicKey}"
    kr-post-url-success="kr-payment-success"
  ></script>
</head>
<body style="font-family: system-ui, sans-serif; padding: 16px; max-width: 480px; margin: 0 auto;">
  <h1 style="font-size: 1.25rem;">Hercom · Recarga S/ ${order.amountPen.toFixed(2)}</h1>
  <p style="color: #555; font-size: 0.9rem;">Pago seguro con Izipay. En modo test puedes usar la tarjeta Visa 4970100000000055.</p>
  <div class="kr-embedded" kr-form-token="${safeToken}"></div>
  <p style="margin-top: 24px; color: #666; font-size: 0.85rem;">Al terminar, cierra el navegador, vuelve a la app Hercom y pulsa «Confirmar pago».</p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});