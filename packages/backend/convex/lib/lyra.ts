export type LyraCreatePaymentResponse = {
  status?: string;
  answer?: { formToken?: string };
  errorMessage?: string;
  detailedErrorMessage?: string;
};

export type LyraCreatePaymentOrderResponse = {
  status?: string;
  answer?: {
    paymentURL?: string;
    paymentOrderId?: string;
    orderId?: string;
  };
  errorMessage?: string;
  detailedErrorMessage?: string;
};

export type LyraOrderGetResponse = {
  status?: string;
  answer?: {
    transactions?: Array<{
      status?: string;
      detailedStatus?: string;
      operationType?: string;
      uuid?: string;
    }>;
    orderStatus?: string;
  };
};

function lyraCredentials(): { user: string; password: string; base: string } {
  const user = process.env.LYRA_REST_USER;
  const password = process.env.LYRA_REST_PASSWORD;
  const base = process.env.LYRA_API_BASE ?? "https://api.micuentaweb.pe";
  if (user === undefined || user === "" || password === undefined || password === "") {
    throw new Error(
      "Faltan LYRA_REST_USER y LYRA_REST_PASSWORD en el entorno de Convex (modo test).",
    );
  }
  return { user, password, base };
}

function basicAuthHeader(user: string, password: string): string {
  const raw = `${user}:${password}`;
  const bytes = new TextEncoder().encode(raw);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return `Basic ${btoa(binary)}`;
}

async function lyraPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { user, password, base } = lyraCredentials();
  const response = await fetch(`${base}/api-payment/V4/${path}`, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(user, password),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as T & {
    status?: string;
    errorMessage?: string;
    detailedErrorMessage?: string;
  };
  if (json.status !== undefined && json.status !== "SUCCESS") {
    const detail = json.detailedErrorMessage ?? json.errorMessage ?? response.statusText;
    throw new Error(`Lyra ${path}: ${detail}`);
  }
  return json;
}

/** amountPen en soles → céntimos PEN para CreatePayment. */
export function penToLyraAmount(amountPen: number): number {
  return Math.round(amountPen * 100);
}

export async function lyraCreateFormToken(args: {
  amountPen: number;
  orderId: string;
  customerEmail?: string;
}): Promise<string> {
  const payload: Record<string, unknown> = {
    amount: penToLyraAmount(args.amountPen),
    currency: "PEN",
    orderId: args.orderId,
    formAction: "PAYMENT",
  };
  if (args.customerEmail !== undefined && args.customerEmail !== "") {
    payload.customer = { email: args.customerEmail };
  }
  const result = await lyraPost<LyraCreatePaymentResponse>("Charge/CreatePayment", payload);
  const token = result.answer?.formToken;
  if (token === undefined || token === "") {
    throw new Error("Lyra no devolvió formToken.");
  }
  return token;
}

/**
 * Modo redirección (doc: enlace de pago URL) — el chofer paga en secure.micuentaweb.pe.
 * @see https://secure.micuentaweb.pe/doc/es-PE/rest/V4.0/api/kb/url_payment_order.html
 */
export async function lyraCreatePaymentUrl(args: {
  amountPen: number;
  orderId: string;
  customerEmail?: string;
}): Promise<{ paymentURL: string; paymentOrderId: string }> {
  const payload: Record<string, unknown> = {
    amount: penToLyraAmount(args.amountPen),
    currency: "PEN",
    orderId: args.orderId,
    channelOptions: { channelType: "URL" },
    locale: "es_PE",
    dataCollectionForm: false,
  };
  if (args.customerEmail !== undefined && args.customerEmail !== "") {
    payload.customer = { email: args.customerEmail };
    payload.paymentReceiptEmail = args.customerEmail;
  }
  const result = await lyraPost<LyraCreatePaymentOrderResponse>(
    "Charge/CreatePaymentOrder",
    payload,
  );
  const paymentURL = result.answer?.paymentURL;
  const paymentOrderId = result.answer?.paymentOrderId;
  if (paymentURL === undefined || paymentURL === "") {
    throw new Error("Izipay no devolvió paymentURL.");
  }
  if (paymentOrderId === undefined || paymentOrderId === "") {
    throw new Error("Izipay no devolvió paymentOrderId.");
  }
  return { paymentURL, paymentOrderId };
}

/** embedded = página propia con Krypton; redirect = enlace secure.micuentaweb.pe (default). */
export function lyraCheckoutMode(): "embedded" | "redirect" {
  const raw = (process.env.LYRA_CHECKOUT_MODE ?? "redirect").toLowerCase();
  return raw === "embedded" ? "embedded" : "redirect";
}

function txLooksPaid(status: string, detailedStatus: string): boolean {
  const statusU = status.toUpperCase();
  const detailedU = detailedStatus.toUpperCase();
  return (
    statusU === "PAID" ||
    detailedU === "AUTHORISED" ||
    detailedU === "CAPTURED" ||
    statusU === "AUTHORISED" ||
    statusU === "CAPTURED"
  );
}

/** Consulta Order/Get — máx. ~1 llamada/min por orderId (doc Lyra). */
export async function lyraOrderIsPaid(orderId: string): Promise<boolean> {
  const result = await lyraPost<LyraOrderGetResponse>("Order/Get", {
    orderId,
    operationType: "DEBIT",
  });
  const orderStatus = (result.answer?.orderStatus ?? "").toUpperCase();
  if (orderStatus === "PAID" || orderStatus === "CAPTURED" || orderStatus === "AUTHORISED") {
    return true;
  }
  const transactions = result.answer?.transactions ?? [];
  return transactions.some((tx) =>
    txLooksPaid(tx.status ?? "", tx.detailedStatus ?? ""),
  );
}

export function lyraPublicKey(): string {
  const key = process.env.LYRA_PUBLIC_KEY;
  if (key === undefined || key === "") {
    throw new Error("Falta LYRA_PUBLIC_KEY en Convex (clave pública de test).");
  }
  return key;
}

export function lyraKryptonScriptUrl(): string {
  return (
    process.env.LYRA_KRYPTON_JS_URL ??
    "https://static.micuentaweb.pe/static/js/krypton-client/V4.0/stable/kr-payment-form.min.js"
  );
}