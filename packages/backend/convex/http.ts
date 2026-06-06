import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Registra las rutas HTTP necesarias para Convex Auth.
auth.addHttpRoutes(http);

export default http;
