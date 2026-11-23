import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { checkoutPage } from "./lyraCheckoutHttp";

const http = httpRouter();

// Registra las rutas HTTP necesarias para Convex Auth.
auth.addHttpRoutes(http);

http.route({
  path: "/lyra/checkout",
  method: "GET",
  handler: checkoutPage,
});

export default http;
